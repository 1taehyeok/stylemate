import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, type Fit, type ResultItem } from '../store'
import { startGeneration, getGenerationResults, getImageUrl } from '../api'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

const fitOptions: Fit[] = ['슬림핏', '레귤러핏', '오버핏']

const categoryLabelMap: Record<string, string> = {
    daily: '데일리룩',
    office: '오피스룩',
    date: '데이트룩',
    active: '액티브룩',
}

export default function LoadingPage() {
    const { nextStep, height, setHeight, fit, setFit, setResults, gender, tpo, season } = useAppStore()
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const taskIdRef = useRef<string | null>(null)
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        let cancelled = false

        const start = async () => {
            try {
                const res = await startGeneration({
                    gender: gender || 'women',
                    tpo: tpo || 'daily',
                    season,
                    height,
                    fit,
                })
                if (cancelled) return
                taskIdRef.current = res.task_id

                pollingRef.current = setInterval(async () => {
                    if (!taskIdRef.current) return
                    try {
                        const result = await getGenerationResults(taskIdRef.current)

                        if (result.status === 'completed' && result.images.length > 0) {
                            const combos = result.outfit_combos || []

                            let items: ResultItem[] = []
                            if (combos.length > 0) {
                                items = combos.map((combo, i) => ({
                                    id: combo.combo_id,
                                    imageUrl: getImageUrl(combo.image_url),
                                    name: `코디 ${i + 1}`,
                                    totalPrice: combo.total_price,
                                    totalPriceDisplay: `${combo.total_price_display}원`,
                                    category: categoryLabelMap[combo.category || ''] || combo.category || '추천',
                                    items: combo.items.map((item) => ({
                                        id: item.id,
                                        name: item.name,
                                        description: item.description || '설명 정보 없음',
                                        price: item.price,
                                        priceDisplay: item.price_display,
                                        category: categoryLabelMap[item.category || ''] || item.category || '추천',
                                        imageUrl: item.image_url ? getImageUrl(item.image_url) : '',
                                        stock: item.stock_info || '재고 정보 없음',
                                        location: item.location || '매장 정보 없음',
                                    })),
                                }))
                            } else {
                                const catalog = result.recommended_items
                                items = result.images.map((img, i) => {
                                    const matched = catalog.length > 0 ? catalog[i % catalog.length] : null
                                    const singlePrice = matched?.price || 0
                                    return {
                                        id: `fallback-${img.id}`,
                                        imageUrl: getImageUrl(img.image_url),
                                        name: `코디 ${i + 1}`,
                                        totalPrice: singlePrice,
                                        totalPriceDisplay: `${matched?.price_display || '0'}원`,
                                        category: categoryLabelMap[img.category || ''] || img.category || '추천',
                                        items: matched
                                            ? [{
                                                id: matched.id,
                                                name: matched.name,
                                                description: matched.description || '설명 정보 없음',
                                                price: matched.price,
                                                priceDisplay: matched.price_display,
                                                category: categoryLabelMap[matched.category || ''] || matched.category || '추천',
                                                imageUrl: matched.image_url ? getImageUrl(matched.image_url) : '',
                                                stock: matched.stock_info || '재고 정보 없음',
                                                location: matched.location || '매장 정보 없음',
                                            }]
                                            : [],
                                    }
                                })
                            }

                            setResults(items)
                            if (pollingRef.current) clearInterval(pollingRef.current)
                            setProgress(100)
                        } else if (result.status === 'failed') {
                            setError('추천 생성에 실패했습니다. 다시 시도해주세요.')
                            if (pollingRef.current) clearInterval(pollingRef.current)
                        } else {
                            const targetImages = 8
                            const pct = Math.min(95, Math.round((result.total / targetImages) * 100))
                            setProgress((prev) => Math.max(prev, pct))
                        }
                    } catch (e) {
                        console.error('Polling error:', e)
                    }
                }, 2000)
            } catch (e: unknown) {
                if (!cancelled) {
                    const message = e instanceof Error ? e.message : '생성 요청에 실패했습니다.'
                    setError(message)
                }
            }
        }

        start()

        return () => {
            cancelled = true
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (progress >= 100) {
            const timer = setTimeout(() => nextStep(), 800)
            return () => clearTimeout(timer)
        }
    }, [progress, nextStep])

    useEffect(() => {
        if (error) return
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(interval)
                    return prev
                }
                if (prev >= 90) return prev
                return prev + 0.5
            })
        }, 300)
        return () => clearInterval(interval)
    }, [error])

    const size = 180
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius

    return (
        <div className="flex flex-col items-center justify-between h-full bg-gray-50 px-6 pb-12">
            <div className="flex flex-col items-center w-full">
                <Header />

                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 mt-4 mb-10"
                >
                    코디를 생성하고 있습니다...
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative mb-10"
                >
                    <svg width={size} height={size} className="transform -rotate-90">
                        <circle
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none" stroke="#e5e5e5" strokeWidth={strokeWidth}
                        />
                        <circle
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none" stroke="#888" strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - progress / 100)}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-700">{Math.round(progress)}%</span>
                    </div>
                </motion.div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-500 mb-4 text-center"
                    >
                        {error}
                    </motion.p>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full max-w-sm"
                >
                    <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
                        키와 핏을 알려주시면 더 정확한 추천이 가능합니다.
                    </p>

                    <div className="flex gap-3 justify-center mb-6">
                        {fitOptions.map((option) => (
                            <motion.button
                                key={option}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setFit(option)}
                                className={`px-5 py-2.5 border rounded-md text-sm font-medium transition-all
                  ${fit === option
                                        ? 'border-pink-400 text-pink-600 bg-pink-50 shadow-sm'
                                        : 'border-gray-300 text-gray-600 bg-white hover:border-gray-400'
                                    }`}
                            >
                                {option}
                            </motion.button>
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                            <button
                                onClick={() => setHeight(Math.max(100, height - 1))}
                                className="px-4 py-3 text-gray-500 hover:bg-gray-50 text-lg font-medium"
                            >
                                -
                            </button>
                            <span className="px-4 py-3 text-lg font-semibold text-gray-800 min-w-[60px] text-center">
                                {height}
                            </span>
                            <button
                                onClick={() => setHeight(Math.min(220, height + 1))}
                                className="px-4 py-3 text-gray-500 hover:bg-gray-50 text-lg font-medium"
                            >
                                +
                            </button>
                        </div>
                        <span className="text-sm text-gray-400">cm</span>
                    </div>
                </motion.div>
            </div>

            <BackButton />
        </div>
    )
}
