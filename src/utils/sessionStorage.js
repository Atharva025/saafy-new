/**
 * SESSION STORAGE UTILITIES
 * Manages session-based tracking of played songs
 * Data persists until tab/browser is closed
 */

const SESSION_KEY = 'saafy_played_songs_session'

/**
 * Get all song IDs played in current session
 * @returns {string[]} Array of song IDs
 */
export const getSessionPlayedSongs = () => {
    try {
        const stored = sessionStorage.getItem(SESSION_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (error) {
        console.error('Error reading session storage:', error)
        return []
    }
}

/**
 * Add a song ID to the session played list
 * @param {string} songId - The song ID to add
 * @returns {string[]} Updated array of song IDs
 */
export const addToSessionPlayedSongs = (songId) => {
    try {
        if (!songId) return getSessionPlayedSongs()

        const played = getSessionPlayedSongs()

        // Only add if not already in the list
        if (!played.includes(songId)) {
            played.push(songId)
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(played))
        }

        return played
    } catch (error) {
        console.error('Error adding to session storage:', error)
        return getSessionPlayedSongs()
    }
}

/**
 * Check if a song has been played in this session
 * @param {string} songId - The song ID to check
 * @returns {boolean}
 */
export const hasBeenPlayedInSession = (songId) => {
    if (!songId) return false
    const played = getSessionPlayedSongs()
    return played.includes(songId)
}

/**
 * Clear all session played songs (usually not needed as sessionStorage auto-clears)
 */
export const clearSessionPlayedSongs = () => {
    try {
        sessionStorage.removeItem(SESSION_KEY)
    } catch (error) {
        console.error('Error clearing session storage:', error)
    }
}

/**
 * Get count of songs played in session
 * @returns {number}
 */
export const getSessionPlayedCount = () => {
    return getSessionPlayedSongs().length
}

/**
 * Debug helper - log all session songs to console
 */
export const debugSessionSongs = () => {
    const songs = getSessionPlayedSongs()
    console.log('🎵 Session Tracking Debug:')
    console.log(`Total songs played this session: ${songs.length}`)
    console.log('Song IDs:', songs)
    return songs
}

// Expose debug function to window for easy console access
if (typeof window !== 'undefined') {
    window.debugSessionSongs = debugSessionSongs
}
