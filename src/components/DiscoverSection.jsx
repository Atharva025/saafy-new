import { useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import SkeletonLoader from './SkeletonLoader'

export default function DiscoverSection({ songs, loading, featured = false, onPlaySong, onAddToQueue }) {
    const { colors, fonts } = useTheme()
    const { currentSong, isPlaying } = usePlayer()
    const { success } = useToast()
    const [mainHovered, setMainHovered] = useState(false)
    const [hoveredCard, setHoveredCard] = useState(null)

    // Loading state - Featured Bento Grid Skeleton
    if (loading && featured) {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 35vw, 160px), 1fr))',
                gap: 'clamp(12px, 3vw, 16px)',
            }}>
                <SkeletonLoader type="card" count={6} />
            </div>
        )
    }

    // Loading state - Horizontal Scroll Skeleton
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                gap: 'clamp(12px, 3vw, 16px)',
                overflowX: 'auto',
                padding: '2px',
            }}>
                <SkeletonLoader type="card" count={6} />
            </div>
        )
    }

    if (!songs || songs.length === 0) return null

    const handlePlay = (song) => {
        if (onPlaySong) {
            onPlaySong(song)
        }
    }

    // Featured Bento Grid
    if (featured && songs.length >= 5) {
        const [main, ...rest] = songs.slice(0, 5)
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
        const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gridTemplateRows: isMobile ? 'auto' : isTablet ? 'repeat(3, 180px)' : 'repeat(2, 200px)',
                gap: 'clamp(12px, 3vw, 16px)',
            }}>
                {/* Large Main Card */}
                <div
                    onClick={() => handlePlay(main)}
                    onMouseEnter={() => setMainHovered(true)}
                    onMouseLeave={() => setMainHovered(false)}
                    style={{
                        gridColumn: isMobile ? 'span 1' : isTablet ? 'span 2' : 'span 2',
                        gridRow: isMobile ? 'span 1' : isTablet ? 'span 2' : 'span 2',
                        minHeight: isMobile ? '200px' : '180px',
                        position: 'relative',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        borderRadius: '18px',
                        border: currentSong?.id === main.id ? `2px solid ${colors.accent}` : `1px solid ${colors.rule}`,
                        boxShadow: currentSong?.id === main.id
                            ? `0 12px 36px ${colors.accent}40`
                            : '0 12px 32px rgba(0,0,0,0.12)',
                        transition: 'all 0.3s ease',
                    }}
                >
                    <img
                        src={main.image?.[0]?.link || main.image?.[1]?.link || main.image?.[2]?.link || ''}
                        alt={main.name}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: mainHovered ? 'scale(1.03)' : 'scale(1)',
                            transition: 'transform 0.4s ease',
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '24px',
                    }}>
                        <div style={{
                            fontFamily: fonts.primary,
                            fontWeight: 700,
                            fontSize: '1.5rem',
                            color: '#FAF7F2',
                            marginBottom: '4px',
                        }}>
                            {main.name}
                        </div>
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: '0.85rem',
                            color: 'rgba(250,247,242,0.7)',
                        }}>
                            {main.primaryArtists}
                        </div>
                    </div>
                </div>

                {/* 4 Smaller Cards */}
                {rest.slice(0, 4).map((song) => (
                    <SongCard
                        key={song.id}
                        song={song}
                        onPlay={handlePlay}
                        onAddToQueue={onAddToQueue}
                        currentSong={currentSong}
                        isPlaying={isPlaying}
                        colors={colors}
                        fonts={fonts}
                        compact
                    />
                ))}
            </div>
        )
    }

    // Horizontal Scroll Layout
    return (
        <div style={{
            display: 'flex',
            gap: 'clamp(16px, 4vw, 20px)',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginLeft: '-8px',
            paddingLeft: '8px',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
        }} className="hide-scrollbar">
            {songs.map((song, index) => (
                <SongCard
                    key={song.id}
                    song={song}
                    onPlay={handlePlay}
                    onAddToQueue={onAddToQueue}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    colors={colors}
                    fonts={fonts}
                    index={index}
                />
            ))}
        </div>
    )
}

