import { motion } from 'framer-motion'

export default function Header() {
    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full pt-10 pb-4 text-center"
        >
            <h1 className="font-display text-3xl tracking-widest text-gray-800 font-semibold">
                STYLE ME UP
            </h1>
        </motion.header>
    )
}
