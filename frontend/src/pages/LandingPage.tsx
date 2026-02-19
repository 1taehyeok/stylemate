import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import Header from '../components/Header'
import { ADMIN_STEP } from '../constants'
import { adminAuth } from '../api'

const ADMIN_TAP_THRESHOLD = 7
const ADMIN_TAP_WINDOW_MS = 2500

export default function LandingPage() {
    const { nextStep, setLanguage, language, setStep, setAdminSessionToken } = useAppStore()
    const [showAdminPrompt, setShowAdminPrompt] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [isAuthenticating, setIsAuthenticating] = useState(false)

    const tapCountRef = useRef(0)
    const tapResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const languageLabel = useMemo(() => (language === 'ko' ? '한국어' : 'ENGLISH'), [language])

    const handleTitleTap = () => {
        tapCountRef.current += 1

        if (tapResetTimerRef.current) {
            clearTimeout(tapResetTimerRef.current)
        }
        tapResetTimerRef.current = setTimeout(() => {
            tapCountRef.current = 0
        }, ADMIN_TAP_WINDOW_MS)

        if (tapCountRef.current >= ADMIN_TAP_THRESHOLD) {
            tapCountRef.current = 0
            setPasswordInput('')
            setPasswordError('')
            setShowAdminPrompt(true)
        }
    }

    const handleAdminLogin = async () => {
        setIsAuthenticating(true)
        setPasswordError('')
        try {
            const res = await adminAuth(passwordInput, 'kiosk-main')
            if (!res.success || !res.session_token) {
                setPasswordError('비밀번호가 올바르지 않습니다.')
                return
            }
            setAdminSessionToken(res.session_token)
            setShowAdminPrompt(false)
            setStep(ADMIN_STEP)
        } catch (e) {
            setPasswordError(e instanceof Error ? e.message : '인증에 실패했습니다.')
        } finally {
            setIsAuthenticating(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-between h-full bg-gradient-to-b from-gray-50 to-gray-100 px-6 pb-12">
            <Header onTitleTap={handleTitleTap} />

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative w-80 h-80 rounded-full overflow-hidden bg-white shadow-xl flex items-center justify-center border border-gray-100"
            >
                <div className="grid grid-cols-3 gap-1 p-4 w-full h-full">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.4 }}
                            className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm flex items-center justify-center overflow-hidden"
                        >
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <div className="flex flex-col items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="w-80 py-5 bg-white border border-gray-300 rounded-lg shadow-sm text-xl font-semibold text-gray-800 tracking-wide hover:shadow-md transition-all"
                >
                    스타일 추천 시작하기
                </motion.button>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex gap-3 text-sm text-gray-400"
                >
                    <button
                        onClick={() => setLanguage('en')}
                        className={`transition-colors ${language === 'en' ? 'text-gray-800 font-semibold' : 'hover:text-gray-600'}`}
                    >
                        ENGLISH
                    </button>
                    <span>|</span>
                    <button
                        onClick={() => setLanguage('ko')}
                        className={`transition-colors ${language === 'ko' ? 'text-gray-800 font-semibold' : 'hover:text-gray-600'}`}
                    >
                        한국어
                    </button>
                </motion.div>
                <p className="text-xs text-gray-400">현재 언어: {languageLabel}</p>
            </div>

            {showAdminPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-6">
                    <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-gray-200">
                        <h3 className="text-base font-semibold text-gray-800">관리자 인증</h3>
                        <p className="text-sm text-gray-500 mt-1">비밀번호를 입력하세요.</p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                            placeholder="비밀번호"
                        />
                        {passwordError && <p className="mt-2 text-xs text-red-500">{passwordError}</p>}
                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAdminPrompt(false)}
                                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm text-gray-700"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleAdminLogin}
                                disabled={isAuthenticating}
                                className="flex-1 rounded-lg border border-gray-800 bg-gray-800 py-2 text-sm text-white disabled:opacity-50"
                            >
                                {isAuthenticating ? '확인 중...' : '확인'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
