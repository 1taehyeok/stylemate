import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import Header from '../components/Header'

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
                    추천 코디 조합 결과
                </motion.h2>

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

            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 gap-3"
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
                                <div className="aspect-[3/4] bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                                    {hasRealImage ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="text-xs text-gray-400">이미지 없음</div>
                                    )}
                                </div>
                                <div className="p-3 text-left">
                                    <p className="text-sm text-gray-800 font-semibold">{item.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{item.items.length}개 아이템</p>
                                    <p className="text-sm text-gray-700 mt-1">합계 {item.totalPriceDisplay}</p>
                                </div>
                            </motion.button>
                        )
                    })}
                </motion.div>
            </div>

            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100">
                <span className="text-sm text-gray-500">총 {results.length}개 코디</span>
            </div>
        </div>
    )
}
