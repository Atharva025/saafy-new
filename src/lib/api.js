/**
 * HARDENED API MODULE
 * Secure wrapper for JioSaavn API with:
 * - Rate limiting
 * - Input sanitization
 * - Response caching
 * - Request validation
 * - Error handling
 */

import {
    sanitizeSearchQuery,
    apiRateLimiter,
    validateApiResponse,
    validatePagination,
    securityLogger,
    SECURITY_CONFIG
} from './security'

const BASE_URL = import.meta.env.VITE_SAAFY_API_URL || 'https://saafy-api.vercel.app'

// ============================================================================
// RESPONSE CACHE
// ============================================================================

class ResponseCache {
    constructor(maxSize = 200, defaultTTL = 15 * 60 * 1000) { // 15 min default TTL, 200 max items
        this.cache = new Map()
        this.maxSize = maxSize
        this.defaultTTL = defaultTTL
    }

    generateKey(endpoint, params = {}) {
        return `${endpoint}:${JSON.stringify(params)}`
    }

    get(key) {
        const entry = this.cache.get(key)
        if (!entry) return null

        if (Date.now() > entry.expires) {
            this.cache.delete(key)
            return null
        }

        return entry.data
    }

    set(key, data, ttl = this.defaultTTL) {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value
            this.cache.delete(oldestKey)
        }

        this.cache.set(key, {
            data,
            expires: Date.now() + ttl,
            timestamp: Date.now()
        })
    }

    invalidate(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key)
            }
        }
    }

    clear() {
        this.cache.clear()
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        }
    }
}

const responseCache = new ResponseCache()

// ============================================================================
// API ERROR CLASS
// ============================================================================

class APIError extends Error {
    constructor(message, status, code = 'UNKNOWN_ERROR') {
        super(message)
        this.name = 'APIError'
        this.status = status
        this.code = code
        this.timestamp = Date.now()
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            status: this.status,
            code: this.code
        }
    }
}

// Error codes for better error handling
const API_ERROR_CODES = Object.freeze({
    NETWORK_ERROR: 'NETWORK_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
    INVALID_INPUT: 'INVALID_INPUT',
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    PARSE_ERROR: 'PARSE_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
})

// ============================================================================
// REQUEST UTILITIES
// ============================================================================

/**
 * Handle API response with validation
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`
        let errorCode = API_ERROR_CODES.SERVER_ERROR

        if (response.status === 404) {
            errorCode = API_ERROR_CODES.NOT_FOUND
            errorMessage = 'Resource not found'
        } else if (response.status === 429) {
            errorCode = API_ERROR_CODES.RATE_LIMITED
            errorMessage = 'Too many requests. Please slow down.'
        } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.'
        }

        try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
        } catch { }

        throw new APIError(errorMessage, response.status, errorCode)
    }

    try {
        const data = await response.json()

        // Validate response structure
        if (!validateApiResponse(data)) {
            securityLogger.warn('Invalid API response structure', { response: data })
        }

        return data
    } catch (error) {
        throw new APIError('Failed to parse response', 0, API_ERROR_CODES.PARSE_ERROR)
    }
}

/**
 * Make API call with rate limiting and caching
 */
const apiCall = async (endpoint, options = {}) => {
    const {
        useCache = true,
        cacheTTL = 5 * 60 * 1000,
        skipRateLimit = false
    } = options

    // Check cache first
    if (useCache) {
        const cached = responseCache.get(endpoint)
        if (cached) {
            return cached
        }
    }

    // Apply rate limiting
    if (!skipRateLimit) {
        try {
            await apiRateLimiter.acquire()
        } catch (error) {
            throw new APIError(
                'Rate limit exceeded. Please wait.',
                429,
                API_ERROR_CODES.RATE_LIMITED
            )
        }
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        })

        clearTimeout(timeoutId)

        const data = await handleResponse(response)

        // Cache successful responses
        if (useCache && data.success) {
            responseCache.set(endpoint, data, cacheTTL)
        }

        return data
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new APIError('Request timeout', 0, API_ERROR_CODES.NETWORK_ERROR)
        }
        if (error instanceof APIError) {
            throw error
        }
        throw new APIError('Network error occurred', 0, API_ERROR_CODES.NETWORK_ERROR)
    }
}

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

/**
 * Decode HTML entities in strings from API
 * Fixes issues like &quot; &amp; &lt; etc.
 */
function decodeHtmlEntities(str) {
    if (typeof str !== 'string') return str

    const entities = {
        '&quot;': '"',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&#39;': "'",
        '&apos;': "'",
        '&#x27;': "'",
        '&nbsp;': ' ',
        '&#x2F;': '/',
        '&#039;': "'"
    }

    return str.replace(/&quot;|&amp;|&lt;|&gt;|&#39;|&apos;|&#x27;|&nbsp;|&#x2F;|&#039;/g,
        match => entities[match] || match
    )
}

