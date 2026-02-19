import { Home } from 'lucide-react'
import { useAppStore } from '../store'

export default function HomeButton() {
    const { reset } = useAppStore()

    return (
        <button
            type="button"
            onClick={reset}
            className="fixed right-5 top-5 z-40 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow"
        >
            <Home className="h-4 w-4" />
            처음으로
        </button>
    )
}
