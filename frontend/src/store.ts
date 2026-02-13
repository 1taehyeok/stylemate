import { create } from 'zustand'

export type Gender = 'women' | 'men' | null
export type TPO = 'daily' | 'date' | 'office' | 'active' | null
export type Fit = '오버핏' | '슬림핏' | '정핏' | null

export interface ResultItem {
    id: number
    imageUrl: string
    name: string
    price: string
    category: string
    stock: string
    location: string
    description: string
}

interface AppState {
    currentStep: number
    gender: Gender
    tpo: TPO
    height: number
    fit: Fit
    photoUrl: string | null
    results: ResultItem[]
    selectedItem: ResultItem | null
    language: 'ko' | 'en'

    setStep: (step: number) => void
    nextStep: () => void
    prevStep: () => void
    setGender: (gender: Gender) => void
    setTPO: (tpo: TPO) => void
    setHeight: (height: number) => void
    setFit: (fit: Fit) => void
    setPhotoUrl: (url: string | null) => void
    setResults: (results: ResultItem[]) => void
    setSelectedItem: (item: ResultItem | null) => void
    setLanguage: (lang: 'ko' | 'en') => void
    reset: () => void
}

const initialState = {
    currentStep: 0,
    gender: null as Gender,
    tpo: null as TPO,
    height: 165,
    fit: null as Fit,
    photoUrl: null as string | null,
    results: [] as ResultItem[],
    selectedItem: null as ResultItem | null,
    language: 'ko' as 'ko' | 'en',
}

export const useAppStore = create<AppState>((set) => ({
    ...initialState,

    setStep: (step) => set({ currentStep: step }),
    nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
    prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
    setGender: (gender) => set({ gender }),
    setTPO: (tpo) => set({ tpo }),
    setHeight: (height) => set({ height }),
    setFit: (fit) => set({ fit }),
    setPhotoUrl: (url) => set({ photoUrl: url }),
    setResults: (results) => set({ results }),
    setSelectedItem: (item) => set({ selectedItem: item }),
    setLanguage: (lang) => set({ language: lang }),
    reset: () => set(initialState),
}))
