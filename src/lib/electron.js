/**
 * ELECTRON UTILITIES
 * Helper functions for Electron integration
 * Falls back gracefully when running in browser
 */

// Check if running in Electron
export const isElectron = () => {
    return typeof window !== 'undefined' && window.electronAPI?.isElectron === true
}

// Get platform
export const getPlatform = () => {
    if (isElectron()) {
        return window.electronAPI.platform
    }
    return 'web'
}

// ============================================================================
// STORE OPERATIONS (Persistent Storage)
// ============================================================================

export const electronStore = {
    get: async (key, defaultValue = null) => {
        if (isElectron()) {
            return await window.electronAPI.store.get(key, defaultValue)
        }
        // Fallback to localStorage
        try {
            const item = localStorage.getItem(`electron_store_${key}`)
            return item ? JSON.parse(item) : defaultValue
        } catch {
            return defaultValue
        }
    },

    set: async (key, value) => {
        if (isElectron()) {
            return await window.electronAPI.store.set(key, value)
        }
        // Fallback to localStorage
        try {
            localStorage.setItem(`electron_store_${key}`, JSON.stringify(value))
            return true
        } catch {
            return false
        }
    },

    delete: async (key) => {
        if (isElectron()) {
            return await window.electronAPI.store.delete(key)
        }
        // Fallback to localStorage
        try {
            localStorage.removeItem(`electron_store_${key}`)
            return true
        } catch {
            return false
        }
    },

    clear: async () => {
        if (isElectron()) {
            return await window.electronAPI.store.clear()
        }
        // Fallback to localStorage
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('electron_store_'))
            keys.forEach(k => localStorage.removeItem(k))
            return true
        } catch {
            return false
        }
    }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

export const selectMusicFolder = async () => {
    if (isElectron()) {
        return await window.electronAPI.selectMusicFolder()
    }
    console.warn('File selection only available in desktop app')
    return null
}

export const selectMusicFiles = async () => {
    if (isElectron()) {
        return await window.electronAPI.selectMusicFiles()
    }
    console.warn('File selection only available in desktop app')
    return []
}

export const scanMusicFolder = async (folderPath) => {
    if (isElectron()) {
        return await window.electronAPI.scanMusicFolder(folderPath)
    }
    return []
}

export const parseMusicMetadata = async (filePath) => {
    if (isElectron()) {
        return await window.electronAPI.parseMusicMetadata(filePath)
    }
    return null
}

// ============================================================================
// WINDOW CONTROLS
// ============================================================================

export const windowControls = {
    minimize: () => {
        if (isElectron()) {
            window.electronAPI.windowMinimize()
        }
    },

    maximize: () => {
        if (isElectron()) {
            window.electronAPI.windowMaximize()
        }
    },

    close: () => {
        if (isElectron()) {
            window.electronAPI.windowClose()
        }
    },

    toggleMiniPlayer: () => {
        if (isElectron()) {
            window.electronAPI.toggleMiniPlayer()
        }
    }
}

// ============================================================================
// TRAY INTEGRATION
// ============================================================================

export const updateTray = (songName, isPlaying) => {
    if (isElectron()) {
        window.electronAPI.updateTray(songName || 'Not playing', isPlaying)
    }
}

// ============================================================================
// MEDIA CONTROLS (from global shortcuts)
// ============================================================================

export const registerMediaControlHandler = (handler) => {
    if (isElectron()) {
        window.electronAPI.onMediaControl(handler)

        // Return cleanup function
        return () => {
            window.electronAPI.removeMediaControlListener()
        }
    }
    return () => { }
}

// ============================================================================
// NAVIGATION
// ============================================================================

export const registerNavigationHandler = (handler) => {
    if (isElectron()) {
        window.electronAPI.onNavigate(handler)

        return () => {
            window.electronAPI.removeNavigateListener()
        }
    }
    return () => { }
}

// ============================================================================
// SYSTEM INFO
// ============================================================================

export const getSystemInfo = async () => {
    if (isElectron()) {
        const [platform, version] = await Promise.all([
            window.electronAPI.getPlatform(),
            window.electronAPI.getVersion()
        ])

        return {
            platform,
            version,
            isElectron: true
        }
    }

    return {
        platform: 'web',
        version: '1.0.0',
        isElectron: false
    }
}

// ============================================================================
// THEME SYNC
// ============================================================================

export const getNativeTheme = async () => {
    if (isElectron()) {
        return await window.electronAPI.getNativeTheme()
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const registerThemeChangeHandler = (handler) => {
    if (isElectron()) {
        window.electronAPI.onThemeChanged(handler)

        return () => {
            window.electronAPI.removeThemeChangedListener()
        }
    }

    // Fallback for web
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e) => handler(e.matches)
    mediaQuery.addEventListener('change', listener)

    return () => {
        mediaQuery.removeEventListener('change', listener)
    }
}