function SongCard({ song, onPlay, onAddToQueue, currentSong, isPlaying, colors, fonts, compact = false, index = 0 }) {
    const isCurrentSong = currentSong?.id === song.id
    // Try to get highest quality image - check both .link and .url properties
    const imageUrl = song.image?.[0]?.link || song.image?.[0]?.url ||
        song.image?.[1]?.link || song.image?.[1]?.url ||
        song.image?.[2]?.link || song.image?.[2]?.url ||
        song.imageUrl || ''
    const [hovered, setHovered] = useState(false)
    const { success } = useToast()

    const handleAddToQueue = (e) => {
        e.stopPropagation()
        if (onAddToQueue) {
            onAddToQueue(song)
            success(`Added "${song.name}" to queue`, {
                duration: 2000,
            })
        }
    }

    if (compact) {
        return (
            <div
                onClick={() => onPlay(song)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    borderRadius: '12px',
                    border: isCurrentSong ? `2px solid ${colors.accent}` : `1px solid ${colors.rule}`,
                    boxShadow: hovered
                        ? '0 12px 24px rgba(0,0,0,0.18)'
                        : '0 6px 18px rgba(0,0,0,0.12)',
                    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                    transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                    animation: 'cardFadeIn 0.5s ease-out',
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: 'backwards',
                }}
            >
                <img
                    src={imageUrl}
                    alt={song.name}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: hovered ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.5s',
                    }}
                />

                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 65%)',
                }} />
                {hovered && onAddToQueue && (
                    <button
                        onClick={handleAddToQueue}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(250,247,242,0.95)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Add to Queue"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1614" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                )}

                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '14px',
                }}>
                    <div style={{
                        fontFamily: fonts.primary,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#FAF7F2',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {song.name}
                    </div>
                    <div style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        color: 'rgba(250,247,242,0.7)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {song.primaryArtists}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={() => onPlay(song)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                flexShrink: 0,
                width: 'clamp(140px, 35vw, 160px)',
                cursor: 'pointer',
                transition: 'transform 0.25s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                animation: 'cardFadeIn 0.5s ease-out',
                animationDelay: `${index * 0.08}s`,
                animationFillMode: 'backwards',
            }}
        >
            <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '100%',
                marginBottom: 'clamp(8px, 2vw, 12px)',
                overflow: 'hidden',
                borderRadius: 'clamp(12px, 3vw, 14px)',
                border: isCurrentSong ? `2px solid ${colors.accent}` : `1px solid ${colors.rule}`,
                boxShadow: isCurrentSong && isPlaying
                    ? `0 12px 28px ${colors.accent}60, 0 0 20px ${colors.accent}40`
                    : hovered
                        ? '0 12px 28px rgba(0,0,0,0.18)'
                        : '0 6px 18px rgba(0,0,0,0.1)',
                transition: 'all 0.25s ease',
                animation: isCurrentSong && isPlaying ? 'cardBreathe 3s ease-in-out infinite' : 'none',
            }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={song.name}
                        loading="lazy"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: hovered ? 'scale(1.04)' : 'scale(1)',
                            transition: 'transform 0.25s ease',
                        }}
                    />
                ) : (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: colors.paperDark,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill={colors.inkLight}>
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}

                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(26,22,20,0.4)',
                    opacity: (isCurrentSong && isPlaying) || hovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#FAF7F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}>
                        {isCurrentSong && isPlaying ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1614">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1A1614" style={{ marginLeft: '2px' }}>
                                <path d="M8 5v14l11-7L8 5z" />
                            </svg>
                        )}
                    </div>
                </div>

                {hovered && onAddToQueue && (
                    <button
                        onClick={handleAddToQueue}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(250,247,242,0.95)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Add to Queue"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1614" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                )}
            </div>

            <div style={{
                fontFamily: fonts.primary,
                fontWeight: 600,
                fontSize: 'clamp(0.8rem, 2.2vw, 0.9rem)',
                color: isCurrentSong ? colors.accent : colors.ink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '4px',
            }}>
                {song.name || song.title}
            </div>
            <div style={{
                fontFamily: fonts.mono,
                fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                color: colors.inkMuted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {song.primaryArtists || 'Unknown Artist'}
            </div>

            <style>{`
                @keyframes cardBreathe {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.02);
                    }
                }
                @keyframes cardFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}

