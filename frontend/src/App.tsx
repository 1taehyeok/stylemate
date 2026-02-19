import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store'
import LandingPage from './pages/LandingPage'
import GenderSelectPage from './pages/GenderSelectPage'
import CameraCapturePage from './pages/CameraCapturePage'
import TPOSelectPage from './pages/TPOSelectPage'
import SeasonSelectPage from './pages/SeasonSelectPage'
import LoadingPage from './pages/LoadingPage'
import ResultsPage from './pages/ResultsPage'
import ItemDetailPage from './pages/ItemDetailPage'
import AdminPage from './pages/AdminPage'
import HomeButton from './components/HomeButton'
import { ADMIN_STEP, IDLE_TIMEOUT_MS } from './constants'

const pages = [
  LandingPage,
  GenderSelectPage,
  CameraCapturePage,
  TPOSelectPage,
  SeasonSelectPage,
  LoadingPage,
  ResultsPage,
  ItemDetailPage,
]

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

function App() {
  const currentStep = useAppStore((s) => s.currentStep)
  const reset = useAppStore((s) => s.reset)

  const isAdminPage = currentStep === ADMIN_STEP
  const isLandingPage = currentStep === 0

  const PageComponent = isAdminPage ? AdminPage : (pages[currentStep] || LandingPage)

  const [showIdleModal, setShowIdleModal] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLandingPage) {
      setShowIdleModal(false)
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      return
    }

    const resetTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      idleTimerRef.current = setTimeout(() => {
        setShowIdleModal(true)
      }, IDLE_TIMEOUT_MS)
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'keydown', 'touchstart']
    const onActivity = () => {
      if (showIdleModal) {
        return
      }
      resetTimer()
    }

    events.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }))
    resetTimer()

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, onActivity))
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [currentStep, isLandingPage, showIdleModal])

  const handleGoHome = () => {
    setShowIdleModal(false)
    reset()
  }

  const handleStayHere = () => {
    setShowIdleModal(false)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = setTimeout(() => {
      setShowIdleModal(true)
    }, IDLE_TIMEOUT_MS)
  }

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50">
      {!isLandingPage && <HomeButton />}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="w-full h-full"
        >
          <PageComponent />
        </motion.div>
      </AnimatePresence>

      {showIdleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800">처음으로 돌아갈까요?</h3>
            <p className="mt-2 text-sm text-gray-500">20초 동안 입력이 없어 홈으로 이동할 수 있습니다.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleStayHere}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm text-gray-700"
              >
                계속 사용
              </button>
              <button
                type="button"
                onClick={handleGoHome}
                className="flex-1 rounded-lg border border-gray-800 bg-gray-800 py-2 text-sm text-white"
              >
                처음으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
