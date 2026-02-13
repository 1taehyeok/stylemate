import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useAppStore } from '../store'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

export default function CameraCapturePage() {
    const { nextStep, setPhotoUrl } = useAppStore()
    const [countdown, setCountdown] = useState<number | null>(null)
    const [captured, setCaptured] = useState(false)

    const startCapture = useCallback(() => {
        setCountdown(3)
    }, [])

    useEffect(() => {
        if (countdown === null) return
        if (countdown === 0) {
            // Defer state updates to avoid cascading renders in effect
            queueMicrotask(() => {
                setCaptured(true)
                setPhotoUrl('/placeholder-photo.jpg')
                setCountdown(null)
            })
            return
        }
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown, setPhotoUrl])

    const handleRetake = () => {
        setCaptured(false)
        setPhotoUrl(null)
    }

    const handleUsePhoto = () => {
        nextStep()
    }

    return (
        <div className="flex flex-col items-center justify-between h-full bg-gray-50 px-6 pb-8">
            <div className="flex flex-col items-center w-full flex-1">
                <Header />

                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 mt-2 mb-6"
                >
                    전신 사진을 촬영해주세요
                </motion.h2>

                {/* Camera Viewfinder */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="relative w-72 h-96 bg-gradient-to-b from-gray-200 to-gray-300 
                     rounded-xl overflow-hidden shadow-inner flex items-center justify-center"
                    style={{
                        perspective: '600px',
                    }}
                >
                    {/* 3D Room effect */}
                    <div className="absolute inset-4 border border-gray-400/30 rounded-lg"
                        style={{
                            background: 'linear-gradient(180deg, rgba(200,200,200,0.3) 0%, rgba(180,180,180,0.5) 100%)',
                        }}
                    />

                    {/* Body Silhouette Guide */}
                    <svg className="relative z-10 w-24 h-64 text-gray-400/60" viewBox="0 0 80 200" fill="none" stroke="currentColor" strokeWidth="1">
                        <ellipse cx="40" cy="22" rx="14" ry="16" />
                        <path d="M28 38 Q22 45 20 70 L22 110 L32 110 L35 80 L40 100 L45 80 L48 110 L58 110 L60 70 Q58 45 52 38" />
                        <path d="M32 110 L28 180" />
                        <path d="M48 110 L52 180" />
                    </svg>

                    {/* Countdown */}
                    <AnimatePresence>
                        {countdown !== null && countdown > 0 && (
                            <motion.div
                                key={countdown}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-20"
                            >
                                <span className="text-7xl font-bold text-white drop-shadow-lg">{countdown}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Flash effect */}
                    <AnimatePresence>
                        {countdown === 0 && (
                            <motion.div
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-white z-30"
                            />
                        )}
                    </AnimatePresence>

                    {/* Captured overlay */}
                    {captured && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-gray-300/80 flex items-center justify-center z-20"
                        >
                            <span className="text-lg text-white font-semibold bg-black/40 px-4 py-2 rounded-full">
                                ✓ 촬영 완료
                            </span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Countdown hint */}
                {!captured && countdown === null && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-4 text-sm text-gray-400 flex items-center gap-1"
                    >
                        <Camera className="w-4 h-4" />
                        3초 후 자동 촬영
                    </motion.p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                <div className="flex items-center justify-center gap-6 w-full">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRetake}
                        className="px-6 py-3 border border-gray-300 rounded-md text-sm text-gray-600 bg-white"
                    >
                        다시 찍기
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startCapture}
                        className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 
                         flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                    >
                        <Camera className="w-7 h-7 text-gray-600" />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUsePhoto}
                        className="px-6 py-3 border border-gray-300 rounded-md text-sm text-gray-600 bg-white"
                    >
                        이 사진 사용
                    </motion.button>
                </div>

                <BackButton />
            </div>
        </div>
    )
}
