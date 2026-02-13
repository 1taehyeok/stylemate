import { motion } from 'framer-motion'
import { Home, Heart, Briefcase, Leaf } from 'lucide-react'
import { useAppStore, type TPO } from '../store'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

const tpoOptions: { id: TPO; label: string; icon: typeof Home; color: string }[] = [
    { id: 'daily', label: '데일리', icon: Home, color: 'text-gray-600' },
    { id: 'date', label: '데이트', icon: Heart, color: 'text-gray-600' },
    { id: 'office', label: 'Office', icon: Briefcase, color: 'text-gray-600' },
    { id: 'active', label: 'Active', icon: Leaf, color: 'text-gray-600' },
]

export default function TPOSelectPage() {
    const { setTPO, nextStep, tpo } = useAppStore()

    const handleSelect = (selected: TPO) => {
        setTPO(selected)
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
                    어디 가세요?
                </motion.h2>

                {/* TPO Grid */}
                <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                    {tpoOptions.map((option, i) => {
                        const Icon = option.icon
                        const isSelected = tpo === option.id
                        return (
                            <motion.button
                                key={option.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelect(option.id)}
                                className={`aspect-square rounded-full border-2 flex flex-col items-center justify-center
                           gap-3 transition-all
                           ${isSelected
                                        ? 'border-pink-400 bg-white shadow-lg'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
                            >
                                <Icon className={`w-10 h-10 ${isSelected ? 'text-pink-500' : option.color}`} strokeWidth={1.5} />
                                <span className={`text-base font-medium ${isSelected ? 'text-pink-600' : 'text-gray-600'}`}>
                                    {option.label}
                                </span>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    className="w-full max-w-sm py-4 border border-gray-300 rounded-lg text-sm
                     text-gray-500 bg-white hover:bg-gray-50 transition-colors"
                >
                    고민하기 싫다면? 사장님 추천 코디 보기
                </motion.button>
                <BackButton />
            </div>
        </div>
    )
}
