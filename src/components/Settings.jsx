import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { isElectron, electronStore, selectMusicFolder, getSystemInfo } from '@/lib/electron'
import { clearAppStorage } from '@/lib/security'
import { encryptedGetItem, encryptedSetItem } from '@/lib/encryption'

export default function Settings() {
    const { colors, fonts, isDark, toggleTheme } = useTheme()

    // State
    const [settings, setSettings] = useState({
        audioQuality: 'high',
        downloadLocation: '',
        startMinimized: false,
        showNotifications: true,
        minimizeToTray: true,
        autoUpdate: true,
        theme: isDark ? 'dark' : 'light',
        volume: 0.7
    })

    const [systemInfo, setSystemInfo] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [savedMessage, setSavedMessage] = useState('')

    // Load settings on mount
    useEffect(() => {
        loadSettings()
        loadSystemInfo()
    }, [])

    const loadSettings = async () => {
        try {
            if (isElectron()) {
                const saved = await electronStore.get('settings', {})
                setSettings(prev => ({ ...prev, ...saved }))
            } else {
                const saved = encryptedGetItem('settings', {})
                setSettings(prev => ({ ...prev, ...saved }))
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        }
    }

    const loadSystemInfo = async () => {
        const info = await getSystemInfo()
        setSystemInfo(info)
    }

    const saveSettings = async () => {
        setIsSaving(true)
        try {
            if (isElectron()) {
                await electronStore.set('settings', settings)
            } else {
                encryptedSetItem('settings', settings)
            }

            setSavedMessage('Settings saved successfully!')
            setTimeout(() => setSavedMessage(''), 3000)
        } catch (error) {
            console.error('Failed to save settings:', error)
            setSavedMessage('Failed to save settings')
        }
        setIsSaving(false)
    }

    const handleSelectDownloadLocation = async () => {
        const folder = await selectMusicFolder()
        if (folder) {
            setSettings(prev => ({ ...prev, downloadLocation: folder }))
        }
    }

    const handleClearCache = () => {
        if (window.confirm('Are you sure you want to clear all cached data? This cannot be undone.')) {
            clearAppStorage()
            setSavedMessage('Cache cleared successfully!')
            setTimeout(() => setSavedMessage(''), 3000)
        }
    }

    const handleExportData = () => {
        try {
            const data = {
                settings,
                listeningHistory: encryptedGetItem('listening_history', []),
                theme: encryptedGetItem('theme', 'dark'),
                exportDate: new Date().toISOString()
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `saafy-backup-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)

            setSavedMessage('Data exported successfully!')
            setTimeout(() => setSavedMessage(''), 3000)
        } catch (error) {
            console.error('Export failed:', error)
            setSavedMessage('Export failed')
        }
    }

    /* ── Shared style helpers ───────────────────────────────────────────── */
    const cardStyle = {
        background: colors.paperDark,
        backgroundImage: 'var(--background-image-ske-surface)',
        padding: '20px',
        borderRadius: '16px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)'}`,
        boxShadow: `2px 3px 8px var(--ske-shadow), -2px -2px 6px var(--ske-highlight), inset 0 1px 1px var(--ske-inner-highlight), inset 0 -1px 1px var(--ske-inner-shadow)`,
    }

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        backgroundColor: colors.paperDarker,
        backgroundImage: 'var(--background-image-ske-recessed)',
        color: colors.ink,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)'}`,
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: fonts.primary,
        boxShadow: `inset 1px 2px 5px var(--ske-inner-shadow), inset -1px -1px 3px var(--ske-inner-highlight)`,
        cursor: 'pointer',
        outline: 'none',
        boxSizing: 'border-box',
    }

    const btnRaisedStyle = {
        padding: '10px 24px',
        background: `linear-gradient(145deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
        backgroundImage: 'var(--background-image-ske-button)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: fonts.primary,
        boxShadow: `3px 4px 8px var(--ske-shadow), -2px -2px 6px var(--ske-highlight), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.18), 0 4px 12px ${colors.accent}40`,
        transition: 'box-shadow 80ms ease-out, transform 80ms ease-out',
        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
    }

    const btnSecondaryStyle = {
        padding: '12px 20px',
        background: colors.paperDarker,
        backgroundImage: 'var(--background-image-ske-button)',
        color: colors.ink,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'}`,
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: fonts.primary,
        textAlign: 'left',
        boxShadow: 'var(--shadow-ske-xs)',
        transition: 'box-shadow 80ms ease-out, transform 80ms ease-out',
    }

    const btnDangerStyle = {
        ...btnSecondaryStyle,
        color: '#FF6B6B',
        border: '1px solid rgba(255,75,75,0.28)',
        boxShadow: `var(--shadow-ske-xs), inset 0 0 0 0 transparent`,
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: colors.paper,
            color: colors.ink,
            padding: '40px 20px',
            fontFamily: fonts.primary
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        fontFamily: fonts.display,
                        marginBottom: '12px',
                        textShadow: `0 2px 4px var(--ske-shadow), 0 -1px 0 var(--ske-highlight)`,
                    }}>Settings</h1>
                    <p style={{ color: colors.inkMuted, fontSize: '16px' }}>
                        Customize your Saafy experience
                    </p>
                </div>

                {/* System Info */}
                {systemInfo && (
                    <div style={{
                        ...cardStyle,
                        marginBottom: '30px',
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                            System Information
                        </h3>
                        <div style={{ fontSize: '14px', color: colors.inkMuted }}>
                            <p>Version: {systemInfo.version}</p>
                            <p>Platform: {systemInfo.platform}</p>
                            <p>Mode: {systemInfo.isElectron ? 'Desktop App' : 'Web App'}</p>
                        </div>
                    </div>
                )}

                {/* Appearance */}
                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', fontFamily: fonts.display }}>
                        Appearance
                    </h2>
                    <div style={{ ...cardStyle }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                                    Dark Mode
                                </div>
                                <div style={{ fontSize: '14px', color: colors.inkMuted }}>
                                    Use dark theme for better nighttime viewing
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    toggleTheme()
                                    setSettings(prev => ({
                                        ...prev,
                                        theme: !isDark ? 'dark' : 'light'
                                    }))
                                }}
                                style={{ ...btnRaisedStyle }}
                                onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' }}
                                onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `3px 4px 8px var(--ske-shadow), -2px -2px 6px var(--ske-highlight), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.18), 0 4px 12px ${colors.accent}40` }}
                                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.filter = '' }}
                            >
                                {isDark ? 'Switch to Light' : 'Switch to Dark'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Audio Quality */}
                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', fontFamily: fonts.display }}>
                        Audio
                    </h2>
                    <div style={{ ...cardStyle }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '16px', fontWeight: '500', display: 'block', marginBottom: '10px' }}>
                                Streaming Quality
                            </label>
                            <select
                                value={settings.audioQuality}
                                onChange={(e) => setSettings(prev => ({ ...prev, audioQuality: e.target.value }))}
                                style={{ ...inputStyle }}
                            >
                                <option value="low">Low (96 kbps) - Save bandwidth</option>
                                <option value="medium">Medium (128 kbps) - Balanced</option>
                                <option value="high">High (320 kbps) - Best quality</option>
                            </select>
                        </div>

                        {isElectron() && (
                            <div>
                                <label style={{ fontSize: '16px', fontWeight: '500', display: 'block', marginBottom: '10px' }}>
                                    Download Location
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={settings.downloadLocation}
                                        readOnly
                                        placeholder="Select a folder..."
                                        style={{
                                            ...inputStyle,
                                            flex: 1,
                                            cursor: 'default',
                                        }}
                                    />
                                    <button
                                        onClick={handleSelectDownloadLocation}
                                        style={{ ...btnRaisedStyle, whiteSpace: 'nowrap' }}
                                        onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' }}
                                        onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `3px 4px 8px var(--ske-shadow), -2px -2px 6px var(--ske-highlight), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.18), 0 4px 12px ${colors.accent}40` }}
                                    >
                                        Browse
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Desktop Settings (Electron only) */}
                {isElectron() && (
                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', fontFamily: fonts.display }}>
                            Desktop App
                        </h2>
                        <div style={{
                            ...cardStyle,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            {[
                                { key: 'startMinimized', label: 'Start app minimized' },
                                { key: 'minimizeToTray', label: 'Minimize to system tray' },
                                { key: 'showNotifications', label: 'Show now playing notifications' },
                                { key: 'autoUpdate', label: 'Automatically check for updates' },
                            ].map(({ key, label }) => (
                                <label key={key} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    background: settings[key]
                                        ? (isDark ? 'rgba(196,92,62,0.08)' : 'rgba(196,92,62,0.05)')
                                        : 'transparent',
                                    boxShadow: settings[key]
                                        ? `inset 1px 2px 4px var(--ske-inner-shadow), inset -1px -1px 2px var(--ske-inner-highlight)`
                                        : 'none',
                                    border: `1px solid ${settings[key] ? colors.accent + '44' : 'transparent'}`,
                                    transition: 'all 0.15s ease',
                                }}>
                                    <div
                                        onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                                        style={{
                                            width: '44px',
                                            height: '24px',
                                            borderRadius: '12px',
                                            background: settings[key]
                                                ? `linear-gradient(145deg, ${colors.accent}, ${isDark ? '#F0956C' : '#A84030'})`
                                                : colors.paperDarker,
                                            backgroundImage: 'var(--background-image-ske-button)',
                                            border: `1px solid ${settings[key] ? 'rgba(255,255,255,0.22)' : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.65)')}`,
                                            boxShadow: settings[key]
                                                ? `inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.2), 0 2px 6px ${colors.accent}45`
                                                : `inset 1px 2px 4px var(--ske-inner-shadow), inset -1px -1px 2px var(--ske-inner-highlight)`,
                                            position: 'relative',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            transition: 'background 0.2s ease, box-shadow 0.15s ease',
                                        }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '3px',
                                            left: settings[key] ? '22px' : '3px',
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            background: settings[key] ? '#fff' : colors.paperDark,
                                            backgroundImage: 'var(--background-image-ske-button)',
                                            boxShadow: `1px 1px 3px var(--ske-shadow), -1px -1px 2px var(--ske-highlight)`,
                                            transition: 'left 0.18s cubic-bezier(0.25,0.46,0.45,0.94)',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '15px' }}>{label}</span>
                                </label>
                            ))}
                        </div>
                    </section>
                )}

                {/* Data Management */}
                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', fontFamily: fonts.display }}>
                        Data &amp; Privacy
                    </h2>
                    <div style={{
                        ...cardStyle,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <button
                            onClick={handleExportData}
                            style={{ ...btnSecondaryStyle }}
                            onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' }}
                            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-ske-sm)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-sm)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-xs)' }}
                        >
                            Export My Data
                        </button>

                        <button
                            onClick={handleClearCache}
                            style={{ ...btnDangerStyle }}
                            onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' }}
                            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-ske-xs)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,75,75,0.08)'; e.currentTarget.style.boxShadow = 'var(--shadow-ske-sm)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = colors.paperDarker; e.currentTarget.style.boxShadow = 'var(--shadow-ske-xs)' }}
                        >
                            Clear All Cache
                        </button>
                    </div>
                </section>

                {/* Save Button */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        style={{
                            padding: '14px 36px',
                            background: `linear-gradient(145deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                            backgroundImage: 'var(--background-image-ske-button)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.22)',
                            borderRadius: '12px',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            fontFamily: fonts.primary,
                            opacity: isSaving ? 0.6 : 1,
                            boxShadow: `4px 5px 10px var(--ske-shadow), -2px -2px 6px var(--ske-highlight), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.18), 0 4px 16px ${colors.accent}40`,
                            transition: 'box-shadow 80ms ease-out, transform 80ms ease-out, opacity 0.2s',
                            textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                        }}
                        onMouseDown={(e) => { if (!isSaving) { e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' } }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `4px 5px 10px var(--ske-shadow), -2px -2px 6px var(--ske-highlight), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.18), 0 4px 16px ${colors.accent}40` }}
                        onMouseEnter={(e) => { if (!isSaving) { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = `6px 8px 16px var(--ske-shadow), -3px -3px 8px var(--ske-highlight), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.18), 0 8px 24px ${colors.accent}55` } }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = ''; e.currentTarget.style.boxShadow = `4px 5px 10px var(--ske-shadow), -2px -2px 6px var(--ske-highlight), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.18), 0 4px 16px ${colors.accent}40` }}
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>

                    {savedMessage && (
                        <span style={{
                            color: savedMessage.includes('success') ? '#1DB954' : '#FF4F4F',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            {savedMessage}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
