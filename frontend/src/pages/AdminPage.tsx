import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import {
    downloadAdminLogsCsv,
    getAdminLogs,
    getItems,
    updateItem,
    type AdminLog,
    type AdminLogFilters,
    type ItemResponse,
} from '../api'
import { useAppStore } from '../store'

interface EditableItem {
    id: number
    name: string
    price: number
    category: string
    gender: string
    stock_info: string
    location: string
}

function toEditable(item: ItemResponse): EditableItem {
    return {
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category || '',
        gender: item.gender || '',
        stock_info: item.stock_info || '',
        location: item.location || '',
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export default function AdminPage() {
    const { reset, adminSessionToken, setAdminSessionToken } = useAppStore()
    const [items, setItems] = useState<EditableItem[]>([])
    const [logs, setLogs] = useState<AdminLog[]>([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<number | null>(null)
    const [message, setMessage] = useState('')
    const [query, setQuery] = useState('')
    const [logLoading, setLogLoading] = useState(false)

    const [logEventType, setLogEventType] = useState('')
    const [logSuccess, setLogSuccess] = useState<'all' | 'true' | 'false'>('all')
    const [logDateFrom, setLogDateFrom] = useState('')
    const [logDateTo, setLogDateTo] = useState('')
    const [logPriceChangesOnly, setLogPriceChangesOnly] = useState(false)

    const buildLogFilters = (limit = 50): AdminLogFilters => ({
        limit,
        event_type: logEventType || undefined,
        success: logSuccess === 'all' ? undefined : logSuccess === 'true',
        date_from: logDateFrom || undefined,
        date_to: logDateTo || undefined,
        price_changes_only: logPriceChangesOnly,
    })

    const loadLogs = async () => {
        if (!adminSessionToken) return
        setLogLoading(true)
        try {
            const adminLogs = await getAdminLogs(adminSessionToken, buildLogFilters(100))
            setLogs(adminLogs)
        } catch (e) {
            const msg = e instanceof Error ? e.message : '로그를 불러오지 못했습니다.'
            setMessage(msg)
            if (msg.toLowerCase().includes('unauthorized')) {
                setAdminSessionToken(null)
            }
        } finally {
            setLogLoading(false)
        }
    }

    const load = async () => {
        if (!adminSessionToken) {
            setMessage('관리자 세션이 없습니다. 다시 로그인해주세요.')
            setLoading(false)
            return
        }

        setLoading(true)
        setMessage('')
        try {
            const data = await getItems()
            setItems(data.map(toEditable))
            await loadLogs()
        } catch (e) {
            const msg = e instanceof Error ? e.message : '관리자 데이터를 불러오지 못했습니다.'
            setMessage(msg)
            if (msg.toLowerCase().includes('unauthorized')) {
                setAdminSessionToken(null)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return items
        return items.filter((item) => `${item.id} ${item.name} ${item.category} ${item.gender}`.toLowerCase().includes(q))
    }, [items, query])

    const updateField = (id: number, key: keyof EditableItem, value: string) => {
        setItems((prev) => prev.map((item) => {
            if (item.id !== id) return item
            if (key === 'price') {
                return { ...item, price: Number(value) || 0 }
            }
            return { ...item, [key]: value }
        }))
    }

    const saveItem = async (item: EditableItem) => {
        if (!adminSessionToken) {
            setMessage('관리자 세션이 없습니다. 다시 로그인해주세요.')
            return
        }

        setSavingId(item.id)
        setMessage('')
        try {
            await updateItem(
                item.id,
                {
                    name: item.name,
                    price: item.price,
                    category: item.category || null,
                    gender: item.gender || null,
                    stock_info: item.stock_info || null,
                    location: item.location || null,
                },
                adminSessionToken,
            )
            setMessage(`저장 완료: #${item.id}`)
            await loadLogs()
        } catch (e) {
            const msg = e instanceof Error ? e.message : '저장에 실패했습니다.'
            setMessage(msg)
            if (msg.toLowerCase().includes('unauthorized')) {
                setAdminSessionToken(null)
            }
        } finally {
            setSavingId(null)
        }
    }

    const handleDownloadCsv = async () => {
        if (!adminSessionToken) {
            setMessage('관리자 세션이 없습니다. 다시 로그인해주세요.')
            return
        }
        try {
            const blob = await downloadAdminLogsCsv(adminSessionToken, buildLogFilters(500))
            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
            downloadBlob(blob, `admin_logs_${ts}.csv`)
        } catch (e) {
            setMessage(e instanceof Error ? e.message : 'CSV 다운로드에 실패했습니다.')
        }
    }

    return (
        <div className="flex h-full flex-col bg-gray-50">
            <div className="px-6">
                <Header />
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">관리자 페이지</h2>
                    <div className="flex gap-2">
                        <button type="button" onClick={load} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                            새로고침
                        </button>
                        <button type="button" onClick={reset} className="rounded-md border border-gray-800 bg-gray-800 px-3 py-2 text-sm text-white">
                            처음으로
                        </button>
                    </div>
                </div>

                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="ID/이름/카테고리/성별 검색"
                />
                {message && <p className="mb-3 text-sm text-gray-600">{message}</p>}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
                {loading ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">불러오는 중...</div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {filtered.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                    className="rounded-lg border border-gray-200 bg-white p-4"
                                >
                                    <div className="mb-2 text-xs text-gray-500">ID: {item.id}</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input value={item.name} onChange={(e) => updateField(item.id, 'name', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="이름" />
                                        <input type="number" value={item.price} onChange={(e) => updateField(item.id, 'price', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="가격" min={0} />
                                        <input value={item.category} onChange={(e) => updateField(item.id, 'category', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="카테고리" />
                                        <input value={item.gender} onChange={(e) => updateField(item.id, 'gender', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="성별" />
                                        <input value={item.stock_info} onChange={(e) => updateField(item.id, 'stock_info', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="재고" />
                                        <input value={item.location} onChange={(e) => updateField(item.id, 'location', e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" placeholder="매장 위치" />
                                    </div>
                                    <div className="mt-3">
                                        <button type="button" onClick={() => saveItem(item)} disabled={savingId === item.id} className="rounded-md border border-gray-800 bg-gray-800 px-3 py-2 text-sm text-white disabled:opacity-50">
                                            {savingId === item.id ? '저장 중...' : '저장'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-800">관리자 로그</h3>
                                <div className="flex gap-2">
                                    <button type="button" onClick={loadLogs} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700">필터 조회</button>
                                    <button type="button" onClick={handleDownloadCsv} className="rounded border border-gray-800 bg-gray-800 px-2 py-1 text-xs text-white">CSV 다운로드</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                <select value={logEventType} onChange={(e) => setLogEventType(e.target.value)} className="rounded border border-gray-300 px-2 py-1">
                                    <option value="">전체 이벤트</option>
                                    <option value="item_update">item_update</option>
                                    <option value="admin_login">admin_login</option>
                                    <option value="admin_logs_view">admin_logs_view</option>
                                    <option value="admin_logs_export_csv">admin_logs_export_csv</option>
                                </select>
                                <select value={logSuccess} onChange={(e) => setLogSuccess(e.target.value as 'all' | 'true' | 'false')} className="rounded border border-gray-300 px-2 py-1">
                                    <option value="all">성공/실패 전체</option>
                                    <option value="true">성공만</option>
                                    <option value="false">실패만</option>
                                </select>
                                <input type="date" value={logDateFrom} onChange={(e) => setLogDateFrom(e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                                <input type="date" value={logDateTo} onChange={(e) => setLogDateTo(e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                            </div>

                            <label className="mb-3 flex items-center gap-2 text-xs text-gray-700">
                                <input type="checkbox" checked={logPriceChangesOnly} onChange={(e) => setLogPriceChangesOnly(e.target.checked)} />
                                가격 변경 로그만 보기
                            </label>

                            <div className="space-y-1 max-h-64 overflow-y-auto text-xs text-gray-600">
                                {logLoading && <div>로그를 불러오는 중...</div>}
                                {!logLoading && logs.map((log) => (
                                    <div key={log.id} className="rounded border border-gray-100 p-2">
                                        <div>#{log.id} {log.event_type} / {log.success ? 'success' : 'failed'}</div>
                                        <div>{log.created_at || '-'} / {log.ip_address || '-'}</div>
                                        <div className="truncate">{log.detail || '-'}</div>
                                    </div>
                                ))}
                                {!logLoading && logs.length === 0 && <div>로그가 없습니다.</div>}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
