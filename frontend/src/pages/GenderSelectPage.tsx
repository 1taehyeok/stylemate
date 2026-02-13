import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

export default function GenderSelectPage() {
    const { setGender, nextStep } = useAppStore()

    const handleSelect = (gender: 'women' | 'men') => {
        setGender(gender)
        nextStep()
    }

    return (
        <div className="flex flex-col items-center justify-between h-full bg-gray-50 px-6 pb-12">
            <div className="flex flex-col items-center w-full">
                <Header />

                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold text-gray-800 mt-4 mb-12"
                >
                    어떤 스타일을 찾으세요?
                </motion.h2>

                {/* Gender Cards */}
                <div className="flex gap-6 w-full max-w-md justify-center">
                    {/* Women */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelect('women')}
                        className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 
                       flex flex-col items-center gap-4 shadow-sm transition-all"
                    >
                        {/* Woman illustration placeholder */}
                        <div className="w-full h-52 flex items-center justify-center">
                            <svg className="w-28 h-40 text-gray-300" viewBox="0 0 100 160" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <circle cx="50" cy="20" r="12" />
                                <path d="M50 32 L50 80" />
                                <path d="M50 45 L30 65" />
                                <path d="M50 45 L70 65" />
                                <path d="M50 80 L35 130" />
                                <path d="M50 80 L65 130" />
                                {/* Dress shape */}
                                <path d="M38 55 Q50 85 62 55" strokeDasharray="2,2" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-pink-500 text-lg">👜</span>
                        </div>
                        <span className="text-base font-semibold text-gray-700 tracking-wide">
                            WOMEN STYLE
                        </span>
                    </motion.button>

                    {/* Men */}
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelect('men')}
                        className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 
                       flex flex-col items-center gap-4 shadow-sm transition-all"
                    >
                        {/* Man illustration placeholder */}
                        <div className="w-full h-52 flex items-center justify-center">
                            <svg className="w-28 h-40 text-gray-300" viewBox="0 0 100 160" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <circle cx="50" cy="20" r="12" />
                                <path d="M50 32 L50 80" />
                                <path d="M50 45 L25 60" />
                                <path d="M50 45 L75 60" />
                                <path d="M50 80 L38 130" />
                                <path d="M50 80 L62 130" />
                                {/* Suit lapels */}
                                <path d="M42 35 L50 50 L58 35" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-500 text-lg">⌚</span>
                        </div>
                        <span className="text-base font-semibold text-gray-700 tracking-wide">
                            MEN STYLE
                        </span>
                    </motion.button>
                </div>
            </div>

            <BackButton />
        </div>
    )
}
