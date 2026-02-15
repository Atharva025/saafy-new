/**
 * ELECTRON PRELOAD SCRIPT
 * Secure bridge between main and renderer processes
 * Exposes controlled APIs to the web app
 */

const { contextBridge, ipcRenderer } = require('electron')

// ============================================================================
// EXPOSED API
// ============================================================================

contextBridge.exposeInMainWorld('electronAPI', {
    // Platform info
    platform: process.platform,
    isElectron: true,

    // Store operations (secure persistent storage)
    store: {
        get: (key, defaultValue) => ipcRenderer.invoke('store-get', key, defaultValue),
        set: (key, value) => ipcRenderer.invoke('store-set', key, value),
        delete: (key) => ipcRenderer.invoke('store-delete', key),
        clear: () => ipcRenderer.invoke('store-clear')
    },

    // File system operations
    selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
    selectMusicFiles: () => ipcRenderer.invoke('select-music-files'),
    scanMusicFolder: (folderPath) => ipcRenderer.invoke('scan-music-folder', folderPath),
    parseMusicMetadata: (filePath) => ipcRenderer.invoke('parse-music-metadata', filePath),

    // Window controls
    windowMinimize: () => ipcRenderer.send('window-minimize'),
    windowMaximize: () => ipcRenderer.send('window-maximize'),
    windowClose: () => ipcRenderer.send('window-close'),
    toggleMiniPlayer: () => ipcRenderer.send('toggle-mini-player'),

    // Media controls (from tray/global shortcuts)
    onMediaControl: (callback) => {
        ipcRenderer.on('media-control', (event, action) => callback(action))
    },

    // Tray updates
    updateTray: (songName, isPlaying) => {
        ipcRenderer.send('update-tray', songName, isPlaying)
    },

    // Navigation
    onNavigate: (callback) => {
        ipcRenderer.on('navigate', (event, route) => callback(route))
    },

    // System info
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    getVersion: () => ipcRenderer.invoke('get-version'),

    // Theme sync
    getNativeTheme: () => ipcRenderer.invoke('get-native-theme'),
    onThemeChanged: (callback) => {
        ipcRenderer.on('theme-changed', (event, shouldUseDarkColors) => callback(shouldUseDarkColors))
    },

    // Remove listeners (important for cleanup)
    removeMediaControlListener: () => {
        ipcRenderer.removeAllListeners('media-control')
    },
    removeNavigateListener: () => {
        ipcRenderer.removeAllListeners('navigate')
    },
    removeThemeChangedListener: () => {
        ipcRenderer.removeAllListeners('theme-changed')
    }
})

// Log when preload is loaded (dev only)
if (process.env.NODE_ENV === 'development') {
    console.log('Electron preload script loaded')
}
