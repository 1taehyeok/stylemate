import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import Header from '../components/Header'

export default function LandingPage() {
    const { nextStep, setLanguage, language } = useAppStore()

    return (
        <div className="flex flex-col items-center justify-between h-full bg-gradient-to-b from-gray-50 to-gray-100 px-6 pb-12">
            <Header />

            {/* Fashion Collage Circle */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative w-80 h-80 rounded-full overflow-hidden bg-white shadow-xl 
                   flex items-center justify-center border border-gray-100"
            >
                {/* Grid of fashion placeholders */}
                <div className="grid grid-cols-3 gap-1 p-4 w-full h-full">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.4 }}
                            className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm 
                         flex items-center justify-center overflow-hidden"
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

            {/* CTA */}
            <div className="flex flex-col items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="w-80 py-5 bg-white border border-gray-300 rounded-lg shadow-sm
                     text-xl font-semibold text-gray-800 tracking-wide
                     hover:shadow-md transition-all"
                >
                    나에게 어울리는 스타일을 찾기
                </motion.button>

                {/* Language Toggle */}
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
            </div>
        </div>
    )
}
