import { useState, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { extractDominantColor, generateGradient } from '@/utils/colorExtractor'
import { adjustColorForTheme } from '@/lib/utils'

export default function BasicPlayer() {
    const { colors, fonts, isDark } = useTheme()
    const {
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        togglePlay,
        handleNext,
        handlePrevious,
        seekTo,
        setVolume,
    } = usePlayer()

    const [isHovered, setIsHovered] = useState(false)
    const [volumeHovered, setVolumeHovered] = useState(false)
    const [volumeExpanded, setVolumeExpanded] = useState(false)
    const [dominantColor, setDominantColor] = useState(null)
    const [gradientBg, setGradientBg] = useState(null)

    // Extract color from album art
    useEffect(() => {
        // Use highest quality image for color extraction
        const imageUrl = currentSong?.image?.[0]?.link || currentSong?.image?.[0]?.url ||
            currentSong?.image?.[1]?.link || currentSong?.image?.[1]?.url
        if (!imageUrl) {
            setDominantColor(null)
            setGradientBg(null)
            return
        }

        extractDominantColor(imageUrl).then(color => {
            if (color) {
                setDominantColor(color)
                const gradient = generateGradient(color, isDark)
                setGradientBg(gradient)
            }
        })
    }, [currentSong, isDark])

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleProgressClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        seekTo(percent * duration)
    }

    const handleVolumeClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        if (isMobile) {
            // Vertical slider for mobile - calculate from bottom
            const percent = 1 - ((e.clientY - rect.top) / rect.height)
            setVolume(Math.max(0, Math.min(1, percent)))
        } else {
            // Horizontal slider for desktop
            const percent = (e.clientX - rect.left) / rect.width
            setVolume(Math.max(0, Math.min(1, percent)))
        }
    }

    const progressPercent = duration ? (progress / duration) * 100 : 0
    // Use highest quality image available - check both .link and .url
    const imageUrl = currentSong?.image?.[0]?.link || currentSong?.image?.[0]?.url ||
        currentSong?.image?.[1]?.link || currentSong?.image?.[1]?.url ||
        currentSong?.image?.[2]?.link || currentSong?.image?.[2]?.url ||
        currentSong?.imageUrl || ''
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const isTinyScreen = typeof window !== 'undefined' && window.innerWidth < 380

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 'clamp(12px, 3vw, 20px)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                width: 'min(96vw, 620px)',
                maxWidth: '620px',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Dynamic gradient background */}
            {gradientBg && (
                <div style={{
                    position: 'absolute',
                    inset: '-40px',
                    background: gradientBg.mesh,
                    opacity: isPlaying ? 0.8 : 0.5,
                    filter: 'blur(60px)',
                    transition: 'opacity 0.5s ease',
                    pointerEvents: 'none',
                    zIndex: -1,
                }} />
            )}

            <div style={{
                background: isDark
                    ? 'rgba(13, 13, 13, 0.85)'
                    : 'rgba(250, 250, 250, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: 'clamp(12px, 3vw, 16px)',
                boxShadow: isHovered
                    ? isDark
                        ? '0 16px 48px rgba(0,0,0,0.5), 0 6px 20px rgba(0,0,0,0.4)'
                        : '0 16px 48px rgba(26,22,20,0.2), 0 6px 20px rgba(26,22,20,0.12)'
                    : isDark
                        ? '0 8px 32px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)'
                        : '0 8px 32px rgba(26,22,20,0.14), 0 4px 12px rgba(26,22,20,0.08)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                overflow: 'hidden',
                transition: 'box-shadow 0.25s ease, background 0.3s ease',
                position: 'relative',
            }}>
                {/* Main Content Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isTinyScreen ? '6px' : 'clamp(8px, 2vw, 14px)',
                    padding: isTinyScreen ? '8px 10px' : 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 18px)',
                    flexWrap: 'nowrap',
                }}>
                    {/* Album Art */}
                    <div style={{
                        width: isTinyScreen ? '36px' : 'clamp(40px, 9vw, 48px)',
                        height: isTinyScreen ? '36px' : 'clamp(40px, 9vw, 48px)',
                        borderRadius: 'clamp(6px, 2vw, 8px)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: colors.paperDark,
                        position: 'relative',
                    }}>
                        {currentSong && imageUrl ? (
                            <>
                                <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </>
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={colors.inkLight}>
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Song Info */}
                    <div style={{
                        minWidth: isTinyScreen ? '60px' : isMobile ? '70px' : '100px',
                        maxWidth: isTinyScreen ? '100px' : isMobile ? '110px' : '160px',
                        flex: 1,
                        overflow: 'hidden',
                    }}>
                        {currentSong ? (
                            <>
                                <div style={{
                                    fontFamily: fonts.primary,
                                    fontWeight: 600,
                                    fontSize: isTinyScreen ? '0.7rem' : 'clamp(0.72rem, 2vw, 0.85rem)',
                                    color: colors.ink,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.3,
                                }}>
                                    {currentSong.name}
                                </div>
                                <div style={{
                                    fontFamily: fonts.mono,
                                    fontSize: isTinyScreen ? '0.6rem' : 'clamp(0.62rem, 1.8vw, 0.7rem)',
                                    color: colors.inkMuted,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginTop: '2px',
                                }}>
                                    {currentSong.primaryArtists}
                                </div>
                            </>
                        ) : (
                            <div style={{
                                fontFamily: fonts.primary,
                                fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                                color: colors.inkLight,
                            }}>
                                No track selected
                            </div>
                        )}
                    </div>

                    <div style={{ flex: isMobile ? 0 : 1 }} />

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isTinyScreen ? '2px' : 'clamp(2px, 1vw, 4px)' }}>
                        {/* Shuffle - Hidden on very small screens */}
                        {!isMobile && (
                            <button
                                style={{
                                    width: 'clamp(28px, 7vw, 30px)',
                                    height: 'clamp(28px, 7vw, 30px)',
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: colors.inkLight,
                                }}
                                title="Shuffle"
                            >
                                <svg width="clamp(12px, 3vw, 14px)" height="clamp(12px, 3vw, 14px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="16 3 21 3 21 8" />
                                    <line x1="4" y1="20" x2="21" y2="3" />
                                    <polyline points="21 16 21 21 16 21" />
                                    <line x1="15" y1="15" x2="21" y2="21" />
                                    <line x1="4" y1="4" x2="9" y2="9" />
                                </svg>
                            </button>
                        )}

                        {/* Previous */}
                        <button
                            onClick={handlePrevious}
                            disabled={!currentSong}
                            style={{
                                width: isTinyScreen ? '28px' : 'clamp(30px, 7vw, 32px)',
                                height: isTinyScreen ? '28px' : 'clamp(30px, 7vw, 32px)',
                                borderRadius: '50%',
                                background: colors.paperDark,
                                border: 'none',
                                cursor: currentSong ? 'pointer' : 'default',
                                opacity: currentSong ? 1 : 0.4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.ink,
                            }}
                        >
                            <svg width={isTinyScreen ? '11px' : 'clamp(12px, 3vw, 14px)'} height={isTinyScreen ? '11px' : 'clamp(12px, 3vw, 14px)'} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                            </svg>
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            disabled={!currentSong}
                            style={{
                                width: isTinyScreen ? '36px' : 'clamp(40px, 10vw, 44px)',
                                height: isTinyScreen ? '36px' : 'clamp(40px, 10vw, 44px)',
                                borderRadius: '50%',
                                background: currentSong
                                    ? (dominantColor
                                        ? adjustColorForTheme(dominantColor, isDark)?.rgb || colors.accent
                                        : colors.accent)
                                    : colors.paperDark,
                                border: 'none',
                                cursor: currentSong ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: currentSong
                                    ? (dominantColor
                                        ? `0 2px 12px ${adjustColorForTheme(dominantColor, isDark)?.rgba(0.4) || dominantColor.rgba(0.4)}, inset 0 0 0 1px ${adjustColorForTheme(dominantColor, isDark)?.rgba(0.2) || dominantColor.rgba(0.2)}`
                                        : '0 2px 8px rgba(196,92,62,0.3)')
                                    : 'none',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {isPlaying && (
                                <div style={{
                                    position: 'absolute',
                                    inset: '-4px',
                                    borderRadius: '50%',
                                    border: `2px solid ${dominantColor ? (adjustColorForTheme(dominantColor, isDark)?.rgba(0.5) || dominantColor.rgba(0.5)) : colors.accent}`,
                                    animation: 'progressRing 2s ease-in-out infinite',
                                }} />
                            )}
                            {isPlaying ? (
                                <svg width={isTinyScreen ? '13px' : '16px'} height={isTinyScreen ? '13px' : '16px'} viewBox="0 0 24 24" fill={isDark ? colors.paper : '#fff'}>
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg width={isTinyScreen ? '13px' : '16px'} height={isTinyScreen ? '13px' : '16px'} viewBox="0 0 24 24" fill={currentSong ? (isDark ? colors.paper : '#fff') : colors.inkLight} style={{ marginLeft: '2px' }}>
                                    <path d="M8 5v14l11-7L8 5z" />
                                </svg>
                            )}
                        </button>

                        {/* Next */}
                        <button
                            onClick={handleNext}
                            disabled={!currentSong}
                            style={{
                                width: isTinyScreen ? '28px' : '32px',
                                height: isTinyScreen ? '28px' : '32px',
                                borderRadius: '50%',
                                background: colors.paperDark,
                                border: 'none',
                                cursor: currentSong ? 'pointer' : 'default',
                                opacity: currentSong ? 1 : 0.4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.ink,
                            }}
                        >
                            <svg width={isTinyScreen ? '11px' : '14px'} height={isTinyScreen ? '11px' : '14px'} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
                            </svg>
                        </button>

                        {/* Repeat - Hide on tiny screens */}
                        {!isTinyScreen && (
                            <button
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: colors.inkLight,
                                }}
                                title="Repeat"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="17 1 21 5 17 9" />
                                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                    <polyline points="7 23 3 19 7 15" />
                                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Divider - Hide on mobile */}
                    {!isMobile && (
                        <div style={{ width: '1px', height: '28px', background: colors.rule }} />
                    )}

                    {/* Volume - slider expands left on desktop, upward on mobile */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0',
                            position: 'relative',
                        }}
                        onMouseEnter={() => !isMobile && setVolumeHovered(true)}
                        onMouseLeave={() => !isMobile && setVolumeHovered(false)}
                    >
                        {/* Vertical slider for mobile - appears upward */}
                        {isMobile && volumeExpanded && (
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '8px',
                                    padding: '12px',
                                    background: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(250,250,250,0.95)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '12px',
                                    boxShadow: isDark
                                        ? '0 4px 16px rgba(0,0,0,0.4)'
                                        : '0 4px 16px rgba(0,0,0,0.15)',
                                    zIndex: 1000,
                                }}
                            >
                                <div
                                    onClick={handleVolumeClick}
                                    style={{
                                        position: 'relative',
                                        width: '32px',
                                        height: '100px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Track background */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '4px',
                                        height: '100%',
                                        background: colors.paperDarker,
                                        borderRadius: '2px',
                                    }} />
                                    {/* Track fill */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        bottom: 0,
                                        transform: 'translateX(-50%)',
                                        width: '4px',
                                        height: `${volume * 100}%`,
                                        background: colors.accent,
                                        borderRadius: '2px',
                                    }} />
                                    {/* Thumb */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        bottom: `${volume * 100}%`,
                                        transform: 'translate(-50%, 50%)',
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: colors.accent,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* Horizontal slider for desktop - expands left */}
                        {!isMobile && (
                            <div
                                onClick={handleVolumeClick}
                                style={{
                                    width: volumeHovered ? '80px' : '0px',
                                    height: '24px',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    transition: 'width 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: volumeHovered ? '8px' : '0',
                                }}
                            >
                                <div style={{
                                    position: 'relative',
                                    width: '70px',
                                    height: '4px',
                                }}>
                                    {/* Track background */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: colors.paperDarker,
                                        borderRadius: '2px',
                                    }} />
                                    {/* Track fill */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: `${volume * 100}%`,
                                        height: '100%',
                                        background: colors.accent,
                                        borderRadius: '2px',
                                    }} />
                                    {/* Thumb */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: `${volume * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: colors.accent,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* Volume icon button */}
                        <button
                            onClick={() => {
                                if (isMobile) {
                                    setVolumeExpanded(!volumeExpanded)
                                } else {
                                    setVolume(volume > 0 ? 0 : 1)
                                }
                            }}
                            style={{
                                padding: '6px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: isMobile && volumeExpanded ? colors.accent : colors.inkMuted,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.2s ease',
                            }}
                        >
                            {volume === 0 ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                {currentSong && (
                    <div style={{ padding: isTinyScreen ? '0 10px 8px 10px' : '0 18px 10px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: isTinyScreen ? '6px' : '10px' }}>
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: isTinyScreen ? '0.55rem' : '0.65rem',
                                color: colors.inkMuted,
                                width: isTinyScreen ? '28px' : '32px',
                                textAlign: 'right',
                            }}>
                                {formatTime(progress)}
                            </span>
                            <div
                                onClick={handleProgressClick}
                                style={{
                                    flex: 1,
                                    height: isTinyScreen ? '3px' : '4px',
                                    background: colors.paperDarker,
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                            >
                                <div style={{
                                    height: '100%',
                                    width: `${progressPercent}%`,
                                    background: colors.accent,
                                    borderRadius: '2px',
                                    transition: 'width 0.1s linear',
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: `${progressPercent}%`,
                                    transform: 'translate(-50%, -50%)',
                                    width: '10px',
                                    height: isTinyScreen ? '8px' : '10px',
                                    borderRadius: '50%',
                                    background: colors.paper,
                                    border: `2px solid ${colors.accent}`,
                                    boxShadow: '0 1px 3px rgba(196,92,62,0.3)',
                                }} />
                            </div>
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: isTinyScreen ? '0.55rem' : '0.65rem',
                                color: colors.inkLight,
                                width: isTinyScreen ? '28px' : '32px',
                            }}>
                                {formatTime(duration)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes breathe {
                    0%, 100% {
                        opacity: 0.6;
                    }
                    50% {
                        opacity: 0.9;
                    }
                }
                @keyframes progressRing {
                    0% {
                        transform: rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: rotate(360deg) scale(1.2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}
