import { useState, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { adjustColorForTheme } from '@/lib/utils'
import { 
    Shuffle, 
    Repeat, 
    Repeat1, 
    SkipBack, 
    SkipForward, 
    Play, 
    Pause, 
    Volume2, 
    Volume1, 
    VolumeX, 
    Music,
    ListMusic,
    Maximize2
} from 'lucide-react'

export default function BasicPlayer({ showQueue, setShowQueue }) {
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
        shuffleMode,
        repeatMode,
        toggleShuffle,
        toggleRepeat,
        dominantColor,
        setIsImmersiveOpen
    } = usePlayer()

    const [isHovered, setIsHovered] = useState(false)
    const [volumeHovered, setVolumeHovered] = useState(false)
    const [volumeExpanded, setVolumeExpanded] = useState(false)
    const [progressHovered, setProgressHovered] = useState(false)
    const [hoverTime, setHoverTime] = useState(0)
    const [hoverXPercent, setHoverXPercent] = useState(0)
    const [artHovered, setArtHovered] = useState(false)

    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false)
    const [isTinyScreen, setIsTinyScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 380 : false)

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth
            setIsMobile(width < 640)
            setIsTinyScreen(width < 380)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])


    const accentColor = dominantColor
        ? (adjustColorForTheme(dominantColor, isDark)?.rgb || colors.accent)
        : colors.accent;

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

    const handleProgressMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        setHoverXPercent(percent * 100)
        setHoverTime(percent * duration)
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
    const imageUrl = currentSong?.image?.[2]?.link || currentSong?.image?.[2]?.url ||
        currentSong?.image?.[1]?.link || currentSong?.image?.[1]?.url ||
        currentSong?.image?.[0]?.link || currentSong?.image?.[0]?.url ||
        currentSong?.imageUrl || ''

    return (
        <div
            className="player-bar-wrapper"
            style={{
                position: 'fixed',
                bottom: 'clamp(10px, 2.5vw, 20px)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                width: 'min(96vw, 620px)',
                maxWidth: '620px',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                className="ske-textured ske-float"
                style={{
                    background: isDark
                        ? 'var(--color-overlay-deep)'
                        : 'var(--color-overlay-deep)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    borderRadius: 'clamp(14px, 3vw, 18px)',
                    border: dominantColor
                        ? `1px solid ${adjustColorForTheme(dominantColor, isDark)?.rgba(isDark ? 0.22 : 0.16) || 'var(--color-border)'}`
                        : `1px solid var(--color-border)`,
                    boxShadow: dominantColor
                        ? `${isHovered ? '0 16px 44px' : '0 10px 32px'} ${adjustColorForTheme(dominantColor, isDark)?.rgba(isDark ? 0.35 : 0.16) || 'rgba(0,0,0,0.15)'}`
                        : (isHovered ? 'var(--shadow-ske-lg)' : 'var(--shadow-ske-md)'),
                    overflow: 'hidden',
                    transition: 'box-shadow 350ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease, transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    transform: isHovered ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
                }}
            >
                {/* Glass gloss shine reflection at the top */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
                    pointerEvents: 'none',
                    zIndex: 1,
                }} />

                {isMobile ? (
                    /* MOBILE LAYOUT */
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '12px 14px',
                        gap: '12px',
                    }}>
                        {/* Row 1: Track Info + Volume */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            gap: '10px',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                minWidth: 0,
                                flex: 1,
                            }}>
                                {/* Album Art */}
                                <div 
                                    onClick={() => setIsImmersiveOpen(true)}
                                    onMouseEnter={() => setArtHovered(true)}
                                    onMouseLeave={() => setArtHovered(false)}
                                    className="ske-art"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        background: colors.paperDark,
                                        position: 'relative',
                                        transition: 'transform 0.4s ease',
                                        transform: artHovered ? 'scale(1.05)' : 'scale(1)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {currentSong && imageUrl ? (
                                        <>
                                            <img 
                                                src={imageUrl} 
                                                alt="" 
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'cover',
                                                    transform: artHovered ? 'scale(1.12)' : 'scale(1)',
                                                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                                }} 
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(0,0,0,0.35)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: artHovered ? 1 : 0,
                                                transition: 'opacity 0.2s ease',
                                                color: '#fff',
                                            }}>
                                                <Maximize2 size={12} />
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Music size={18} color={colors.inkLight} />
                                        </div>
                                    )}
                                </div>

                                {/* Song Info */}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    {currentSong ? (
                                        <>
                                            <div 
                                                className="ske-text-raised"
                                                style={{
                                                    fontFamily: fonts.primary,
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    color: colors.ink,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {currentSong.name}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                marginTop: '1px',
                                                minWidth: 0,
                                            }}>
                                                <div style={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.65rem',
                                                    color: colors.inkMuted,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    flex: 1,
                                                }}>
                                                    {currentSong.primaryArtists}
                                                </div>
                                                {isPlaying && (
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: '8px', flexShrink: 0, paddingBottom: '1px' }}>
                                                        {[0.6, 1, 0.4].map((h, i) => (
                                                            <div
                                                                key={i}
                                                                style={{
                                                                    width: '2px',
                                                                    height: `${h * 100}%`,
                                                                    background: accentColor,
                                                                    borderRadius: '1px',
                                                                    animation: `barBounce 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                                                                    transformOrigin: 'bottom',
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{
                                            fontFamily: fonts.primary,
                                            fontSize: '0.75rem',
                                            color: colors.inkLight,
                                        }}>
                                            No track selected
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Queue Button */}
                            {currentSong && setShowQueue && (
                                <button
                                    onClick={() => setShowQueue(!showQueue)}
                                    className={`icon-btn ${showQueue ? 'active' : ''}`}
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '4px',
                                    }}
                                    title="Toggle Queue"
                                >
                                    <ListMusic size={18} />
                                </button>
                            )}

                            {/* Volume Button + Popup */}
                            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                {volumeExpanded && (
                                    <div
                                        className="ske-textured ske-float"
                                        style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            right: 0,
                                            marginBottom: '8px',
                                            padding: '14px 10px',
                                            borderRadius: '14px',
                                            border: `1px solid var(--color-border)`,
                                            background: 'var(--color-overlay-deep)',
                                            backdropFilter: 'blur(20px)',
                                            WebkitBackdropFilter: 'blur(20px)',
                                            zIndex: 1000,
                                        }}
                                    >
                                        <div
                                            onClick={handleVolumeClick}
                                            style={{
                                                position: 'relative',
                                                width: '24px',
                                                height: '90px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {/* Track background */}
                                            <div 
                                                className="ske-recessed"
                                                style={{
                                                    position: 'absolute',
                                                    width: '6px',
                                                    height: '100%',
                                                    borderRadius: '3px',
                                                }} 
                                            />
                                            {/* Track fill */}
                                            <div 
                                                className="ske-progress-fill"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    width: '6px',
                                                    height: `${volume * 100}%`,
                                                    background: accentColor,
                                                    borderRadius: '3px',
                                                }} 
                                            />
                                            {/* Thumb */}
                                            <div 
                                                className="ske-raised-xs"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: `${volume * 100}%`,
                                                    transform: 'translateY(50%)',
                                                    width: '14px',
                                                    height: '14px',
                                                    borderRadius: '50%',
                                                    background: 'var(--color-paper-dark)',
                                                    border: '1px solid var(--color-border)',
                                                }} 
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setVolumeExpanded(!volumeExpanded)}
                                    className={`icon-btn ${volumeExpanded ? 'active' : ''}`}
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {volume === 0 ? (
                                        <VolumeX size={18} />
                                    ) : volume < 0.5 ? (
                                        <Volume1 size={18} />
                                    ) : (
                                        <Volume2 size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Row 2: Progress Bar */}
                        {currentSong && (
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.6rem',
                                        color: colors.inkMuted,
                                        width: '30px',
                                        textAlign: 'right',
                                    }}>
                                        {formatTime(progress)}
                                    </span>
                                    <div
                                        onClick={handleProgressClick}
                                        onMouseEnter={() => setProgressHovered(true)}
                                        onMouseLeave={() => setProgressHovered(false)}
                                        onMouseMove={handleProgressMouseMove}
                                        style={{
                                            flex: 1,
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            position: 'relative',
                                        }}
                                    >
                                        <div
                                            className="ske-recessed"
                                            style={{
                                                width: '100%',
                                                height: progressHovered ? '6px' : '4px',
                                                borderRadius: '3px',
                                                position: 'relative',
                                                transition: 'height 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}
                                        >
                                            {/* Tooltip Time Badge */}
                                            {progressHovered && duration > 0 && (
                                                <div
                                                    className="ske-textured ske-float"
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '100%',
                                                        left: `${hoverXPercent}%`,
                                                        transform: 'translate(-50%, -10px)',
                                                        background: 'var(--color-overlay-deep)',
                                                        border: `1px solid var(--color-accent-border)`,
                                                        backdropFilter: 'blur(10px)',
                                                        WebkitBackdropFilter: 'blur(10px)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: fonts.mono,
                                                        fontSize: '0.6rem',
                                                        fontWeight: 600,
                                                        color: colors.ink,
                                                        whiteSpace: 'nowrap',
                                                        pointerEvents: 'none',
                                                        zIndex: 1000,
                                                    }}
                                                >
                                                    {formatTime(hoverTime)}
                                                </div>
                                            )}

                                            {/* Progress Fill */}
                                            <div 
                                                className="ske-progress-fill"
                                                style={{
                                                    height: '100%',
                                                    width: `${progressPercent}%`,
                                                    background: accentColor,
                                                    borderRadius: '3px',
                                                    transition: 'width 0.1s linear',
                                                }} 
                                            />

                                            {/* Progress Thumb Handle */}
                                            <div 
                                                className="ske-raised-xs"
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: `${progressPercent}%`,
                                                    transform: progressHovered ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%) scale(1)',
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    background: 'var(--color-paper-dark)',
                                                    border: '1px solid var(--color-border)',
                                                    transition: 'transform 200ms var(--ease-spring)',
                                                }} 
                                            />
                                        </div>
                                    </div>
                                    <span style={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.6rem',
                                        color: colors.inkLight,
                                        width: '30px',
                                    }}>
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Row 3: Control Buttons */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px',
                            width: '100%',
                            marginTop: '2px',
                        }}>
                            {/* Shuffle */}
                            <button
                                onClick={toggleShuffle}
                                className={`icon-btn ske-spring-btn ${shuffleMode ? 'active' : ''}`}
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                }}
                                title={shuffleMode ? "Shuffle: On" : "Shuffle: Off"}
                            >
                                <Shuffle size={18} />
                                {shuffleMode && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        background: accentColor,
                                        boxShadow: `0 0 6px 1px ${accentColor}`,
                                        animation: 'pulseGlow 1.5s infinite alternate',
                                    }} />
                                )}
                            </button>

                            {/* Previous */}
                            <button
                                onClick={handlePrevious}
                                disabled={!currentSong}
                                className="icon-btn ske-spring-btn"
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                title="Previous"
                            >
                                <SkipBack size={18} fill="currentColor" />
                            </button>

                            {/* Play/Pause */}
                             <button
                                onClick={togglePlay}
                                disabled={!currentSong}
                                className="ske-raised ske-spring-btn"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: isPlaying ? accentColor : 'var(--color-paper-dark)',
                                    color: isPlaying ? 'var(--color-paper)' : 'var(--color-ink)',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: currentSong ? 'pointer' : 'default',
                                }}
                                title={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? (
                                    <Pause size={22} fill="currentColor" color="currentColor" />
                                ) : (
                                    <Play size={22} fill="currentColor" color="currentColor" style={{ marginLeft: '2px' }} />
                                )}
                            </button>

                            {/* Next */}
                            <button
                                onClick={handleNext}
                                disabled={!currentSong}
                                className="icon-btn ske-spring-btn"
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                title="Next"
                            >
                                <SkipForward size={18} fill="currentColor" />
                            </button>

                            {/* Repeat */}
                            <button
                                onClick={toggleRepeat}
                                className={`icon-btn ske-spring-btn ${repeatMode !== 'none' ? 'active' : ''}`}
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                }}
                                title={`Repeat: ${repeatMode}`}
                            >
                                {repeatMode === 'one' ? (
                                    <Repeat1 size={18} />
                                ) : (
                                    <Repeat size={18} />
                                )}
                                {repeatMode !== 'none' && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        background: accentColor,
                                        boxShadow: `0 0 6px 1px ${accentColor}`,
                                        animation: 'pulseGlow 1.5s infinite alternate',
                                    }} />
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* DESKTOP LAYOUT (original) */
                    <>
                        {/* Main Content Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'clamp(8px, 2vw, 14px)',
                            padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 18px)',
                            flexWrap: 'nowrap',
                        }}>
                             {/* Album Art */}
                            <div 
                                onClick={() => setIsImmersiveOpen(true)}
                                onMouseEnter={() => setArtHovered(true)}
                                onMouseLeave={() => setArtHovered(false)}
                                className="ske-art"
                                style={{
                                    width: 'clamp(40px, 9vw, 48px)',
                                    height: 'clamp(40px, 9vw, 48px)',
                                    borderRadius: 'clamp(6px, 2vw, 8px)',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    background: colors.paperDark,
                                    position: 'relative',
                                    transition: 'box-shadow 0.4s ease, transform 0.4s ease',
                                    transform: artHovered ? 'scale(1.05)' : 'scale(1)',
                                    cursor: 'pointer',
                                }}
                            >
                                {currentSong && imageUrl ? (
                                    <>
                                        <img 
                                            src={imageUrl} 
                                            alt="" 
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                objectFit: 'cover',
                                                transform: artHovered ? 'scale(1.12)' : 'scale(1)',
                                                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }} 
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(0,0,0,0.35)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: artHovered ? 1 : 0,
                                            transition: 'opacity 0.2s ease',
                                            color: '#fff',
                                        }}>
                                            <Maximize2 size={14} />
                                        </div>
                                    </>
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Music size={20} color={colors.inkLight} />
                                    </div>
                                )}
                            </div>

                            {/* Song Info */}
                            <div style={{
                                minWidth: '100px',
                                maxWidth: '160px',
                                flex: 1,
                                overflow: 'hidden',
                            }}>
                                {currentSong ? (
                                    <>
                                        <div 
                                            className="ske-text-raised"
                                            style={{
                                                fontFamily: fonts.primary,
                                                fontWeight: 600,
                                                fontSize: 'clamp(0.72rem, 2vw, 0.85rem)',
                                                color: colors.ink,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {currentSong.name}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginTop: '2px',
                                            minWidth: 0,
                                        }}>
                                            <div style={{
                                                fontFamily: fonts.mono,
                                                fontSize: 'clamp(0.62rem, 1.8vw, 0.7rem)',
                                                color: colors.inkMuted,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                flex: 1,
                                            }}>
                                                {currentSong.primaryArtists}
                                            </div>
                                            {isPlaying && (
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: '8px', flexShrink: 0, paddingBottom: '1px' }}>
                                                    {[0.6, 1, 0.4].map((h, i) => (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                width: '2px',
                                                                height: `${h * 100}%`,
                                                                background: accentColor,
                                                                borderRadius: '1px',
                                                                animation: `barBounce 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                                                                transformOrigin: 'bottom',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
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

                            <div style={{ flex: 1 }} />

                            {/* Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Shuffle */}
                                <button
                                    onClick={toggleShuffle}
                                    className={`icon-btn ske-spring-btn ${shuffleMode ? 'active' : ''}`}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                    }}
                                    title={shuffleMode ? "Shuffle: On" : "Shuffle: Off"}
                                >
                                    <Shuffle size={14} />
                                    {shuffleMode && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: accentColor,
                                            boxShadow: `0 0 6px 1px ${accentColor}`,
                                            animation: 'pulseGlow 1.5s infinite alternate',
                                        }} />
                                    )}
                                </button>

                                {/* Previous */}
                                <button
                                    onClick={handlePrevious}
                                    disabled={!currentSong}
                                    className="icon-btn ske-spring-btn"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    title="Previous"
                                >
                                    <SkipBack size={14} fill="currentColor" />
                                </button>

                                {/* Play/Pause */}
                                 <button
                                    onClick={togglePlay}
                                    disabled={!currentSong}
                                    className="ske-raised ske-spring-btn"
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        background: isPlaying ? accentColor : 'var(--color-paper-dark)',
                                        color: isPlaying ? 'var(--color-paper)' : 'var(--color-ink)',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: currentSong ? 'pointer' : 'default',
                                    }}
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <Pause size={16} fill="currentColor" color="currentColor" />
                                    ) : (
                                        <Play size={16} fill="currentColor" color="currentColor" style={{ marginLeft: '2px' }} />
                                    )}
                                </button>

                                {/* Next */}
                                <button
                                    onClick={handleNext}
                                    disabled={!currentSong}
                                    className="icon-btn ske-spring-btn"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    title="Next"
                                >
                                    <SkipForward size={14} fill="currentColor" />
                                </button>

                                {/* Repeat */}
                                <button
                                    onClick={toggleRepeat}
                                    className={`icon-btn ske-spring-btn ${repeatMode !== 'none' ? 'active' : ''}`}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                    }}
                                    title={`Repeat: ${repeatMode}`}
                                >
                                    {repeatMode === 'one' ? (
                                        <Repeat1 size={14} />
                                    ) : (
                                        <Repeat size={14} />
                                    )}
                                    {repeatMode !== 'none' && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: accentColor,
                                            boxShadow: `0 0 6px 1px ${accentColor}`,
                                            animation: 'pulseGlow 1.5s infinite alternate',
                                        }} />
                                    )}
                                </button>
                            </div>

                            {/* Divider */}
                            <div style={{ width: '1px', height: '28px', background: colors.rule }} />

                            {/* Volume */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0',
                                    position: 'relative',
                                }}
                                onMouseEnter={() => setVolumeHovered(true)}
                                onMouseLeave={() => setVolumeHovered(false)}
                            >
                                <div
                                    onClick={handleVolumeClick}
                                    style={{
                                        width: volumeHovered ? '80px' : '0px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        paddingRight: volumeHovered ? '8px' : '0',
                                    }}
                                >
                                    <div style={{
                                        position: 'relative',
                                        width: '70px',
                                        height: '6px',
                                        transition: 'height 0.2s ease',
                                    }}>
                                        {/* Track background */}
                                        <div 
                                            className="ske-recessed"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: '3px',
                                            }} 
                                        />
                                        {/* Track fill */}
                                        <div 
                                            className="ske-progress-fill"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: `${volume * 100}%`,
                                                height: '100%',
                                                background: accentColor,
                                                borderRadius: '3px',
                                            }} 
                                        />
                                        {/* Thumb */}
                                        <div 
                                            className="ske-raised-xs"
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: `${volume * 100}%`,
                                                transform: volumeHovered ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%) scale(0)',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: 'var(--color-paper-dark)',
                                                border: '1px solid var(--color-border)',
                                                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }} 
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                                    className="icon-btn"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {volume === 0 ? (
                                        <VolumeX size={18} />
                                    ) : volume < 0.5 ? (
                                        <Volume1 size={18} />
                                    ) : (
                                        <Volume2 size={18} />
                                    )}
                                </button>
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
                                        onMouseEnter={() => setProgressHovered(true)}
                                        onMouseLeave={() => setProgressHovered(false)}
                                        onMouseMove={handleProgressMouseMove}
                                        style={{
                                            flex: 1,
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            position: 'relative',
                                        }}
                                    >
                                        <div
                                            className="ske-recessed"
                                            style={{
                                                width: '100%',
                                                height: progressHovered ? '7px' : '5px',
                                                borderRadius: '3px',
                                                position: 'relative',
                                                transition: 'height 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}
                                        >
                                            {/* Tooltip Time Badge */}
                                            {progressHovered && duration > 0 && (
                                                <div
                                                    className="ske-textured ske-float"
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '100%',
                                                        left: `${hoverXPercent}%`,
                                                        transform: 'translate(-50%, -10px)',
                                                        background: 'var(--color-overlay-deep)',
                                                        border: `1px solid var(--color-accent-border)`,
                                                        backdropFilter: 'blur(10px)',
                                                        WebkitBackdropFilter: 'blur(10px)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: fonts.mono,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 600,
                                                        color: colors.ink,
                                                        whiteSpace: 'nowrap',
                                                        pointerEvents: 'none',
                                                        zIndex: 1000,
                                                        animation: 'fadeIn 0.15s ease-out',
                                                    }}
                                                >
                                                    {formatTime(hoverTime)}
                                                </div>
                                            )}

                                            {/* Progress Fill */}
                                            <div 
                                                className="ske-progress-fill"
                                                style={{
                                                    height: '100%',
                                                    width: `${progressPercent}%`,
                                                    background: accentColor,
                                                    borderRadius: '3px',
                                                    transition: 'width 0.1s linear',
                                                }} 
                                            />

                                            {/* Progress Thumb Handle */}
                                            <div 
                                                className="ske-raised-xs"
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: `${progressPercent}%`,
                                                    transform: progressHovered ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%) scale(1)',
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    background: 'var(--color-paper-dark)',
                                                    border: '1px solid var(--color-border)',
                                                    transition: 'transform 200ms var(--ease-spring)',
                                                }} 
                                            />
                                        </div>
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
                    </>
                )}
            </div>

            <style>{`
                @keyframes barBounce {
                    from { transform: scaleY(0.35); opacity: 0.7; }
                    to   { transform: scaleY(1);    opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes pulseGlow {
                    from { transform: scale(0.9); opacity: 0.8; }
                    to   { transform: scale(1.3); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
