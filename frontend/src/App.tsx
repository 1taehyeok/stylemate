import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store'
import LandingPage from './pages/LandingPage'
import GenderSelectPage from './pages/GenderSelectPage'
import CameraCapturePage from './pages/CameraCapturePage'
import TPOSelectPage from './pages/TPOSelectPage'
import LoadingPage from './pages/LoadingPage'
import ResultsPage from './pages/ResultsPage'
import ItemDetailPage from './pages/ItemDetailPage'

const pages = [
  LandingPage,       // step 0
  GenderSelectPage,  // step 1
  CameraCapturePage, // step 2
  TPOSelectPage,     // step 3
  LoadingPage,       // step 4
  ResultsPage,       // step 5
  ItemDetailPage,    // step 6
]

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

function App() {
  const currentStep = useAppStore((s) => s.currentStep)
  const PageComponent = pages[currentStep] || LandingPage

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50">
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
    </div>
  )
}

export default App
