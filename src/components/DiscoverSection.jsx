import { useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'

export default function DiscoverSection({ songs, loading, featured = false, onPlaySong }) {
    const { colors, fonts, isDark } = useTheme()
    const { currentSong, isPlaying } = usePlayer()

    // Loading state - Featured Bento Grid Skeleton
    if (loading && featured) {
        return (
            <>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridTemplateRows: 'repeat(2, 200px)',
                    gap: '16px',
                }}>
                    {/* Main skeleton card */}
                    <div style={{
                        gridColumn: 'span 2',
                        gridRow: 'span 2',
                        background: colors.paperDark,
                        borderRadius: '8px',
                        animation: 'shimmer 1.5s infinite',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute',
                            bottom: '24px',
                            left: '24px',
                            right: '24px',
                        }}>
                            <div style={{
                                height: '24px',
                                width: '60%',
                                background: colors.paperDarker,
                                borderRadius: '4px',
                                marginBottom: '8px',
                            }} />
                            <div style={{
                                height: '14px',
                                width: '40%',
                                background: colors.paperDarker,
                                borderRadius: '4px',
                            }} />
                        </div>
                    </div>

                    {/* 4 smaller skeleton cards */}
                    {[...Array(4)].map((_, i) => (
                        <div key={i} style={{
                            background: colors.paperDark,
                            borderRadius: '8px',
                            animation: 'shimmer 1.5s infinite',
                            animationDelay: `${i * 0.1}s`,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute',
                                bottom: '12px',
                                left: '12px',
                                right: '12px',
                            }}>
                                <div style={{
                                    height: '14px',
                                    width: '70%',
                                    background: colors.paperDarker,
                                    borderRadius: '4px',
                                    marginBottom: '6px',
                                }} />
                                <div style={{
                                    height: '10px',
                                    width: '50%',
                                    background: colors.paperDarker,
                                    borderRadius: '4px',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                <style>{`
                    @keyframes shimmer {
                        0% { opacity: 0.5; }
                        50% { opacity: 1; }
                        100% { opacity: 0.5; }
                    }
                `}</style>
            </>
        )
    }

    // Loading state - Horizontal Scroll Skeleton
    if (loading) {
        return (
            <>
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                }} className="hide-scrollbar">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ flexShrink: 0, width: '150px' }}>
                            <div style={{
                                width: '150px',
                                height: '150px',
                                background: colors.paperDark,
                                marginBottom: '12px',
                                borderRadius: '6px',
                                animation: 'shimmer 1.5s infinite',
                                animationDelay: `${i * 0.1}s`,
                            }} />
                            <div style={{
                                height: '14px',
                                background: colors.paperDark,
                                width: '80%',
                                marginBottom: '8px',
                                borderRadius: '4px',
                                animation: 'shimmer 1.5s infinite',
                                animationDelay: `${i * 0.1 + 0.05}s`,
                            }} />
                            <div style={{
                                height: '10px',
                                background: colors.paperDark,
                                width: '55%',
                                borderRadius: '4px',
                                animation: 'shimmer 1.5s infinite',
                                animationDelay: `${i * 0.1 + 0.1}s`,
                            }} />
                        </div>
                    ))}
                </div>

                <style>{`
                    @keyframes shimmer {
                        0% { opacity: 0.5; }
                        50% { opacity: 1; }
                        100% { opacity: 0.5; }
                    }
                `}</style>
            </>
        )
    }

    if (!songs || songs.length === 0) return null

    const handlePlay = (song) => {
        if (onPlaySong) {
            onPlaySong(song, songs)
        }
    }

    // Featured Bento Grid
    if (featured && songs.length >= 5) {
        const [main, ...rest] = songs.slice(0, 5)

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: 'repeat(2, 200px)',
                gap: '16px',
            }}>
                {/* Large Main Card */}
                <div
                    onClick={() => handlePlay(main)}
                    style={{
                        gridColumn: 'span 2',
                        gridRow: 'span 2',
                        position: 'relative',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        borderRadius: '8px',
                        border: currentSong?.id === main.id ? `2px solid ${colors.accent}` : 'none',
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
                            transition: 'transform 0.5s',
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(26,22,20,0.8) 0%, rgba(26,22,20,0.2) 50%, transparent 100%)',
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
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginLeft: '-8px',
            paddingLeft: '8px',
        }} className="hide-scrollbar">
            {songs.map((song) => (
                <SongCard
                    key={song.id}
                    song={song}
                    onPlay={handlePlay}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    colors={colors}
                    fonts={fonts}
                />
            ))}
        </div>
    )
}

function SongCard({ song, onPlay, currentSong, isPlaying, colors, fonts, compact = false }) {
    const isCurrentSong = currentSong?.id === song.id
    const imageUrl = song.image?.[0]?.link || song.image?.[1]?.link || song.image?.[2]?.link || ''
    const [hovered, setHovered] = useState(false)

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
                    borderRadius: '8px',
                    border: isCurrentSong ? `2px solid ${colors.accent}` : 'none',
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
                    background: 'linear-gradient(to top, rgba(26,22,20,0.7) 0%, transparent 60%)',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '12px',
                }}>
                    <div style={{
                        fontFamily: fonts.primary,
                        fontWeight: 600,
                        fontSize: '0.85rem',
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
                width: '150px',
                cursor: 'pointer',
            }}
        >
            <div style={{
                position: 'relative',
                width: '150px',
                height: '150px',
                marginBottom: '12px',
                overflow: 'hidden',
                borderRadius: '6px',
                boxShadow: isCurrentSong ? `0 0 0 2px ${colors.accent}` : 'none',
            }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={song.name}
                        loading="lazy"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: hovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.3s',
                        }}
                    />
                ) : (
                    <div style={{
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
            </div>

            <div style={{
                fontFamily: fonts.primary,
                fontWeight: 600,
                fontSize: '0.9rem',
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
                fontSize: '0.75rem',
                color: colors.inkMuted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {song.primaryArtists || 'Unknown Artist'}
            </div>
        </div>
    )
}
