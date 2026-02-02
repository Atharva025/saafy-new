/**
 * SECURITY UTILITIES
 * Comprehensive security layer for the Saafy music app
 * 
 * This module provides:
 * - Input sanitization (XSS prevention)
 * - Rate limiting / throttling
 * - Request validation
 * - Safe storage operations
 * - Security logging (dev only)
 */

// ============================================================================
// INPUT SANITIZATION - XSS Prevention
// ============================================================================

/**
 * HTML entity map for escaping dangerous characters
 */
const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
}

/**
 * Escape HTML entities to prevent XSS attacks
 * @param {string} str - Raw string input
 * @returns {string} - Sanitized string safe for HTML rendering
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return ''
    return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char])
}

/**
 * Sanitize user input - removes dangerous patterns and limits length
 * @param {string} input - Raw user input
 * @param {Object} options - Sanitization options
 * @returns {string} - Cleaned input
 */
export function sanitizeInput(input, options = {}) {
    const {
        maxLength = 500,
        allowHtml = false,
        trimWhitespace = true,
        removeNullBytes = true,
        removeControlChars = true
    } = options

    if (typeof input !== 'string') {
        return ''
    }

    let sanitized = input

    // Remove null bytes (can be used for bypass attacks)
    if (removeNullBytes) {
        sanitized = sanitized.replace(/\x00/g, '')
    }

    // Remove control characters (except newline, tab)
    if (removeControlChars) {
        sanitized = sanitized.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    }

    // Trim whitespace
    if (trimWhitespace) {
        sanitized = sanitized.trim()
    }

    // Limit length to prevent DoS
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength)
    }

    // Escape HTML if not allowed
    if (!allowHtml) {
        sanitized = escapeHtml(sanitized)
    }

    return sanitized
}

/**
 * Sanitize search query - aggressive cleaning for API queries
 * @param {string} query - Raw search query
 * @returns {string} - Safe query string
 */
export function sanitizeSearchQuery(query) {
    if (typeof query !== 'string') return ''

    return query
        // Remove potential SQL injection patterns
        .replace(/['";\\]/g, '')
        // Remove potential NoSQL injection patterns
        .replace(/[${}]/g, '')
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Trim and limit length
        .trim()
        .substring(0, 200)
}

/**
 * Validate and sanitize a URL
 * @param {string} url - URL to validate
 * @param {string[]} allowedDomains - List of allowed domains
 * @returns {string|null} - Valid URL or null if invalid
 */
export function sanitizeUrl(url, allowedDomains = []) {
    if (typeof url !== 'string') return null

    try {
        const parsed = new URL(url)

        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null
        }

        // Check against allowed domains if specified
        if (allowedDomains.length > 0) {
            const isAllowed = allowedDomains.some(domain =>
                parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
            )
            if (!isAllowed) {
                return null
            }
        }

        return parsed.href
    } catch {
        return null
    }
}

// ============================================================================
// RATE LIMITING / THROTTLING
// ============================================================================

/**
 * Create a debounced function - waits for pause in calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
    let timeoutId = null

    const debounced = function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            func.apply(this, args)
            timeoutId = null
        }, wait)
    }

    debounced.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
    }

    return debounced
}

/**
 * Create a throttled function - limits call frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in ms
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 1000) {
    let inThrottle = false
    let lastResult

    return function (...args) {
        if (!inThrottle) {
            lastResult = func.apply(this, args)
            inThrottle = true

            setTimeout(() => {
                inThrottle = false
            }, limit)
        }

        return lastResult
    }
}

/**
 * Rate limiter class for API calls
 * Implements token bucket algorithm
 */
export class RateLimiter {
    constructor(options = {}) {
        this.maxTokens = options.maxTokens || 10
        this.refillRate = options.refillRate || 1 // tokens per second
        this.tokens = this.maxTokens
        this.lastRefill = Date.now()
        this.queue = []
        this.processing = false
    }

    refillTokens() {
        const now = Date.now()
        const elapsed = (now - this.lastRefill) / 1000
        const tokensToAdd = elapsed * this.refillRate

        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
        this.lastRefill = now
    }

    async acquire() {
        this.refillTokens()

        if (this.tokens >= 1) {
            this.tokens -= 1
            return true
        }

        // Wait for token to become available
        const waitTime = (1 - this.tokens) / this.refillRate * 1000
        await new Promise(resolve => setTimeout(resolve, waitTime))

        return this.acquire()
    }

    async execute(fn) {
        await this.acquire()
        return fn()
    }

    getStatus() {
        this.refillTokens()
        return {
            availableTokens: Math.floor(this.tokens),
            maxTokens: this.maxTokens,
            refillRate: this.refillRate
        }
    }
}

// Global rate limiter instance for API calls
export const apiRateLimiter = new RateLimiter({
    maxTokens: 15,      // Max 15 requests in burst
    refillRate: 2       // 2 requests per second sustained
})

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Validate API response structure
 * @param {Object} response - API response object
 * @param {string[]} requiredFields - Required field names
 * @returns {boolean} - Whether response is valid
 */
export function validateApiResponse(response, requiredFields = ['success', 'data']) {
    if (!response || typeof response !== 'object') {
        return false
    }

    return requiredFields.every(field => field in response)
}

/**
 * Validate song object has required fields
 * @param {Object} song - Song object to validate
 * @returns {boolean} - Whether song is valid
 */
export function validateSong(song) {
    if (!song || typeof song !== 'object') return false

    const requiredFields = ['id', 'name']
    return requiredFields.every(field => song[field])
}

/**
 * Validate artist object
 * @param {Object} artist - Artist object to validate
 * @returns {boolean} - Whether artist is valid
 */
export function validateArtist(artist) {
    if (!artist || typeof artist !== 'object') return false

    return artist.id && artist.name
}

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} - Validated pagination params
 */
