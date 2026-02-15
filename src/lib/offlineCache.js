/**
 * OFFLINE CACHING SYSTEM
 * Cache songs for offline playback
 */

import { isElectron, electronStore } from './electron'

const MAX_CACHE_SIZE_MB = 500
const CACHE_DB_NAME = 'saafy_offline_cache'
const CACHE_STORE_NAME = 'songs'

// IndexedDB setup for browser
let db = null

const initDB = () => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB not supported'))
            return
        }

        const request = indexedDB.open(CACHE_DB_NAME, 1)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
            db = request.result
            resolve(db)
        }

        request.onupgradeneeded = (event) => {
            const db = event.target.result
            if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                const objectStore = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'id' })
                objectStore.createIndex('timestamp', 'timestamp', { unique: false })
            }
        }
    })
}

/**
 * Cache a song for offline playback
 * @param {Object} song - Song object with audio URL
 * @returns {Promise<boolean>} - Success status
 */
export const cacheSong = async (song) => {
    if (!song?.id || !song?.url) return false

    try {
        // Download audio file
        const response = await fetch(song.url)
        if (!response.ok) return false

        const blob = await response.blob()

        // Check size limit (50MB per song)
        if (blob.size > 50 * 1024 * 1024) {
            console.warn('Song too large to cache:', song.name)
            return false
        }

        if (isElectron()) {
            // Store in electron-store with Base64 encoding
            const reader = new FileReader()
            return new Promise((resolve) => {
                reader.onloadend = async () => {
                    const base64data = reader.result
                    const cached = await electronStore.get('offlineCache', {})
                    cached[song.id] = {
                        id: song.id,
                        name: song.name,
                        artist: song.primaryArtists,
                        image: song.image,
                        audioData: base64data,
                        timestamp: Date.now(),
                        size: blob.size
                    }
                    await electronStore.set('offlineCache', cached)
                    resolve(true)
                }
                reader.onerror = () => resolve(false)
                reader.readAsDataURL(blob)
            })
        } else {
            // Store in IndexedDB for browser
            if (!db) await initDB()

            const cacheData = {
                id: song.id,
                name: song.name,
                artist: song.primaryArtists,
                image: song.image,
                audioBlob: blob,
                timestamp: Date.now(),
                size: blob.size
            }

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite')
                const store = transaction.objectStore(CACHE_STORE_NAME)
                const request = store.put(cacheData)

                request.onsuccess = () => resolve(true)
                request.onerror = () => reject(request.error)
            })
        }
    } catch (error) {
        console.error('Failed to cache song:', error)
        return false
    }
}

/**
 * Get cached song
 * @param {string} songId - Song ID
 * @returns {Promise<Object|null>} - Cached song or null
 */
export const getCachedSong = async (songId) => {
    if (!songId) return null

    try {
        if (isElectron()) {
            const cached = await electronStore.get('offlineCache', {})
            return cached[songId] || null
        } else {
            if (!db) await initDB()

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CACHE_STORE_NAME], 'readonly')
                const store = transaction.objectStore(CACHE_STORE_NAME)
                const request = store.get(songId)

                request.onsuccess = () => resolve(request.result || null)
                request.onerror = () => reject(request.error)
            })
        }
    } catch (error) {
        console.error('Failed to get cached song:', error)
        return null
    }
}

/**
 * Check if song is cached
 * @param {string} songId - Song ID
 * @returns {Promise<boolean>} - Whether song is cached
 */
export const isSongCached = async (songId) => {
    const cached = await getCachedSong(songId)
    return cached !== null
}

/**
 * Get all cached songs
 * @returns {Promise<Array>} - Array of cached songs
 */
export const getAllCachedSongs = async () => {
    try {
        if (isElectron()) {
            const cached = await electronStore.get('offlineCache', {})
            return Object.values(cached)
        } else {
            if (!db) await initDB()

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CACHE_STORE_NAME], 'readonly')
                const store = transaction.objectStore(CACHE_STORE_NAME)
                const request = store.getAll()

                request.onsuccess = () => resolve(request.result || [])
                request.onerror = () => reject(request.error)
            })
        }
    } catch (error) {
        console.error('Failed to get cached songs:', error)
        return []
    }
}

/**
 * Remove cached song
 * @param {string} songId - Song ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeCachedSong = async (songId) => {
    if (!songId) return false

    try {
        if (isElectron()) {
            const cached = await electronStore.get('offlineCache', {})
            delete cached[songId]
            await electronStore.set('offlineCache', cached)
            return true
        } else {
            if (!db) await initDB()

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite')
                const store = transaction.objectStore(CACHE_STORE_NAME)
                const request = store.delete(songId)

                request.onsuccess = () => resolve(true)
                request.onerror = () => reject(request.error)
            })
        }
    } catch (error) {
        console.error('Failed to remove cached song:', error)
        return false
    }
}

/**
 * Clear all cached songs
 * @returns {Promise<boolean>} - Success status
 */
export const clearCache = async () => {
    try {
        if (isElectron()) {
            await electronStore.set('offlineCache', {})
            return true
        } else {
            if (!db) await initDB()

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite')
                const store = transaction.objectStore(CACHE_STORE_NAME)
                const request = store.clear()

                request.onsuccess = () => resolve(true)
                request.onerror = () => reject(request.error)
            })
        }
    } catch (error) {
        console.error('Failed to clear cache:', error)
        return false
    }
}

/**
 * Get cache size in MB
 * @returns {Promise<number>} - Cache size in MB
 */
export const getCacheSize = async () => {
    try {
        const songs = await getAllCachedSongs()
        const totalBytes = songs.reduce((sum, song) => sum + (song.size || 0), 0)
        return totalBytes / (1024 * 1024) // Convert to MB
    } catch {
        return 0
    }
}

/**
 * Clean up old cached songs if cache is too large
 * @returns {Promise<void>}
 */
export const cleanupCache = async () => {
    try {
        const size = await getCacheSize()
        if (size <= MAX_CACHE_SIZE_MB) return

        const songs = await getAllCachedSongs()
        // Sort by timestamp (oldest first)
        songs.sort((a, b) => a.timestamp - b.timestamp)

        // Remove oldest songs until under limit
        let currentSize = size
        for (const song of songs) {
            if (currentSize <= MAX_CACHE_SIZE_MB * 0.8) break // Remove until 80% of max

            await removeCachedSong(song.id)
            currentSize -= (song.size || 0) / (1024 * 1024)
        }
    } catch (error) {
        console.error('Cache cleanup failed:', error)
    }
}
