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
                        marginBottom: '12px'
                    }}>Settings</h1>
                    <p style={{ color: colors.inkMuted, fontSize: '16px' }}>
                        Customize your Saafy experience
                    </p>
                </div>

                {/* System Info */}
                {systemInfo && (
                    <div style={{
                        backgroundColor: colors.paperDark,
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '30px',
                        border: `1px solid ${colors.rule}`
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
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
                        Appearance
                    </h2>
                    <div style={{
                        backgroundColor: colors.paperDark,
                        padding: '20px',
                        borderRadius: '12px',
                        border: `1px solid ${colors.rule}`
                    }}>
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
                                style={{
                                    padding: '10px 24px',
                                    backgroundColor: colors.accent,
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isDark ? 'Switch to Light' : 'Switch to Dark'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Audio Quality */}
                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
                        Audio
                    </h2>
                    <div style={{
                        backgroundColor: colors.paperDark,
                        padding: '20px',
                        borderRadius: '12px',
                        border: `1px solid ${colors.rule}`
                    }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '16px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                                Streaming Quality
                            </label>
                            <select
                                value={settings.audioQuality}
                                onChange={(e) => setSettings(prev => ({ ...prev, audioQuality: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: colors.paperDarker,
                                    color: colors.ink,
                                    border: `1px solid ${colors.rule}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="low">Low (96 kbps) - Save bandwidth</option>
                                <option value="medium">Medium (128 kbps) - Balanced</option>
                                <option value="high">High (320 kbps) - Best quality</option>
                            </select>
                        </div>

                        {isElectron() && (
                            <div>
                                <label style={{ fontSize: '16px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                                    Download Location
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={settings.downloadLocation}
                                        readOnly
                                        placeholder="Select a folder..."
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            backgroundColor: colors.paperDarker,
                                            color: colors.ink,
                                            border: `1px solid ${colors.rule}`,
                                            borderRadius: '8px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <button
                                        onClick={handleSelectDownloadLocation}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: colors.accent,
                                            color: '#FFFFFF',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
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
                        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
                            Desktop App
                        </h2>
                        <div style={{
                            backgroundColor: colors.paperDark,
                            padding: '20px',
                            borderRadius: '12px',
                            border: `1px solid ${colors.rule}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.startMinimized}
                                    onChange={(e) => setSettings(prev => ({ ...prev, startMinimized: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '15px' }}>Start app minimized</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.minimizeToTray}
                                    onChange={(e) => setSettings(prev => ({ ...prev, minimizeToTray: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '15px' }}>Minimize to system tray</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.showNotifications}
                                    onChange={(e) => setSettings(prev => ({ ...prev, showNotifications: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '15px' }}>Show now playing notifications</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.autoUpdate}
                                    onChange={(e) => setSettings(prev => ({ ...prev, autoUpdate: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '15px' }}>Automatically check for updates</span>
                            </label>
                        </div>
                    </section>
                )}

                {/* Data Management */}
                <section style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
                        Data & Privacy
                    </h2>
                    <div style={{
                        backgroundColor: colors.paperDark,
                        padding: '20px',
                        borderRadius: '12px',
                        border: `1px solid ${colors.rule}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <button
                            onClick={handleExportData}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: colors.paperDarker,
                                color: colors.ink,
                                border: `1px solid ${colors.rule}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            Export My Data
                        </button>

                        <button
                            onClick={handleClearCache}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: colors.paperDarker,
                                color: '#FF4F4F',
                                border: '1px solid #FF4F4F',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
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
                            padding: '14px 32px',
                            backgroundColor: colors.accent,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: '600',
                            opacity: isSaving ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}
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
