import { useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'

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
        const percent = (e.clientX - rect.left) / rect.width
        setVolume(Math.max(0, Math.min(1, percent)))
    }

    const progressPercent = duration ? (progress / duration) * 100 : 0
    const imageUrl = currentSong?.image?.[0]?.link || currentSong?.image?.[1]?.link || currentSong?.image?.[2]?.link || ''

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                width: 'min(92vw, 620px)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{
                background: colors.paper,
                borderRadius: '16px',
                boxShadow: isHovered
                    ? isDark
                        ? '0 16px 48px rgba(0,0,0,0.5), 0 6px 20px rgba(0,0,0,0.4)'
                        : '0 16px 48px rgba(26,22,20,0.2), 0 6px 20px rgba(26,22,20,0.12)'
                    : isDark
                        ? '0 8px 32px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)'
                        : '0 8px 32px rgba(26,22,20,0.14), 0 4px 12px rgba(26,22,20,0.08)',
                border: `1px solid ${colors.rule}`,
                overflow: 'hidden',
                transition: 'box-shadow 0.25s ease, background 0.3s ease',
            }}>
                {/* Main Content Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 18px',
                }}>
                    {/* Album Art */}
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: colors.paperDark,
                    }}>
                        {currentSong && imageUrl ? (
                            <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <div style={{ minWidth: '100px', maxWidth: '160px' }}>
                        {currentSong ? (
                            <>
                                <div style={{
                                    fontFamily: fonts.primary,
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
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
                                    fontSize: '0.7rem',
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
                                fontSize: '0.8rem',
                                color: colors.inkLight,
                            }}>
                                No track selected
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* Shuffle */}
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
                            title="Shuffle"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="16 3 21 3 21 8" />
                                <line x1="4" y1="20" x2="21" y2="3" />
                                <polyline points="21 16 21 21 16 21" />
                                <line x1="15" y1="15" x2="21" y2="21" />
                                <line x1="4" y1="4" x2="9" y2="9" />
                            </svg>
                        </button>

                        {/* Previous */}
                        <button
                            onClick={handlePrevious}
                            disabled={!currentSong}
                            style={{
                                width: '32px',
                                height: '32px',
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                            </svg>
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            disabled={!currentSong}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: currentSong ? colors.accent : colors.paperDark,
                                border: 'none',
                                cursor: currentSong ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: currentSong ? '0 2px 8px rgba(196,92,62,0.3)' : 'none',
                            }}
                        >
                            {isPlaying ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={isDark ? colors.paper : '#fff'}>
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={currentSong ? (isDark ? colors.paper : '#fff') : colors.inkLight} style={{ marginLeft: '2px' }}>
                                    <path d="M8 5v14l11-7L8 5z" />
                                </svg>
                            )}
                        </button>

                        {/* Next */}
                        <button
                            onClick={handleNext}
                            disabled={!currentSong}
                            style={{
                                width: '32px',
                                height: '32px',
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
                            </svg>
                        </button>

                        {/* Repeat */}
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
                    </div>

                    <div style={{ width: '1px', height: '28px', background: colors.rule }} />

                    {/* Volume */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={() => setVolume(volume > 0 ? 0 : 1)}
                            style={{
                                padding: '4px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: colors.inkMuted,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {volume === 0 ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            )}
                        </button>

                        <div
                            onClick={handleVolumeClick}
                            style={{
                                position: 'relative',
                                width: '70px',
                                height: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: colors.inkLight,
                                borderRadius: '2px',
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${volume * 100}%`,
                                height: '4px',
                                background: colors.accent,
                                borderRadius: '2px',
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: `${volume * 100}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: colors.accent,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }} />
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {currentSong && (
                    <div style={{ padding: '0 18px 10px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                color: colors.inkMuted,
                                width: '32px',
                                textAlign: 'right',
                            }}>
                                {formatTime(progress)}
                            </span>
                            <div
                                onClick={handleProgressClick}
                                style={{
                                    flex: 1,
                                    height: '4px',
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
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: colors.paper,
                                    border: `2px solid ${colors.accent}`,
                                    boxShadow: '0 1px 3px rgba(196,92,62,0.3)',
                                }} />
                            </div>
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.65rem',
                                color: colors.inkLight,
                                width: '32px',
                            }}>
                                {formatTime(duration)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
