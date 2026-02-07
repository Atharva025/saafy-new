import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { usePlayer } from '@/context/PlayerContext'

export default function KeyboardShortcuts() {
    const { colors, fonts, isDark } = useTheme()
    const { togglePlay, handleNext, handlePrevious, currentSong } = usePlayer()
    const [isVisible, setIsVisible] = useState(false)
    const [lastKey, setLastKey] = useState(null)

    useEffect(() => {
        // Show hints on first load
        const hasSeenHints = localStorage.getItem('saafy_keyboard_hints_seen')
        if (!hasSeenHints && currentSong) {
            setTimeout(() => setIsVisible(true), 2000)
            setTimeout(() => {
                setIsVisible(false)
                localStorage.setItem('saafy_keyboard_hints_seen', 'true')
            }, 8000)
        }

        const handleKeyDown = (e) => {
            // Ignore if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault()
                    togglePlay()
                    setLastKey('space')
                    break
                case 'arrowright':
                    e.preventDefault()
                    handleNext()
                    setLastKey('next')
                    break
                case 'arrowleft':
                    e.preventDefault()
                    handlePrevious()
                    setLastKey('prev')
                    break
                case 'k':
                    e.preventDefault()
                    togglePlay()
                    setLastKey('k')
                    break
                case '?':
                    e.preventDefault()
                    setIsVisible(prev => !prev)
                    break
            }

            // Flash the indicator briefly
            if (['space', 'arrowright', 'arrowleft', 'k'].includes(e.key.toLowerCase())) {
                setIsVisible(true)
                setTimeout(() => setIsVisible(false), 1500)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [togglePlay, handleNext, handlePrevious, currentSong])

    if (!currentSong) return null

    return (
        <>
            {/* Floating hint indicator */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '120px',
                    right: '20px',
                    zIndex: 90,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: isVisible ? 'auto' : 'none',
                }}
            >
                <div
                    style={{
                        background: isDark ? 'rgba(26, 22, 20, 0.95)' : 'rgba(250, 247, 242, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: `1px solid ${colors.rule}`,
                        borderRadius: '14px',
                        padding: '16px 20px',
                        boxShadow: isDark
                            ? '0 12px 32px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)'
                            : '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                        minWidth: '240px',
                    }}
                >
                    <div
                        style={{
                            fontFamily: fonts.primary,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: colors.accent,
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        Keyboard Shortcuts
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <ShortcutRow
                            keys={['Space']}
                            label="Play / Pause"
                            colors={colors}
                            fonts={fonts}
                            isActive={lastKey === 'space'}
                        />
                        <ShortcutRow
                            keys={['K']}
                            label="Play / Pause"
                            colors={colors}
                            fonts={fonts}
                            isActive={lastKey === 'k'}
                        />
                        <ShortcutRow
                            keys={['→']}
                            label="Next Track"
                            colors={colors}
                            fonts={fonts}
                            isActive={lastKey === 'next'}
                        />
                        <ShortcutRow
                            keys={['←']}
                            label="Previous Track"
                            colors={colors}
                            fonts={fonts}
                            isActive={lastKey === 'prev'}
                        />
                        <ShortcutRow
                            keys={['?']}
                            label="Toggle Hints"
                            colors={colors}
                            fonts={fonts}
                        />
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        style={{
                            marginTop: '12px',
                            width: '100%',
                            padding: '8px',
                            background: 'transparent',
                            border: `1px solid ${colors.rule}`,
                            borderRadius: '8px',
                            color: colors.inkMuted,
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.paperDark
                            e.currentTarget.style.color = colors.ink
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = colors.inkMuted
                        }}
                    >
                        Got it
                    </button>
                </div>
            </div>

            {/* Small persistent indicator */}
            {!isVisible && (
                <button
                    onClick={() => setIsVisible(true)}
                    style={{
                        position: 'fixed',
                        bottom: '120px',
                        right: '20px',
                        zIndex: 90,
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: isDark ? 'rgba(26, 22, 20, 0.8)' : 'rgba(250, 247, 242, 0.8)',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${colors.rule}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: colors.inkMuted,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.paperDark
                        e.currentTarget.style.color = colors.accent
                        e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDark ? 'rgba(26, 22, 20, 0.8)' : 'rgba(250, 247, 242, 0.8)'
                        e.currentTarget.style.color = colors.inkMuted
                        e.currentTarget.style.transform = 'scale(1)'
                    }}
                    title="Keyboard shortcuts"
                >
                    <span style={{ fontFamily: fonts.mono, fontSize: '1.2rem', fontWeight: 600 }}>?</span>
                </button>
            )}
        </>
    )
}

function ShortcutRow({ keys, label, colors, fonts, isActive }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                opacity: isActive ? 1 : 0.8,
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s',
            }}
        >
            <div style={{ display: 'flex', gap: '4px' }}>
                {keys.map((key, i) => (
                    <kbd
                        key={i}
                        style={{
                            padding: '4px 8px',
                            background: isActive ? `${colors.accent}20` : colors.paperDark,
                            border: `1px solid ${isActive ? colors.accent : colors.rule}`,
                            borderRadius: '6px',
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: isActive ? colors.accent : colors.ink,
                            minWidth: '28px',
                            textAlign: 'center',
                            boxShadow: isActive ? `0 0 12px ${colors.accent}30` : 'none',
                            transition: 'all 0.2s',
                        }}
                    >
                        {key}
                    </kbd>
                ))}
            </div>
            <span
                style={{
                    fontFamily: fonts.primary,
                    fontSize: '0.75rem',
                    color: isActive ? colors.ink : colors.inkLight,
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.2s',
                }}
            >
                {label}
            </span>
        </div>
    )
}