/**
 * Format songs from API response with validation
 */
const formatSongs = (songs) => {
    if (!Array.isArray(songs)) return []

    return songs
        .filter(song => song && song.id) // Filter invalid songs
        .map(song => {
            let downloadUrl = null
            let downloadUrlArray = null

            if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
                downloadUrlArray = song.downloadUrl
                const urlItem = song.downloadUrl[song.downloadUrl.length - 1]
                downloadUrl = urlItem?.url || urlItem?.link || null
            } else {
                downloadUrl = song.download_url ||
                    song.downloadLink ||
                    song.streamUrl ||
                    song.previewUrl ||
                    (song.media?.url) ||
                    null
            }

            return {
                id: String(song.id), // Ensure ID is string
                name: decodeHtmlEntities(String(song.name || song.title || 'Unknown')),
                title: decodeHtmlEntities(String(song.title || song.name || 'Unknown')),
                primaryArtists: decodeHtmlEntities(song.primaryArtists || (song.artists?.primary ?
                    song.artists.primary.map(a => a.name).join(', ') : 'Unknown Artist')),
                artists: song.artists?.primary
                    ? song.artists.primary.map(artist => ({
                        id: String(artist.id || ''),
                        name: decodeHtmlEntities(String(artist.name || 'Unknown')),
                        url: artist.url || '',
                        image: artist.image?.[1]?.url || ''
                    }))
                    : song.primaryArtists
                        ? song.primaryArtists.split(',').map(name => ({ name: decodeHtmlEntities(name.trim()) }))
                        : [{ name: 'Unknown Artist' }],
                album: {
                    name: decodeHtmlEntities(String(song.album?.name || song.album || 'Unknown Album')),
                    id: song.album?.id || null,
                    url: song.album?.url || null
                },
                image: song.image ? [
                    { link: song.image[2]?.url || song.image[2]?.link || '' },
                    { link: song.image[1]?.url || song.image[1]?.link || '' },
                    { link: song.image[0]?.url || song.image[0]?.link || '' }
                ] : [{ link: '' }, { link: '' }, { link: '' }],
                duration: Number(song.duration) || 0,
                download_url: downloadUrl,
                downloadUrl: downloadUrlArray || song.downloadUrl,
                year: song.year || null,
                playCount: song.playCount || null,
                hasLyrics: Boolean(song.hasLyrics),
                language: song.language || null,
                url: song.url || null
            }
        })
}

/**
 * Format artists from API response
 */
const formatArtists = (artists) => {
    if (!Array.isArray(artists)) return []

    return artists
        .filter(artist => artist && artist.id)
        .map(artist => ({
            id: String(artist.id),
            name: String(artist.name || 'Unknown Artist'),
            role: artist.role || 'Artist',
            image: artist.image ? artist.image.map(img => ({
                quality: img.quality || '',
                url: img.url || ''
            })) : [],
            type: artist.type || 'artist',
            url: artist.url || '',
            followerCount: artist.followerCount || null,
            bio: artist.bio || null,
            dominantLanguage: artist.dominantLanguage || null,
            dominantType: artist.dominantType || null
        }))
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Global search - songs, albums, artists, playlists
 */
export const searchAll = async (query) => {
    const sanitizedQuery = sanitizeSearchQuery(query)
    if (!sanitizedQuery) {
        return { success: false, data: null, error: 'Invalid search query' }
    }

    return apiCall(`/api/search?query=${encodeURIComponent(sanitizedQuery)}`)
}

/**
 * Search songs with pagination
 */
export const searchSongs = async (query, page = 0, limit = 10) => {
    const sanitizedQuery = sanitizeSearchQuery(query)
    if (!sanitizedQuery) {
        return { success: false, data: { results: [] }, error: 'Invalid search query' }
    }

    const { page: validPage, limit: validLimit } = validatePagination(page, limit)

    const data = await apiCall(
        `/api/search/songs?query=${encodeURIComponent(sanitizedQuery)}&page=${validPage}&limit=${validLimit}`
    )

    if (data.data?.results) {
        data.data.results = formatSongs(data.data.results)
    }

    return data
}

/**
 * Search albums
 */
export const searchAlbums = async (query, page = 0, limit = 10) => {
    const sanitizedQuery = sanitizeSearchQuery(query)
    if (!sanitizedQuery) {
        return { success: false, data: { results: [] }, error: 'Invalid search query' }
    }

    const { page: validPage, limit: validLimit } = validatePagination(page, limit)

    return apiCall(
        `/api/search/albums?query=${encodeURIComponent(sanitizedQuery)}&page=${validPage}&limit=${validLimit}`
    )
}

/**
 * Search artists
 */
export const searchArtists = async (query, page = 0, limit = 10) => {
    const sanitizedQuery = sanitizeSearchQuery(query)
    if (!sanitizedQuery) {
        return { success: false, data: { results: [] }, error: 'Invalid search query' }
    }

    const { page: validPage, limit: validLimit } = validatePagination(page, limit)

    const data = await apiCall(
        `/api/search/artists?query=${encodeURIComponent(sanitizedQuery)}&page=${validPage}&limit=${validLimit}`
    )

    if (data.data?.results) {
        data.data.results = formatArtists(data.data.results)
    }

    return data
}

/**
 * Search playlists
 */
export const searchPlaylists = async (query, page = 0, limit = 10) => {
    const sanitizedQuery = sanitizeSearchQuery(query)
    if (!sanitizedQuery) {
        return { success: false, data: { results: [] }, error: 'Invalid search query' }
    }

    const { page: validPage, limit: validLimit } = validatePagination(page, limit)

    return apiCall(
        `/api/search/playlists?query=${encodeURIComponent(sanitizedQuery)}&page=${validPage}&limit=${validLimit}`
    )
}

/**
 * Get song by ID
 */
export const getSong = async (id) => {
    if (!id || typeof id !== 'string') {
        return { success: false, data: null, error: 'Invalid song ID' }
    }

    // Sanitize ID - only allow alphanumeric and common safe chars
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!sanitizedId) {
        return { success: false, data: null, error: 'Invalid song ID' }
    }

    const data = await apiCall(`/api/songs/${sanitizedId}`, { cacheTTL: 10 * 60 * 1000 })

    if (data.data) {
        if (Array.isArray(data.data) && data.data.length > 0) {
            data.data = formatSongs([data.data[0]])[0]
        } else if (!Array.isArray(data.data)) {
            data.data = formatSongs([data.data])[0]
        }
    }

    return data
}

