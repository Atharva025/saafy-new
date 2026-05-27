import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { usePlayer } from '@/context/PlayerContext'
import { safeGetStorage, safeSetStorage } from '@/lib/security'

export default function KeyboardShortcuts() {
    const { colors, fonts, isDark } = useTheme()
    const { togglePlay, handleNext, handlePrevious, currentSong } = usePlayer()
    const [isVisible, setIsVisible] = useState(false)
    const [lastKey, setLastKey] = useState(null)

    useEffect(() => {
        // Show hints on first load
        const hasSeenHints = safeGetStorage('keyboard_hints_seen', false)
        if (!hasSeenHints && currentSong) {
            setTimeout(() => setIsVisible(true), 2000)
            setTimeout(() => {
                setIsVisible(false)
                safeSetStorage('keyboard_hints_seen', true)
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
                    className="ske-float ske-textured"
                    style={{
                        background: isDark ? 'rgba(26, 22, 20, 0.94)' : 'rgba(250, 247, 242, 0.94)',
                        backdropFilter: 'blur(16px)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)'}`,
                        borderRadius: '14px',
                        padding: '16px 20px',
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
                            isDark={isDark}
                            isActive={lastKey === 'space'}
                        />
                        <ShortcutRow
                            keys={['K']}
                            label="Play / Pause"
                            colors={colors}
                            fonts={fonts}
                            isDark={isDark}
                            isActive={lastKey === 'k'}
                        />
                        <ShortcutRow
                            keys={['→']}
                            label="Next Track"
                            colors={colors}
                            fonts={fonts}
                            isDark={isDark}
                            isActive={lastKey === 'next'}
                        />
                        <ShortcutRow
                            keys={['←']}
                            label="Previous Track"
                            colors={colors}
                            fonts={fonts}
                            isDark={isDark}
                            isActive={lastKey === 'prev'}
                        />
                        <ShortcutRow
                            keys={['?']}
                            label="Toggle Hints"
                            colors={colors}
                            fonts={fonts}
                            isDark={isDark}
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
                    className="ske-raised-xs"
                    style={{
                        position: 'fixed',
                        bottom: '120px',
                        right: '20px',
                        zIndex: 90,
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: colors.paperDark,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.70)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: colors.inkMuted,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.accent
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.inkMuted
                    }}
                    title="Keyboard shortcuts"
                >
                    <span style={{ fontFamily: fonts.mono, fontSize: '1.2rem', fontWeight: 600 }}>?</span>
                </button>
            )}
        </>
    )
}

function ShortcutRow({ keys, label, colors, fonts, isActive, isDark }) {
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
                        className="ske-text-raised"
                        style={{
                            padding: '4px 8px',
                            background: isActive ? `${colors.accent}22` : colors.paperDark,
                            border: `1px solid ${isActive ? colors.accent : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)')}`,
                            borderBottom: isActive ? `3px solid ${colors.accent}` : `3px solid ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'}`,
                            borderRadius: '6px',
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: isActive ? colors.accent : colors.ink,
                            minWidth: '28px',
                            textAlign: 'center',
                            boxShadow: isActive 
                                ? `0 2px 8px ${colors.accent}32` 
                                : `0 2px 4px var(--ske-shadow), inset 0 1px 0 var(--ske-inner-highlight)`,
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
