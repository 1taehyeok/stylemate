import { motion } from 'framer-motion'
import { useAppStore } from '../store'

export default function BackButton() {
    const prevStep = useAppStore((s) => s.prevStep)

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={prevStep}
            className="px-8 py-3 border border-gray-300 rounded-md text-sm text-gray-600 
                 bg-white hover:bg-gray-50 transition-colors"
        >
            뒤로가기
        </motion.button>
    )
}
