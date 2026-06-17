import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { usePlayer } from '@/context/PlayerContext'
import { isElectron, selectMusicFiles, selectMusicFolder, scanMusicFolder, parseMusicMetadata, electronStore } from '@/lib/electron'
import SongList from './SongList'

export default function LocalMusicPlayer() {
    const { colors, fonts, isDark } = useTheme()
    const { playSong, addToQueue } = usePlayer()

    const [localSongs, setLocalSongs] = useState([])
    const [isScanning, setIsScanning] = useState(false)
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 })
    const [folders, setFolders] = useState([])
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    // Load saved local songs on mount
    useEffect(() => {
        loadLocalSongs()
        loadSavedFolders()
    }, [])

    const loadLocalSongs = async () => {
        if (isElectron()) {
            const saved = await electronStore.get('localSongs', [])
            setLocalSongs(saved)
        }
    }

    const loadSavedFolders = async () => {
        if (isElectron()) {
            const saved = await electronStore.get('musicFolders', [])
            setFolders(saved)
        }
    }

    const saveSongs = async (songs) => {
        if (isElectron()) {
            await electronStore.set('localSongs', songs)
        }
    }

    const saveFolders = async (folders) => {
        if (isElectron()) {
            await electronStore.set('musicFolders', folders)
        }
    }

    const handleAddFiles = async () => {
        const files = await selectMusicFiles()
        if (!files || files.length === 0) return

        setIsScanning(true)
        const newSongs = []

        for (let i = 0; i < files.length; i++) {
            setScanProgress({ current: i + 1, total: files.length })
            const metadata = await parseMusicMetadata(files[i])
            if (metadata) {
                newSongs.push(metadata)
            }
        }

        const updated = [...localSongs, ...newSongs]
        setLocalSongs(updated)
        await saveSongs(updated)
        setIsScanning(false)
        setScanProgress({ current: 0, total: 0 })
    }

    const handleAddFolder = async () => {
        const folder = await selectMusicFolder()
        if (!folder) return

        // Add to folders list
        if (!folders.includes(folder)) {
            const updatedFolders = [...folders, folder]
            setFolders(updatedFolders)
            await saveFolders(updatedFolders)
        }

        setIsScanning(true)
        const files = await scanMusicFolder(folder)
        const newSongs = []

        for (let i = 0; i < files.length; i++) {
            setScanProgress({ current: i + 1, total: files.length })

            // Skip if already in library
            if (localSongs.some(s => s.filePath === files[i])) {
                continue
            }

            const metadata = await parseMusicMetadata(files[i])
            if (metadata) {
                newSongs.push(metadata)
            }
        }

        const updated = [...localSongs, ...newSongs]
        setLocalSongs(updated)
        await saveSongs(updated)
        setIsScanning(false)
        setScanProgress({ current: 0, total: 0 })
    }

    const handleRescanFolders = async () => {
        if (folders.length === 0) return

        setIsScanning(true)
        const allFiles = []

        for (const folder of folders) {
            const files = await scanMusicFolder(folder)
            allFiles.push(...files)
        }

        const newSongs = []
        for (let i = 0; i < allFiles.length; i++) {
            setScanProgress({ current: i + 1, total: allFiles.length })

            if (localSongs.some(s => s.filePath === allFiles[i])) {
                continue
            }

            const metadata = await parseMusicMetadata(allFiles[i])
            if (metadata) {
                newSongs.push(metadata)
            }
        }

        if (newSongs.length > 0) {
            const updated = [...localSongs, ...newSongs]
            setLocalSongs(updated)
            await saveSongs(updated)
        }

        setIsScanning(false)
        setScanProgress({ current: 0, total: 0 })
    }

    const handleClearLibrary = async () => {
        setLocalSongs([])
        await saveSongs([])
        setShowClearConfirm(false)
    }

    if (!isElectron()) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: colors.paper,
                color: colors.ink,
                padding: '40px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>
                        Desktop App Only
                    </h1>
                    <p style={{ color: colors.inkMuted, fontSize: '16px' }}>
                        Local music playback is only available in the desktop app.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: colors.paper,
            color: colors.ink,
            padding: '40px 20px',
            fontFamily: fonts.primary
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        fontFamily: fonts.display,
                        marginBottom: '12px'
                    }}>
                        Local Music
                    </h1>
                    <p style={{ color: colors.inkMuted, fontSize: '16px', marginBottom: '20px' }}>
                        Play music files from your computer
                    </p>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleAddFiles}
                            disabled={isScanning}
                            className="ske-raised ske-spring-btn"
                            style={{
                                padding: '12px 24px',
                                background: isScanning ? colors.paperDarker : `linear-gradient(145deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                                color: '#FFFFFF',
                                border: '1px solid rgba(255,255,255,0.22)',
                                borderRadius: '8px',
                                cursor: isScanning ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                                opacity: isScanning ? 0.5 : 1
                            }}
                        >
                            + Add Files
                        </button>

                        <button
                            onClick={handleAddFolder}
                            disabled={isScanning}
                            className="ske-raised ske-spring-btn"
                            style={{
                                padding: '12px 24px',
                                background: isScanning ? colors.paperDarker : `linear-gradient(145deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                                color: '#FFFFFF',
                                border: '1px solid rgba(255,255,255,0.22)',
                                borderRadius: '8px',
                                cursor: isScanning ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                                opacity: isScanning ? 0.5 : 1
                            }}
                        >
                            + Add Folder
                        </button>

                        {folders.length > 0 && (
                            <button
                                onClick={handleRescanFolders}
                                disabled={isScanning}
                                className="ske-raised-xs ske-spring-btn"
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: colors.paperDark,
                                    color: colors.ink,
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'}`,
                                    borderRadius: '8px',
                                    cursor: isScanning ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    opacity: isScanning ? 0.5 : 1
                                }}
                            >
                                🔄 Rescan
                            </button>
                        )}

                        {localSongs.length > 0 && (
                            !showClearConfirm ? (
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    disabled={isScanning}
                                    className="ske-raised-xs ske-spring-btn"
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: colors.paperDark,
                                        color: '#FF4F4F',
                                        border: '1px solid rgba(255,75,75,0.28)',
                                        borderRadius: '8px',
                                        cursor: isScanning ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        opacity: isScanning ? 0.5 : 1
                                    }}
                                >
                                    Clear Library
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 12px', background: 'rgba(255, 75, 75, 0.08)', borderRadius: '8px', border: '1px solid rgba(255, 75, 75, 0.2)' }}>
                                    <span style={{ fontSize: '12px', color: '#FF4F4F', fontWeight: 600 }}>Confirm library clear?</span>
                                    <button
                                        onClick={handleClearLibrary}
                                        className="ske-raised-xs"
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: colors.paperDark,
                                            color: '#FF4F4F',
                                            border: '1px solid rgba(255,75,75,0.28)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Yes, Clear
                                    </button>
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="ske-raised-xs"
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: colors.paperDark,
                                            color: colors.ink,
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'}`,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Scanning Progress */}
                {isScanning && (
                    <div 
                        className="ske-card ske-textured"
                        style={{
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '30px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)'}`,
                        }}
                    >
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                            Scanning files...
                        </div>
                        <div style={{ fontSize: '14px', color: colors.inkMuted }}>
                            {scanProgress.current} / {scanProgress.total} files processed
                        </div>
                        <div 
                            className="ske-recessed"
                            style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: colors.paperDarker,
                                borderRadius: '4px',
                                marginTop: '12px',
                                overflow: 'hidden',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            }}
                        >
                            <div 
                                className="ske-progress-fill"
                                style={{
                                    width: `${(scanProgress.current / scanProgress.total) * 100}%`,
                                    height: '100%',
                                    backgroundColor: colors.accent,
                                    transition: 'width 0.3s ease'
                                }} 
                            />
                        </div>
                    </div>
                )}

                {/* Watched Folders */}
                {folders.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
                            Music Folders
                        </h2>
                        <div 
                            className="ske-recessed ske-textured"
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)'}`,
                            }}
                        >
                            {folders.map((folder, index) => (
                                <div key={index} style={{
                                    padding: '8px',
                                    fontSize: '14px',
                                    color: colors.inkMuted,
                                    fontFamily: fonts.mono
                                }}>
                                    📁 {folder}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats */}
                {localSongs.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <div 
                            className="ske-recessed ske-textured"
                            style={{
                                padding: '16px 20px',
                                borderRadius: '12px',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)'}`,
                                fontSize: '14px',
                                color: colors.inkMuted
                            }}
                        >
                            {localSongs.length} songs in your local library
                        </div>
                    </div>
                )}

                {/* Song List */}
                {localSongs.length > 0 ? (
                    <SongList
                        songs={localSongs}
                        onSongClick={playSong}
                        onAddToQueue={addToQueue}
                        showArtist={true}
                        showAlbum={true}
                    />
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: colors.inkMuted
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                            No local music yet
                        </h3>
                        <p style={{ fontSize: '14px' }}>
                            Add music files or folders to get started
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