/**
 * Get album by ID
 */
export const getAlbum = async (id) => {
    if (!id) {
        return { success: false, data: null, error: 'Invalid album ID' }
    }

    const sanitizedId = String(id).replace(/[^a-zA-Z0-9_-]/g, '')
    return apiCall(`/api/albums?id=${sanitizedId}`, { cacheTTL: 10 * 60 * 1000 })
}

/**
 * Get artist by ID
 */
export const getArtist = async (id) => {
    if (!id) {
        return { success: false, data: null, error: 'Invalid artist ID' }
    }

    const sanitizedId = String(id).replace(/[^a-zA-Z0-9_-]/g, '')
    return apiCall(`/api/artists/${sanitizedId}`, { cacheTTL: 10 * 60 * 1000 })
}

/**
 * Get artist's songs
 */
export const getArtistSongs = async (artistId, page = 0, sortBy = 'popularity', sortOrder = 'desc') => {
    if (!artistId) {
        return { success: false, data: { songs: [] }, error: 'Invalid artist ID' }
    }

    const sanitizedId = String(artistId).replace(/[^a-zA-Z0-9_-]/g, '')
    const { page: validPage } = validatePagination(page, 10)

    // Validate sort options
    const validSortBy = ['popularity', 'latest', 'alphabetical'].includes(sortBy)
        ? sortBy
        : 'popularity'
    const validSortOrder = ['asc', 'desc'].includes(sortOrder)
        ? sortOrder
        : 'desc'

    const data = await apiCall(
        `/api/artists/${sanitizedId}/songs?page=${validPage}&sortBy=${validSortBy}&sortOrder=${validSortOrder}`
    )

    if (data.data?.songs) {
        data.data.songs = formatSongs(data.data.songs)
    } else if (data.data?.results) {
        data.data.results = formatSongs(data.data.results)
    }

    return data
}

/**
 * Get playlist by ID
 */
export const getPlaylist = async (id) => {
    if (!id) {
        return { success: false, data: null, error: 'Invalid playlist ID' }
    }

    const sanitizedId = String(id).replace(/[^a-zA-Z0-9_-]/g, '')
    return apiCall(`/api/playlists?id=${sanitizedId}`, { cacheTTL: 5 * 60 * 1000 })
}

/**
 * Get song suggestions for infinite playback
 */
export const getSongSuggestions = async (songId, limit = 10) => {
    if (!songId) {
        return { success: false, data: [], error: 'Invalid song ID' }
    }

    const sanitizedId = String(songId).replace(/[^a-zA-Z0-9_-]/g, '')
    const validLimit = Math.min(50, Math.max(1, Number(limit) || 10))

    const data = await apiCall(
        `/api/songs/${sanitizedId}/suggestions?limit=${validLimit}`
    )

    if (data.data && Array.isArray(data.data)) {
        data.data = formatSongs(data.data)
    }

    return data
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { formatSongs, formatArtists, responseCache, APIError, API_ERROR_CODES }

// Cache management utilities
export const clearCache = () => responseCache.clear()
export const getCacheStats = () => responseCache.getStats()
export const getRateLimitStatus = () => apiRateLimiter.getStatus()
