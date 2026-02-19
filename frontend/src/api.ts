/**
 * StyleMate API Client — communicates with FastAPI backend.
 */

const API_BASE = 'http://localhost:8000'

export interface GenerateRequest {
    gender: string
    tpo: string
    season?: string | null
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
    outfit_combos: OutfitCombo[]
}

export interface OutfitCombo {
    combo_id: string
    image_id: number
    image_url: string
    category: string | null
    total_price: number
    total_price_display: string
    items: ItemResponse[]
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

export interface ItemUpdateRequest {
    name?: string
    description?: string | null
    price?: number
    category?: string | null
    stock_info?: string | null
    location?: string | null
    gender?: string | null
}

export interface AdminAuthResponse {
    success: boolean
    message: string
    session_token: string | null
    expires_at: string | null
}

export interface AdminLog {
    id: number
    event_type: string
    success: boolean
    admin_id: string | null
    session_token: string | null
    ip_address: string | null
    user_agent: string | null
    detail: string | null
    created_at: string | null
}

export interface AdminLogFilters {
    limit?: number
    event_type?: string
    success?: boolean
    date_from?: string
    date_to?: string
    price_changes_only?: boolean
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

/**
 * Update a clothing item (admin).
 */
export async function updateItem(id: number, payload: ItemUpdateRequest, adminSessionToken: string): Promise<ItemResponse> {
    const res = await fetch(`${API_BASE}/api/items/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Session': adminSessionToken,
        },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to update item')
    }
    return res.json()
}

export async function adminAuth(password: string, deviceId?: string): Promise<AdminAuthResponse> {
    const res = await fetch(`${API_BASE}/api/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, device_id: deviceId || null }),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Admin authentication failed')
    }
    return res.json()
}

function buildAdminLogQuery(filters: AdminLogFilters = {}): string {
    const params = new URLSearchParams()
    if (filters.limit !== undefined) params.append('limit', String(filters.limit))
    if (filters.event_type) params.append('event_type', filters.event_type)
    if (filters.success !== undefined) params.append('success', String(filters.success))
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.price_changes_only !== undefined) params.append('price_changes_only', String(filters.price_changes_only))
    return params.toString()
}

export async function getAdminLogs(adminSessionToken: string, filters: AdminLogFilters = {}): Promise<AdminLog[]> {
    const q = buildAdminLogQuery(filters)
    const res = await fetch(`${API_BASE}/api/admin/logs${q ? `?${q}` : ''}`, {
        headers: {
            'X-Admin-Session': adminSessionToken,
        },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to fetch admin logs')
    }
    return res.json()
}

export async function downloadAdminLogsCsv(adminSessionToken: string, filters: AdminLogFilters = {}): Promise<Blob> {
    const q = buildAdminLogQuery(filters)
    const res = await fetch(`${API_BASE}/api/admin/logs/export.csv${q ? `?${q}` : ''}`, {
        headers: {
            'X-Admin-Session': adminSessionToken,
        },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to download admin logs CSV')
    }
    return res.blob()
}
