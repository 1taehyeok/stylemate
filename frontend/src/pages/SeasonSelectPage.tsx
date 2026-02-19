import { motion } from 'framer-motion'
import { Sun, Flower2, Leaf, Snowflake } from 'lucide-react'
import { useAppStore, type Season } from '../store'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

const seasonOptions: { id: Season; label: string; icon: typeof Sun }[] = [
    { id: 'spring', label: '봄', icon: Flower2 },
    { id: 'summer', label: '여름', icon: Sun },
    { id: 'fall', label: '가을', icon: Leaf },
    { id: 'winter', label: '겨울', icon: Snowflake },
]

export default function SeasonSelectPage() {
    const { setSeason, season, nextStep } = useAppStore()

    const handleSelect = (value: Season) => {
        setSeason(value)
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
                    지금 계절을 선택해주세요
                </motion.h2>

                <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                    {seasonOptions.map((option, i) => {
                        const Icon = option.icon
                        const isSelected = season === option.id

                        return (
                            <motion.button
                                key={option.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelect(option.id)}
                                className={`aspect-square rounded-full border-2 flex flex-col items-center justify-center gap-3 transition-all
                                ${isSelected
                                        ? 'border-pink-400 bg-white shadow-lg'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}`}
                            >
                                <Icon className={`w-10 h-10 ${isSelected ? 'text-pink-500' : 'text-gray-600'}`} strokeWidth={1.5} />
                                <span className={`text-base font-medium ${isSelected ? 'text-pink-600' : 'text-gray-600'}`}>
                                    {option.label}
                                </span>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            <BackButton />
        </div>
    )
}
