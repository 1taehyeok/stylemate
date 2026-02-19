import { create } from 'zustand'

export type Gender = 'women' | 'men' | null
export type TPO = 'daily' | 'date' | 'office' | 'active' | null
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | null
export type Fit = '슬림핏' | '레귤러핏' | '오버핏' | null

export interface OutfitDetailItem {
    id: number
    name: string
    description: string
    price: number
    priceDisplay: string
    category: string
    imageUrl: string
    stock: string
    location: string
}

export interface ResultItem {
    id: string
    imageUrl: string
    name: string
    totalPrice: number
    totalPriceDisplay: string
    category: string
    items: OutfitDetailItem[]
}

interface AppState {
    currentStep: number
    gender: Gender
    tpo: TPO
    season: Season
    height: number
    fit: Fit
    photoUrl: string | null
    results: ResultItem[]
    selectedItem: ResultItem | null
    adminSessionToken: string | null
    language: 'ko' | 'en'

    setStep: (step: number) => void
    nextStep: () => void
    prevStep: () => void
    setGender: (gender: Gender) => void
    setTPO: (tpo: TPO) => void
    setSeason: (season: Season) => void
    setHeight: (height: number) => void
    setFit: (fit: Fit) => void
    setPhotoUrl: (url: string | null) => void
    setResults: (results: ResultItem[]) => void
    setSelectedItem: (item: ResultItem | null) => void
    setAdminSessionToken: (token: string | null) => void
    setLanguage: (lang: 'ko' | 'en') => void
    reset: () => void
}

const initialState = {
    currentStep: 0,
    gender: null as Gender,
    tpo: null as TPO,
    season: null as Season,
    height: 165,
    fit: null as Fit,
    photoUrl: null as string | null,
    results: [] as ResultItem[],
    selectedItem: null as ResultItem | null,
    adminSessionToken: null as string | null,
    language: 'ko' as 'ko' | 'en',
}

export const useAppStore = create<AppState>((set) => ({
    ...initialState,

    setStep: (step) => set({ currentStep: step }),
    nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
    prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
    setGender: (gender) => set({ gender }),
    setTPO: (tpo) => set({ tpo }),
    setSeason: (season) => set({ season }),
    setHeight: (height) => set({ height }),
    setFit: (fit) => set({ fit }),
    setPhotoUrl: (url) => set({ photoUrl: url }),
    setResults: (results) => set({ results }),
    setSelectedItem: (item) => set({ selectedItem: item }),
    setAdminSessionToken: (token) => set({ adminSessionToken: token }),
    setLanguage: (lang) => set({ language: lang }),
    reset: () => set(initialState),
}))
