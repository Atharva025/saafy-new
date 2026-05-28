import { useState } from 'react'
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
    Music 
} from 'lucide-react'

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
        shuffleMode,
        repeatMode,
        toggleShuffle,
        toggleRepeat,
        dominantColor
    } = usePlayer()

    const [isHovered, setIsHovered] = useState(false)
    const [volumeHovered, setVolumeHovered] = useState(false)
    const [volumeExpanded, setVolumeExpanded] = useState(false)
    const [progressHovered, setProgressHovered] = useState(false)
    const [hoverTime, setHoverTime] = useState(0)
    const [hoverXPercent, setHoverXPercent] = useState(0)
    const [artHovered, setArtHovered] = useState(false)


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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const isTinyScreen = typeof window !== 'undefined' && window.innerWidth < 380

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
                    border: isHovered && dominantColor
                        ? `1px solid ${adjustColorForTheme(dominantColor, isDark)?.rgba(0.28) || 'var(--color-accent-border)'}`
                        : `1px solid var(--color-border)`,
                    overflow: 'hidden',
                    transition: 'box-shadow 250ms ease-out, background 0.3s ease, border-color 0.3s ease',
                    position: 'relative',
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
                {/* Main Content Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isTinyScreen ? '6px' : 'clamp(8px, 2vw, 14px)',
                    padding: isTinyScreen ? '8px 10px' : 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 18px)',
                    flexWrap: 'nowrap',
                }}>
                    {/* Album Art */}
                    <div 
                        onMouseEnter={() => setArtHovered(true)}
                        onMouseLeave={() => setArtHovered(false)}
                        className="ske-art"
                        style={{
                            width: isTinyScreen ? '36px' : 'clamp(40px, 9vw, 48px)',
                            height: isTinyScreen ? '36px' : 'clamp(40px, 9vw, 48px)',
                            borderRadius: 'clamp(6px, 2vw, 8px)',
                            overflow: 'hidden',
                            flexShrink: 0,
                            background: colors.paperDark,
                            position: 'relative',
                            transition: 'box-shadow 0.4s ease, transform 0.4s ease',
                            transform: artHovered ? 'scale(1.05)' : 'scale(1)',
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
                        minWidth: isTinyScreen ? '60px' : isMobile ? '70px' : '100px',
                        maxWidth: isTinyScreen ? '100px' : isMobile ? '110px' : '160px',
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
                                        fontSize: isTinyScreen ? '0.7rem' : 'clamp(0.72rem, 2vw, 0.85rem)',
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
                                        fontSize: isTinyScreen ? '0.6rem' : 'clamp(0.62rem, 1.8vw, 0.7rem)',
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
                                                        background: dominantColor ? adjustColorForTheme(dominantColor, isDark)?.rgb || colors.accent : colors.accent,
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

                    <div style={{ flex: isMobile ? 0 : 1 }} />

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isTinyScreen ? '4px' : '8px' }}>
                        {/* Shuffle - Hidden on very small screens */}
                        {!isMobile && (
                            <button
                                onClick={toggleShuffle}
                                className={`icon-btn ${shuffleMode ? 'active' : ''}`}
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
                                        width: '3px',
                                        height: '3px',
                                        borderRadius: '50%',
                                        background: 'currentColor',
                                        boxShadow: '0 0 4px currentColor',
                                    }} />
                                )}
                            </button>
                        )}

                        {/* Previous */}
                        <button
                            onClick={handlePrevious}
                            disabled={!currentSong}
                            className="icon-btn"
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
                            className="ske-raised"
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: isPlaying 
                                    ? 'var(--color-accent)' 
                                    : 'var(--color-paper-dark)',
                                color: isPlaying 
                                    ? 'var(--color-paper)' 
                                    : 'var(--color-ink)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
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
                            className="icon-btn"
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

                        {/* Repeat - Hide on tiny screens */}
                        {!isTinyScreen && (
                            <button
                                onClick={toggleRepeat}
                                className={`icon-btn ${repeatMode !== 'none' ? 'active' : ''}`}
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
                                        width: '3px',
                                        height: '3px',
                                        borderRadius: '50%',
                                        background: 'currentColor',
                                        boxShadow: '0 0 4px currentColor',
                                    }} />
                                )}
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
                                className="ske-textured ske-float"
                                style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
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
                                            background: 'var(--color-accent)',
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

                        {/* Horizontal slider for desktop - expands left */}
                        {!isMobile && (
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
                                            background: 'var(--color-accent)',
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
                        )}

                        {/* Volume icon button */}
                        <button
                            onClick={() => {
                                if (isMobile) {
                                    setVolumeExpanded(!volumeExpanded)
                                } else {
                                    setVolume(volume > 0 ? 0 : 0.7)
                                }
                            }}
                            className={`icon-btn ${isMobile && volumeExpanded ? 'active' : ''}`}
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
                                onMouseEnter={() => setProgressHovered(true)}
                                onMouseLeave={() => setProgressHovered(false)}
                                onMouseMove={handleProgressMouseMove}
                                className="ske-recessed"
                                style={{
                                    flex: 1,
                                    height: progressHovered
                                        ? (isTinyScreen ? '6px' : '7px')
                                        : (isTinyScreen ? '4px' : '5px'),
                                    borderRadius: '3px',
                                    cursor: 'pointer',
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
                                        background: 'var(--color-accent)',
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
                                        height: isTinyScreen ? '10px' : '12px',
                                        borderRadius: '50%',
                                        background: 'var(--color-paper-dark)',
                                        border: '1px solid var(--color-border)',
                                        transition: 'transform 200ms var(--ease-spring)',
                                    }} 
                                />
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
                @keyframes barBounce {
                    from { transform: scaleY(0.35); opacity: 0.7; }
                    to   { transform: scaleY(1);    opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