export function validatePagination(page, limit) {
    return {
        page: Math.max(0, Math.floor(Number(page) || 0)),
        limit: Math.min(50, Math.max(1, Math.floor(Number(limit) || 10)))
    }
}

// ============================================================================
// SAFE STORAGE OPERATIONS
// ============================================================================

const STORAGE_PREFIX = 'saafy_'
const MAX_STORAGE_ITEM_SIZE = 1024 * 1024 // 1MB max per item

/**
 * Safely get item from localStorage with validation
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found or invalid
 * @returns {*} - Parsed value or default
 */
export function safeGetStorage(key, defaultValue = null) {
    try {
        const prefixedKey = STORAGE_PREFIX + key
        const item = localStorage.getItem(prefixedKey)

        if (item === null) return defaultValue

        const parsed = JSON.parse(item)

        // Validate structure if it's an object
        if (parsed && typeof parsed === 'object') {
            // Check for timestamp and expiry if present
            if (parsed._expires && Date.now() > parsed._expires) {
                localStorage.removeItem(prefixedKey)
                return defaultValue
            }

            return parsed._value !== undefined ? parsed._value : parsed
        }

        return parsed
    } catch (error) {
        // Corrupted data - remove it
        try {
            localStorage.removeItem(STORAGE_PREFIX + key)
        } catch { }
        return defaultValue
    }
}

/**
 * Safely set item in localStorage with size limits
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {number} expiresIn - Optional expiry time in ms
 * @returns {boolean} - Whether storage was successful
 */
export function safeSetStorage(key, value, expiresIn = null) {
    try {
        const prefixedKey = STORAGE_PREFIX + key

        const wrapper = {
            _value: value,
            _timestamp: Date.now()
        }

        if (expiresIn) {
            wrapper._expires = Date.now() + expiresIn
        }

        const serialized = JSON.stringify(wrapper)

        // Check size limit
        if (serialized.length > MAX_STORAGE_ITEM_SIZE) {
            console.warn(`Storage item "${key}" exceeds size limit`)
            return false
        }

        localStorage.setItem(prefixedKey, serialized)
        return true
    } catch (error) {
        // Storage might be full or disabled
        return false
    }
}

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 */
export function safeRemoveStorage(key) {
    try {
        localStorage.removeItem(STORAGE_PREFIX + key)
    } catch { }
}

/**
 * Clear all app-related storage
 */
export function clearAppStorage() {
    try {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(STORAGE_PREFIX)) {
                keysToRemove.push(key)
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch { }
}

// ============================================================================
// SECURITY LOGGING (Development Only)
// ============================================================================

const IS_PRODUCTION = import.meta.env.PROD

/**
 * Security-aware logger - only logs in development
 */
export const securityLogger = {
    warn: (message, data = {}) => {
        if (!IS_PRODUCTION) {
            console.warn(`[SECURITY] ${message}`, data)
        }
    },

    error: (message, data = {}) => {
        if (!IS_PRODUCTION) {
            console.error(`[SECURITY] ${message}`, data)
        }
        // In production, could send to error tracking service
    },

    info: (message, data = {}) => {
        if (!IS_PRODUCTION) {
            console.info(`[SECURITY] ${message}`, data)
        }
    }
}

// ============================================================================
// CONTENT SECURITY
// ============================================================================

/**
 * Validate audio URL is from trusted source
 * @param {string} url - Audio URL to validate
 * @returns {boolean} - Whether URL is trusted
 */
export function isValidAudioSource(url) {
    if (!url || typeof url !== 'string') return false

    const trustedDomains = [
        'jiosaavn.com',
        'saavn.com',
        'jiocdn.com',
        'saavncdn.com',
        'cdnjojaudio.azureedge.net',
        'aac.saavncdn.com',
        'ac.cf.saavncdn.com'
    ]

    try {
        const parsed = new URL(url)
        return trustedDomains.some(domain =>
            parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
        )
    } catch {
        return false
    }
}

/**
 * Validate image URL is from trusted source
 * @param {string} url - Image URL to validate
 * @returns {boolean} - Whether URL is trusted
 */
export function isValidImageSource(url) {
    if (!url || typeof url !== 'string') return false

    const trustedDomains = [
        'jiosaavn.com',
        'saavn.com',
        'jiocdn.com',
        'saavncdn.com',
        'c.saavncdn.com',
        'c.sop.saavncdn.com'
    ]

    try {
        const parsed = new URL(url)
        return trustedDomains.some(domain =>
            parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
        )
    } catch {
        return false
    }
}

// ============================================================================
// FREEZE CRITICAL OBJECTS (Prevent Prototype Pollution)
// ============================================================================

/**
 * Deep freeze an object to prevent modification
 * @param {Object} obj - Object to freeze
 * @returns {Object} - Frozen object
 */
export function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    Object.keys(obj).forEach(key => {
        const value = obj[key]
        if (value && typeof value === 'object') {
            deepFreeze(value)
        }
    })

    return Object.freeze(obj)
}

// Export frozen security config
export const SECURITY_CONFIG = deepFreeze({
    MAX_SEARCH_LENGTH: 200,
    MAX_QUEUE_SIZE: 500,
    MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB total
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    MAX_REQUESTS_PER_WINDOW: 60,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    TRUSTED_AUDIO_DOMAINS: [
        'jiosaavn.com',
        'saavn.com',
        'jiocdn.com',
        'saavncdn.com'
    ]
})
