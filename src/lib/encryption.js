/**
 * ENCRYPTION UTILITIES
 * Simple encryption for local data storage
 * Uses Web Crypto API for browser and crypto for Node.js
 */

const IS_BROWSER = typeof window !== 'undefined'

// Simple encryption key derivation (in production, use better key management)
const ENCRYPTION_KEY = 'saafy_secure_key_v1_2026' // Should be user-specific in production

/**
 * Simple XOR encryption for localStorage data
 * Not military-grade but prevents casual snooping
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted text (base64)
 */
export function simpleEncrypt(text, key = ENCRYPTION_KEY) {
    if (!text) return ''

    try {
        const keyBytes = new TextEncoder().encode(key)
        const textBytes = new TextEncoder().encode(text)
        const encrypted = new Uint8Array(textBytes.length)

        for (let i = 0; i < textBytes.length; i++) {
            encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length]
        }

        // Convert to base64
        return btoa(String.fromCharCode(...encrypted))
    } catch (error) {
        console.error('Encryption failed:', error)
        return text // Fallback to unencrypted
    }
}

/**
 * Decrypt XOR encrypted text
 * @param {string} encrypted - Encrypted text (base64)
 * @param {string} key - Encryption key
 * @returns {string} - Decrypted text
 */
export function simpleDecrypt(encrypted, key = ENCRYPTION_KEY) {
    if (!encrypted) return ''

    try {
        // Decode from base64
        const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
        const keyBytes = new TextEncoder().encode(key)
        const decrypted = new Uint8Array(encryptedBytes.length)

        for (let i = 0; i < encryptedBytes.length; i++) {
            decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length]
        }

        return new TextDecoder().decode(decrypted)
    } catch (error) {
        console.error('Decryption failed:', error)
        return encrypted // Fallback to original
    }
}

/**
 * Encrypt and store data
 * @param {string} key - Storage key
 * @param {*} data - Data to store
 * @returns {boolean} - Success status
 */
export function encryptedSetItem(key, data) {
    try {
        const serialized = JSON.stringify(data)
        const encrypted = simpleEncrypt(serialized)
        localStorage.setItem(`saafy_enc_${key}`, encrypted)
        return true
    } catch (error) {
        console.error('Failed to store encrypted data:', error)
        return false
    }
}

/**
 * Retrieve and decrypt data
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default if not found
 * @returns {*} - Decrypted data
 */
export function encryptedGetItem(key, defaultValue = null) {
    try {
        const encrypted = localStorage.getItem(`saafy_enc_${key}`)
        if (!encrypted) return defaultValue

        const decrypted = simpleDecrypt(encrypted)
        return JSON.parse(decrypted)
    } catch (error) {
        console.error('Failed to retrieve encrypted data:', error)
        return defaultValue
    }
}

/**
 * Remove encrypted item
 * @param {string} key - Storage key
 */
export function encryptedRemoveItem(key) {
    try {
        localStorage.removeItem(`saafy_enc_${key}`)
    } catch (error) {
        console.error('Failed to remove encrypted item:', error)
    }
}

/**
 * Generate a device ID for fingerprinting
 * @returns {string} - Device ID
 */
export function generateDeviceId() {
    // Check if already exists
    let deviceId = localStorage.getItem('saafy_device_id')

    if (!deviceId) {
        // Generate new ID from browser fingerprint
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('fingerprint', 2, 2)
        const canvasData = canvas.toDataURL()

        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            canvasData.slice(0, 100)
        ].join('|')

        deviceId = btoa(fingerprint).slice(0, 32)
        localStorage.setItem('saafy_device_id', deviceId)
    }

    return deviceId
}

/**
 * Hash a string (for secure comparisons)
 * @param {string} str - String to hash
 * @returns {Promise<string>} - Hash
 */
export async function hashString(str) {
    if (!IS_BROWSER || !crypto.subtle) {
        // Fallback for non-browser environments
        return btoa(str)
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
