import { motion } from 'framer-motion'
import { useAppStore } from '../store'
import Header from '../components/Header'
import BackButton from '../components/BackButton'

export default function ItemDetailPage() {
    const { selectedItem, prevStep } = useAppStore()

    if (!selectedItem) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500 gap-3">
                <p>선택된 코디가 없습니다.</p>
                <button
                    onClick={prevStep}
                    className="px-4 py-2 rounded-md border border-gray-300 text-sm bg-white"
                >
                    결과로 돌아가기
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

            <div className="flex-1 overflow-y-auto px-6 pb-6">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-gray-800 mt-2 mb-4 text-center"
                >
                    코디 상세 정보
                </motion.h2>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
                    <div className="flex gap-4">
                        <div className="w-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            {hasRealImage ? (
                                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="h-full min-h-52 flex items-center justify-center text-xs text-gray-400">이미지 없음</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-800">{selectedItem.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{selectedItem.items.length}개 아이템 구성</p>
                            <p className="text-base text-gray-700 mt-3">합계 금액: {selectedItem.totalPriceDisplay}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {selectedItem.items.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <div className="flex gap-3">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">이미지 없음</div>
                                    )}
                                </div>
                                <div className="flex-1 text-sm text-gray-600">
                                    <p className="text-gray-800 font-semibold">{item.name}</p>
                                    <p className="mt-1">{item.description}</p>
                                    <p className="mt-2">카테고리: {item.category}</p>
                                    <p>가격: {item.priceDisplay}원</p>
                                    <p>재고: {item.stock}</p>
                                    <p>매장: {item.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100 flex justify-center">
                <BackButton />
            </div>
        </div>
    )
}
