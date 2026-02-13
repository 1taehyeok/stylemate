/**
 * StyleMate API Client — communicates with FastAPI backend.
 */

const API_BASE = 'http://localhost:8000'

export interface GenerateRequest {
    gender: string
    tpo: string
    height: number
    fit: string | null
    photo_base64?: string | null
}

export interface GenerateResponse {
    task_id: string
    status: string
    message: string
}

export interface GeneratedImage {
    id: number
    image_url: string
    prompt: string
    category: string | null
    created_at: string | null
}

export interface GenerationResult {
    task_id: string
    status: string
    images: GeneratedImage[]
    total: number
    recommended_items: ItemResponse[]
}

export interface ItemResponse {
    id: number
    name: string
    description: string | null
    price: number
    price_display: string
    category: string | null
    image_url: string | null
    stock_info: string | null
    location: string | null
    gender: string | null
}

/**
 * Start AI image generation.
 */
export async function startGeneration(request: GenerateRequest): Promise<GenerateResponse> {
    const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Generation failed')
    }
    return res.json()
}

/**
 * Poll for generation results.
 */
export async function getGenerationResults(taskId: string): Promise<GenerationResult> {
    const res = await fetch(`${API_BASE}/api/results/${taskId}`)
    if (!res.ok) throw new Error('Failed to fetch results')
    return res.json()
}

/**
 * Get full image URL from relative path.
 */
export function getImageUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) return relativePath
    return `${API_BASE}${relativePath}`
}

/**
 * List clothing items.
 */
export async function getItems(gender?: string, category?: string): Promise<ItemResponse[]> {
    const params = new URLSearchParams()
    if (gender) params.append('gender', gender)
    if (category) params.append('category', category)
    const url = `${API_BASE}/api/items${params.toString() ? '?' + params.toString() : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch items')
    return res.json()
}

/**
 * Get a single item by ID.
 */
export async function getItem(id: number): Promise<ItemResponse> {
    const res = await fetch(`${API_BASE}/api/items/${id}`)
    if (!res.ok) throw new Error('Item not found')
    return res.json()
}
