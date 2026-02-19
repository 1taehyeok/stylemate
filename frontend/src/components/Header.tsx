import { motion } from 'framer-motion'

interface HeaderProps {
    onTitleTap?: () => void
}

export default function Header({ onTitleTap }: HeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full pt-10 pb-4 text-center"
        >
            <button type="button" onClick={onTitleTap} className="inline-block select-none">
                <h1 className="font-display text-3xl tracking-widest text-gray-800 font-semibold">
                    STYLE ME UP
                </h1>
            </button>
        </motion.header>
    )
}
