import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

export default function ResultsPage() {
    const { results, setSelectedItem, nextStep } = useAppStore()
    const [activeTab, setActiveTab] = useState('전체')

    const tabs = useMemo(() => {
        const categories = Array.from(new Set(results.map((r) => r.category).filter(Boolean)))
        return ['전체', ...categories]
    }, [results])

    const filteredResults = activeTab === '전체'
        ? results
        : results.filter((r) => r.category === activeTab)

    const handleItemClick = (item: typeof results[0]) => {
        setSelectedItem(item)
        nextStep()
    }

    const displayResults = filteredResults.length > 0 ? filteredResults : results

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-shrink-0 px-6">
                <Header />

                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 mt-2 mb-5 text-center"
                >
                    나에게 딱 맞는 스타일을 찾았어요!
                </motion.h2>

                {/* Category Tabs */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-2 mb-4 overflow-x-auto pb-1"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all
                ${activeTab === tab
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Results Grid - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-3 gap-3"
                >
                    {displayResults.map((item, i) => {
                        const hasRealImage = item.imageUrl && !item.imageUrl.includes('placeholder')
                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleItemClick(item)}
                                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100
                           flex flex-col transition-shadow hover:shadow-md"
                            >
                                {/* Image */}
                                <div className="aspect-[3/4] bg-gradient-to-b from-gray-100 to-gray-200 
                                flex items-center justify-center relative overflow-hidden">
                                    {hasRealImage ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <svg className="w-12 h-16 text-gray-300" viewBox="0 0 50 70" fill="none" stroke="currentColor" strokeWidth="1">
                                            <circle cx="25" cy="12" r="7" />
                                            <path d="M25 19 L25 45" />
                                            <path d="M25 25 L15 35" />
                                            <path d="M25 25 L35 35" />
                                            <path d="M25 45 L18 65" />
                                            <path d="M25 45 L32 65" />
                                        </svg>
                                    )}
                                </div>
                                <div className="p-2 text-left">
                                    <p className="text-xs text-gray-800 truncate">{item.name}</p>
                                    <span className="text-xs text-gray-500">{item.price}</span>
                                </div>
                            </motion.button>
                        )
                    })}
                </motion.div>
            </div>

            {/* Bottom Bar */}
            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">총 {results.length}개 스타일</span>
                    <BackButton />
                </div>
            </div>

            {/* FAB */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-24 right-6 w-16 h-16 rounded-full 
                   bg-gradient-to-br from-pink-500 to-pink-600 text-white
                   flex flex-col items-center justify-center shadow-xl
                   text-xs font-semibold leading-tight z-50"
            >
                <span>매장</span>
                <span>찾기</span>
            </motion.button>
        </div>
    )
}
