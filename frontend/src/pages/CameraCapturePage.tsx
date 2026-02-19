import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useAppStore } from '../store'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

export default function CameraCapturePage() {
    const { nextStep, setPhotoUrl, photoUrl } = useAppStore()
    const [countdown, setCountdown] = useState<number | null>(null)
    const [captured, setCaptured] = useState(false)
    const [cameraReady, setCameraReady] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)

    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        let active = true

        const initCamera = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError('이 브라우저는 카메라를 지원하지 않습니다.')
                return
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: false,
                })
                if (!active) {
                    stream.getTracks().forEach((track) => track.stop())
                    return
                }

                streamRef.current = stream
                const video = videoRef.current
                if (video) {
                    video.srcObject = stream
                    await video.play()
                }
                setCameraReady(true)
                setCameraError(null)
            } catch {
                setCameraError('카메라 권한이 필요합니다. 권한을 허용한 뒤 다시 시도해주세요.')
                setCameraReady(false)
            }
        }

        initCamera()

        return () => {
            active = false
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
                streamRef.current = null
            }
        }
    }, [])

    const capturePhoto = useCallback((): string | null => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
            return null
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            return null
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/jpeg', 0.92)
    }, [])

    const startCapture = useCallback(() => {
        if (!cameraReady || cameraError || captured) return
        setCountdown(3)
    }, [cameraReady, cameraError, captured])

    useEffect(() => {
        if (countdown === null) return
        if (countdown === 0) {
            queueMicrotask(() => {
                const dataUrl = capturePhoto()
                if (!dataUrl) {
                    setCameraError('촬영에 실패했습니다. 다시 시도해주세요.')
                    setCountdown(null)
                    return
                }
                setCaptured(true)
                setPhotoUrl(dataUrl)
                setCountdown(null)
            })
            return
        }
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown, capturePhoto, setPhotoUrl])

    const handleRetake = () => {
        setCaptured(false)
        setPhotoUrl(null)
        setCountdown(null)
    }

    const handleUsePhoto = () => {
        if (!captured || !photoUrl) {
            setCameraError('먼저 사진을 촬영해주세요.')
            return
        }
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

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="relative w-72 h-96 bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center"
                >
                    {captured && photoUrl ? (
                        <img src={photoUrl} alt="captured" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

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

                    {captured && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-20"
                        >
                            촬영 완료
                        </motion.div>
                    )}
                </motion.div>

                {!captured && countdown === null && !cameraError && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-4 text-sm text-gray-500 flex items-center gap-1"
                    >
                        <Camera className="w-4 h-4" />
                        버튼을 누르면 3초 후 촬영됩니다
                    </motion.p>
                )}

                {cameraError && (
                    <p className="mt-4 text-sm text-red-500 text-center">{cameraError}</p>
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>

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
                        disabled={!cameraReady || !!cameraError || captured}
                        className="w-16 h-16 rounded-full bg-white border-4 border-gray-300
                         flex items-center justify-center shadow-md hover:shadow-lg transition-shadow disabled:opacity-40"
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
