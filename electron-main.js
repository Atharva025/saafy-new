/**
 * SAAFY ELECTRON MAIN PROCESS
 * Handles window creation, system tray, IPC, and native OS integrations
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut, dialog, shell, nativeTheme } = require('electron')
const path = require('path')
const fs = require('fs')
const Store = require('electron-store')
const mm = require('music-metadata')

// Configuration
const isDev = process.env.NODE_ENV === 'development'
const store = new Store({
    name: 'saafy-config',
    encryptionKey: 'saafy_secure_encryption_key_2026'
})

let mainWindow = null
let tray = null
let miniPlayerWindow = null

// ============================================================================
// WINDOW CREATION
// ============================================================================

function createMainWindow() {
    // Restore previous window bounds
    const windowBounds = store.get('windowBounds', {
        width: 1400,
        height: 900
    })

    mainWindow = new BrowserWindow({
        ...windowBounds,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: '#1A1614',
        show: false,
        frame: true,
        titleBarStyle: 'default',
        icon: path.join(__dirname, 'public', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: isDev
        }
    })

    // Load app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
    }

    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
        mainWindow.focus()
    })

    // Save window bounds on resize/move
    mainWindow.on('resize', saveWindowBounds)
    mainWindow.on('move', saveWindowBounds)

    // Handle close
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault()
            mainWindow.hide()

            // Show tray notification on first minimize
            if (!store.get('hasSeenTrayNotification', false)) {
                tray?.displayBalloon({
                    title: 'Saafy is still running',
                    content: 'Click the tray icon to restore the window',
                    icon: path.join(__dirname, 'public', 'icon.png')
                })
                store.set('hasSeenTrayNotification', true)
            }
        }
    })

    // Handle navigation
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Open external links in default browser
        shell.openExternal(url)
        return { action: 'deny' }
    })
}

function saveWindowBounds() {
    if (mainWindow) {
        const bounds = mainWindow.getBounds()
        store.set('windowBounds', bounds)
    }
}

// ============================================================================
// MINI PLAYER
// ============================================================================

function createMiniPlayer() {
    if (miniPlayerWindow) {
        miniPlayerWindow.focus()
        return
    }

    miniPlayerWindow = new BrowserWindow({
        width: 400,
        height: 120,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    miniPlayerWindow.loadURL(isDev ? 'http://localhost:5173/#/mini' : `file://${path.join(__dirname, 'dist', 'index.html')}#/mini`)

    miniPlayerWindow.on('closed', () => {
        miniPlayerWindow = null
    })
}

// ============================================================================
// SYSTEM TRAY
// ============================================================================

function createTray() {
    const iconPath = path.join(__dirname, 'public', 'icon.png')

    tray = new Tray(iconPath)
    tray.setToolTip('Saafy Music Player')

    updateTrayMenu('Not playing', false)

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
            mainWindow.focus()
        }
    })

    tray.on('double-click', () => {
        mainWindow.show()
        mainWindow.focus()
    })
}

function updateTrayMenu(songName, isPlaying) {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: songName.length > 40 ? songName.substring(0, 40) + '...' : songName,
            enabled: false
        },
        { type: 'separator' },
        {
            label: isPlaying ? '⏸ Pause' : '▶ Play',
            click: () => mainWindow.webContents.send('media-control', 'playpause')
        },
        {
            label: '⏭ Next',
            click: () => mainWindow.webContents.send('media-control', 'next')
        },
        {
            label: '⏮ Previous',
            click: () => mainWindow.webContents.send('media-control', 'previous')
        },
        { type: 'separator' },
        {
            label: 'Mini Player',
            click: createMiniPlayer
        },
        {
            label: mainWindow.isVisible() ? 'Hide Window' : 'Show Window',
            click: () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide()
                } else {
                    mainWindow.show()
                    mainWindow.focus()
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => {
                mainWindow.show()
                mainWindow.webContents.send('navigate', '/settings')
            }
        },
        {
            label: 'Quit Saafy',
            click: () => {
                app.isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setContextMenu(contextMenu)
}

// ============================================================================
// GLOBAL SHORTCUTS
// ============================================================================

function registerGlobalShortcuts() {
    // Media keys
    globalShortcut.register('MediaPlayPause', () => {
        mainWindow.webContents.send('media-control', 'playpause')
    })

    globalShortcut.register('MediaNextTrack', () => {
        mainWindow.webContents.send('media-control', 'next')
    })

    globalShortcut.register('MediaPreviousTrack', () => {
        mainWindow.webContents.send('media-control', 'previous')
    })

    // Custom shortcuts
    globalShortcut.register('CommandOrControl+Shift+M', createMiniPlayer)
    globalShortcut.register('CommandOrControl+Shift+S', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
        }
    })
}

// ============================================================================
// IPC HANDLERS
// ============================================================================

// Store management
ipcMain.handle('store-get', (event, key, defaultValue) => {
    return store.get(key, defaultValue)
})

ipcMain.handle('store-set', (event, key, value) => {
    store.set(key, value)
    return true
})

ipcMain.handle('store-delete', (event, key) => {
    store.delete(key)
    return true
})

ipcMain.handle('store-clear', () => {
    store.clear()
    return true
})

// File system operations
ipcMain.handle('select-music-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    })
    return result.filePaths[0] || null
})

ipcMain.handle('select-music-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'] }
        ]
    })
    return result.filePaths || []
})

ipcMain.handle('scan-music-folder', async (event, folderPath) => {
    try {
        const audioExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg']
        const files = []

        function scanDirectory(dir) {
            const entries = fs.readdirSync(dir, { withFileTypes: true })

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name)

                if (entry.isDirectory()) {
                    scanDirectory(fullPath)
                } else if (audioExtensions.includes(path.extname(entry.name).toLowerCase())) {
                    files.push(fullPath)
                }
            }
        }

        scanDirectory(folderPath)
        return files
    } catch (error) {
        console.error('Error scanning folder:', error)
        return []
    }
})

ipcMain.handle('parse-music-metadata', async (event, filePath) => {
    try {
        const metadata = await mm.parseFile(filePath)
        const common = metadata.common

        return {
            id: `local_${Buffer.from(filePath).toString('base64')}`,
            name: common.title || path.basename(filePath, path.extname(filePath)),
            artist: common.artist || 'Unknown Artist',
            album: common.album || 'Unknown Album',
            year: common.year,
            duration: Math.floor(metadata.format.duration || 0),
            image: common.picture?.[0] ? `data:${common.picture[0].format};base64,${common.picture[0].data.toString('base64')}` : null,
            url: `file://${filePath}`,
            isLocal: true,
            filePath: filePath
        }
    } catch (error) {
        console.error('Error parsing metadata:', error)
        return {
            id: `local_${Buffer.from(filePath).toString('base64')}`,
            name: path.basename(filePath, path.extname(filePath)),
            artist: 'Unknown Artist',
            url: `file://${filePath}`,
            isLocal: true,
            filePath: filePath
        }
    }
})

// Window controls
ipcMain.on('update-tray', (event, songName, isPlaying) => {
    updateTrayMenu(songName, isPlaying)
})

ipcMain.on('toggle-mini-player', createMiniPlayer)

ipcMain.on('window-minimize', () => {
    mainWindow.minimize()
})

ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow.maximize()
    }
})

ipcMain.on('window-close', () => {
    mainWindow.hide()
})

// System info
ipcMain.handle('get-platform', () => process.platform)
ipcMain.handle('get-version', () => app.getVersion())

// Theme sync
ipcMain.handle('get-native-theme', () => nativeTheme.shouldUseDarkColors)

nativeTheme.on('updated', () => {
    mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors)
})

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.whenReady().then(() => {
    createMainWindow()
    createTray()
    registerGlobalShortcuts()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        } else {
            mainWindow.show()
        }
    })
})

app.on('window-all-closed', () => {
    // Keep app running on Windows/Linux when all windows are closed
    if (process.platform === 'darwin') {
        app.quit()
    }
})

app.on('before-quit', () => {
    app.isQuitting = true
    globalShortcut.unregisterAll()
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

// Handle second instance
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.show()
            mainWindow.focus()
        }
    })
}

// Security: Prevent loading remote content
app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl)

        if (!isDev && parsedUrl.origin !== 'file://') {
            event.preventDefault()
        }
    })
})
