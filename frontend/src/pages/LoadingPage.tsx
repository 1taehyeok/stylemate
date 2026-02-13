import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, type Fit, type ResultItem } from '../store'
import { startGeneration, getGenerationResults, getImageUrl } from '../api'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

const fitOptions: Fit[] = ['오버핏', '슬림핏', '정핏']

export default function LoadingPage() {
    const { nextStep, height, setHeight, fit, setFit, setResults, gender, tpo } = useAppStore()
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const taskIdRef = useRef<string | null>(null)
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Start generation on mount
    useEffect(() => {
        let cancelled = false

        const start = async () => {
            try {
                const res = await startGeneration({
                    gender: gender || 'women',
                    tpo: tpo || 'daily',
                    height,
                    fit,
                })
                if (cancelled) return
                taskIdRef.current = res.task_id

                // Start polling
                pollingRef.current = setInterval(async () => {
                    if (!taskIdRef.current) return
                    try {
                        const result = await getGenerationResults(taskIdRef.current)

                        if (result.status === 'completed' && result.images.length > 0) {
                            // Convert to ResultItem format
                            const items: ResultItem[] = result.images.map((img, i) => ({
                                id: img.id,
                                imageUrl: getImageUrl(img.image_url),
                                name: `스타일 ${i + 1}`,
                                price: `₩${((Math.floor(Math.random() * 10) + 3) * 10000).toLocaleString()}`,
                                category: img.category || '추천순',
                                stock: `M(${Math.floor(Math.random() * 10)}), L(${Math.floor(Math.random() * 5)})`,
                                location: '강남점 2F',
                                description: '세미마이드 플레어 블레이저',
                            }))
                            setResults(items)
                            if (pollingRef.current) clearInterval(pollingRef.current)
                            setProgress(100)
                        } else if (result.status === 'failed') {
                            setError('이미지 생성에 실패했습니다. 다시 시도해주세요.')
                            if (pollingRef.current) clearInterval(pollingRef.current)
                        } else {
                            // Update progress based on images generated so far
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
                    const message = e instanceof Error ? e.message : '서버 연결에 실패했습니다.'
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

    // Auto-navigate when complete
    useEffect(() => {
        if (progress >= 100) {
            const timer = setTimeout(() => nextStep(), 800)
            return () => clearTimeout(timer)
        }
    }, [progress, nextStep])

    // Smooth progress animation (simulate when no real updates yet)
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

    // Circular progress bar dimensions
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
                    나만을 위한 스타일을 생성 중...
                </motion.h2>

                {/* Circular Progress */}
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

                {/* Error */}
                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-500 mb-4 text-center"
                    >
                        {error}
                    </motion.p>
                )}

                {/* Interactive: Height + Fit */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full max-w-sm"
                >
                    <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
                        잠깐! 키와 핏을 알려주시면<br />더 정확한 추천이 가능해요!
                    </p>

                    {/* Fit Selection */}
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

                    {/* Height Input */}
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                            <button
                                onClick={() => setHeight(Math.max(100, height - 1))}
                                className="px-4 py-3 text-gray-500 hover:bg-gray-50 text-lg font-medium"
                            >
                                −
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
                        <span className="text-sm text-gray-400">키 (cm)</span>
                    </div>
                </motion.div>
            </div>

            <BackButton />
        </div>
    )
}
