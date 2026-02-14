import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

export default function ItemDetailPage() {
    const { selectedItem, prevStep } = useAppStore()

    if (!selectedItem) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500 gap-3">
                <p>선택된 아이템이 없습니다.</p>
                <button
                    onClick={prevStep}
                    className="px-4 py-2 rounded-md border border-gray-300 text-sm bg-white"
                >
                    이전 화면으로
                </button>
            </div>
        )
    }

    const hasRealImage = selectedItem.imageUrl && !selectedItem.imageUrl.includes('placeholder')

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-shrink-0 px-6">
                <Header />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 mt-2 mb-6 text-center"
                >
                    스타일 상세 정보
                </motion.h2>

                <div className="flex gap-4 items-start">
                    {/* Model Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-48 flex-shrink-0"
                    >
                        <div className="aspect-[3/5] bg-gradient-to-b from-gray-100 to-gray-200 
                            rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                            {hasRealImage ? (
                                <img
                                    src={selectedItem.imageUrl}
                                    alt={selectedItem.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <svg className="w-20 h-32 text-gray-300" viewBox="0 0 80 130" fill="none" stroke="currentColor" strokeWidth="1">
                                    <circle cx="40" cy="18" r="10" />
                                    <path d="M40 28 L40 70" />
                                    <path d="M40 38 L25 55" />
                                    <path d="M40 38 L55 55" />
                                    <path d="M40 70 L30 120" />
                                    <path d="M40 70 L50 120" />
                                    <path d="M30 40 Q40 75 50 40" strokeDasharray="2,2" />
                                </svg>
                            )}
                        </div>
                    </motion.div>

                    {/* Item Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex-1 flex flex-col gap-3"
                    >
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">
                                아이템 정보
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-800 font-semibold">{selectedItem.name}</p>
                                <p className="text-gray-700">{selectedItem.description}</p>
                                <div className="border-t border-gray-50 pt-2">
                                    <p className="text-gray-500">카테고리: {selectedItem.category}</p>
                                </div>
                                <div className="border-t border-gray-50 pt-2">
                                    <p className="text-gray-500">가격: {selectedItem.price}</p>
                                </div>
                                <div className="border-t border-gray-50 pt-2">
                                    <p className="text-gray-500">재고: {selectedItem.stock}</p>
                                </div>
                                <div className="border-t border-gray-50 pt-2">
                                    <p className="text-gray-500">매장 위치: {selectedItem.location}</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code placeholder */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-center">
                            <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center">
                                <svg className="w-20 h-20 text-gray-300" viewBox="0 0 100 100" fill="currentColor">
                                    <rect x="0" y="0" width="35" height="35" rx="4" opacity="0.3" />
                                    <rect x="65" y="0" width="35" height="35" rx="4" opacity="0.3" />
                                    <rect x="0" y="65" width="35" height="35" rx="4" opacity="0.3" />
                                    <rect x="10" y="10" width="15" height="15" rx="2" opacity="0.6" />
                                    <rect x="75" y="10" width="15" height="15" rx="2" opacity="0.6" />
                                    <rect x="10" y="75" width="15" height="15" rx="2" opacity="0.6" />
                                    <rect x="40" y="40" width="20" height="20" rx="2" opacity="0.4" />
                                    <rect x="65" y="65" width="35" height="35" rx="4" opacity="0.2" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 space-y-3 max-w-lg mx-auto"
                >
                    <button
                        className="w-full py-4 border border-gray-300 rounded-lg text-sm font-medium
                       text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        모바일 장바구니 담기
                    </button>
                    <button
                        className="w-full py-4 border border-gray-300 rounded-lg text-sm font-medium
                       text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        이 스타일 매칭된 옷 보기
                    </button>
                </motion.div>
            </div>

            {/* Bottom */}
            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100 flex justify-center">
                <BackButton />
            </div>

            {/* FAB */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
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
