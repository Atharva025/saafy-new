import { useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import SkeletonLoader from './SkeletonLoader'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getImageUrl(song) {
    return (
        song.image?.[0]?.link || song.image?.[0]?.url ||
        song.image?.[1]?.link || song.image?.[1]?.url ||
        song.image?.[2]?.link || song.image?.[2]?.url ||
        song.imageUrl || ''
    )
}

// ─── Animated bars (now playing) ─────────────────────────────────────────────
function NowPlayingBars({ color = '#fff', size = 14 }) {
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${size}px` }}>
                {[0.55, 1, 0.4, 0.75, 0.5].map((h, i) => (
                    <div
                        key={i}
                        style={{
                            width: '2.5px',
                            height: `${h * 100}%`,
                            background: color,
                            borderRadius: '2px',
                            animation: `barBounce 0.75s ease-in-out ${i * 0.13}s infinite alternate`,
                        }}
                    />
                ))}
            </div>
            <style>{`
        @keyframes barBounce {
          from { transform: scaleY(0.35); opacity: 0.7; }
          to   { transform: scaleY(1);    opacity: 1; }
        }
      `}</style>
        </>
    )
}

// ─── Queue button ─────────────────────────────────────────────────────────────
function QueueBtn({ song, onAddToQueue, success, size = 28 }) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onAddToQueue(song)
                success(`Added "${song.name}" to queue`, { duration: 2000 })
            }}
            title="Add to queue"
            aria-label="Add to queue"
            className="ske-raised"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.94)',
                border: '1px solid rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <svg width={size * 0.43} height={size * 0.43} viewBox="0 0 24 24" fill="none" stroke="#1A1614" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        </button>
    )
}

// ─── Play circle button ───────────────────────────────────────────────────────
function PlayCircle({ isActive, isPlaying, accentColor, size = 42, hovered }) {
    const bg = isActive && isPlaying ? accentColor : 'rgba(255,255,255,0.96)'
    const iconColor = isActive && isPlaying ? '#fff' : '#1A1614'
    return (
        <div
            className="ske-raised"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: hovered ? 'scale(1)' : 'scale(0.88)',
                opacity: hovered || (isActive && isPlaying) ? 1 : 0,
                transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease, background 0.25s ease',
                flexShrink: 0,
            }}>
            {isActive && isPlaying ? (
                <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill={iconColor}>
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
            ) : (
                <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill={iconColor} style={{ marginLeft: '2px' }}>
                    <path d="M8 5v14l11-7L8 5z" />
                </svg>
            )}
        </div>
    )
}

// ─── Hero Card ────────────────────────────────────────────────────────────────
function HeroCard({ song, onPlay, onAddToQueue, currentSong, isPlaying, colors, fonts, success }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)

    return (
        <div
            style={{ height: '100%' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div
                onClick={() => onPlay(song)}
                role="button"
                tabIndex={0}
                aria-label={`Play ${song.name}`}
                onKeyDown={e => e.key === 'Enter' && onPlay(song)}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: isActive
                        ? `2px solid ${colors.accent}`
                        : `1px solid rgba(255,255,255,0.12)`,
                    boxShadow: isActive
                        ? `4px 5px 12px var(--ske-shadow), -2px -2px 8px var(--ske-highlight), inset 0 1px 1px var(--ske-inner-highlight), 0 0 0 2px ${colors.accent}35, 0 16px 48px ${colors.accent}28`
                        : hovered
                            ? `6px 8px 20px var(--ske-shadow), -4px -4px 12px var(--ske-highlight), inset 0 1px 1px var(--ske-inner-highlight), inset 0 -1px 2px var(--ske-inner-shadow)`
                            : `2px 3px 8px var(--ske-shadow), -2px -2px 5px var(--ske-highlight), inset 0 1px 1px var(--ske-inner-highlight), inset 0 -1px 1px var(--ske-inner-shadow)`,
                    transition: 'box-shadow 200ms ease-out, border-color 200ms ease-out, transform 200ms ease-out',
                    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                }}
            >
                {/* Album image */}
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={song.name}
                        loading="lazy"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: hovered ? 'scale(1.04)' : 'scale(1)',
                            transition: 'transform 0.55s cubic-bezier(0.2,0,0,1)',
                        }}
                    />
                )}

                {/* Scrim — layered for better depth */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(175deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.48) 60%, rgba(0,0,0,0.88) 100%)',
                }} />

                {/* Top-left: now playing pill OR genre badge */}
                <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                    {isActive && isPlaying ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            background: colors.accent,
                            borderRadius: '99px',
                            padding: '5px 11px',
                            boxShadow: `0 4px 14px ${colors.accent}55`,
                        }}>
                            <NowPlayingBars color="#fff" size={12} />
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: 'var(--text-xs)',
                                color: '#fff',
                                fontWeight: 700,
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                            }}>
                                Now Playing
                            </span>
                        </div>
                    ) : (
                        <div style={{
                            background: 'rgba(255,255,255,0.14)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            borderRadius: '99px',
                            padding: '4px 10px',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}>
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: 'var(--text-xs)',
                                color: 'rgba(255,255,255,0.88)',
                                fontWeight: 600,
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                            }}>
                                Featured
                            </span>
                        </div>
                    )}
                </div>

                {/* Top-right: queue button */}
                {hovered && onAddToQueue && !isActive && (
                    <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                        <QueueBtn song={song} onAddToQueue={onAddToQueue} success={success} size={34} />
                    </div>
                )}

                {/* Bottom info */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '32px 20px 20px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: '14px',
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: fonts.display,
                            fontWeight: 700,
                            fontSize: 'clamp(1rem, 2.4vw, 1.45rem)',
                            color: '#fff',
                            marginBottom: '5px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}>
                            {song.name}
                        </div>
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: 'var(--text-xs)',
                            color: 'rgba(255,255,255,0.72)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.02em',
                        }}>
                            {song.primaryArtists}
                        </div>
                    </div>
                    <PlayCircle isActive={isActive} isPlaying={isPlaying} accentColor={colors.accent} size={46} hovered={hovered} />
                </div>
            </div>
        </div>
    )
}

// ─── Small companion card ─────────────────────────────────────────────────────
function SmallCard({ song, index, onPlay, onAddToQueue, currentSong, isPlaying, colors, fonts, success }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)

    return (
        <div
            onClick={() => onPlay(song)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            role="button"
            tabIndex={0}
            aria-label={`Play ${song.name}`}
            onKeyDown={e => e.key === 'Enter' && onPlay(song)}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '14px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isActive ? `2px solid ${colors.accent}` : `1px solid rgba(255,255,255,0.10)`,
                boxShadow: isActive
                    ? `2px 3px 8px var(--ske-shadow), -1px -1px 5px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight), 0 0 0 2px ${colors.accent}28, 0 8px 28px ${colors.accent}22`
                    : hovered
                        ? `4px 5px 14px var(--ske-shadow), -3px -3px 8px var(--ske-highlight), inset 0 1px 1px var(--ske-inner-highlight), inset 0 -1px 2px var(--ske-inner-shadow)`
                        : `1px 2px 6px var(--ske-shadow), -1px -1px 4px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight), inset 0 -1px 1px var(--ske-inner-shadow)`,
                transition: 'box-shadow 200ms ease-out, border-color 200ms ease-out, transform 200ms ease-out',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                animation: 'cardFadeIn 0.4s ease-out both',
                animationDelay: `${index * 0.06}s`,
            }}
        >
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={song.name}
                    loading="lazy"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: hovered ? 'scale(1.06)' : 'scale(1)',
                        transition: 'transform 0.42s cubic-bezier(0.2,0,0,1)',
                    }}
                />
            )}

            {/* Scrim */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)',
            }} />

            {/* Top-left: now playing bars */}
            {isActive && isPlaying && (
                <div style={{ position: 'absolute', top: '9px', left: '9px' }}>
                    <NowPlayingBars color={colors.accent} size={13} />
                </div>
            )}

            {/* Top-right: queue button */}
            {hovered && onAddToQueue && !isActive && (
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    <QueueBtn song={song} onAddToQueue={onAddToQueue} success={success} size={28} />
                </div>
            )}

            {/* Play overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
            }}>
                <PlayCircle isActive={isActive} isPlaying={isPlaying} accentColor={colors.accent} size={38} hovered={hovered} />
            </div>

            {/* Bottom info */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '10px',
            }}>
                <div style={{
                    fontFamily: fonts.primary,
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                    textShadow: '0 1px 6px rgba(0,0,0,0.5)',
                }}>
                    {song.name}
                </div>
                <div style={{
                    fontFamily: fonts.mono,
                    fontSize: 'var(--text-xs)',
                    color: 'rgba(255,255,255,0.62)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                    letterSpacing: '0.01em',
                }}>
                    {song.primaryArtists}
                </div>
            </div>
        </div>
    )
}

// ─── Horizontal scroll card ───────────────────────────────────────────────────
function ScrollCard({ song, index, onPlay, onAddToQueue, currentSong, isPlaying, colors, fonts, success }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onPlay(song)}
            role="button"
            tabIndex={0}
            aria-label={`Play ${song.name}`}
            onKeyDown={e => e.key === 'Enter' && onPlay(song)}
            style={{
                flexShrink: 0,
                width: 'clamp(140px, 20vw, 172px)',
                cursor: 'pointer',
                transition: 'transform 280ms cubic-bezier(0.25,0.46,0.45,0.94)',
                transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                animation: 'cardFadeIn 0.42s ease-out both',
                animationDelay: `${index * 0.055}s`,
            }}
        >
            {/* Cover art square */}
            <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '100%',
                borderRadius: '14px',
                overflow: 'hidden',
                background: colors.paperDark,
                border: isActive
                    ? `2px solid ${colors.accent}`
                    : `1px solid ${colors.rule}`,
                boxShadow: isActive && isPlaying
                    ? `0 0 0 3px ${colors.accent}22, 0 10px 28px ${colors.accent}28`
                    : hovered
                        ? '0 14px 32px rgba(0,0,0,0.22)'
                        : '0 4px 14px rgba(0,0,0,0.1)',
                transition: 'box-shadow 0.28s ease, border-color 0.28s ease',
                marginBottom: '10px',
            }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={song.name}
                        loading="lazy"
                        width="172"
                        height="172"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: hovered ? 'scale(1.06)' : 'scale(1)',
                            transition: 'transform 0.38s cubic-bezier(0.2,0,0,1)',
                        }}
                    />
                ) : (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill={colors.inkLight}>
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}

                {/* Dark overlay + play circle on hover */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.36)',
                    opacity: hovered || (isActive && isPlaying) ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <PlayCircle isActive={isActive} isPlaying={isPlaying} accentColor={colors.accent} size={42} hovered={hovered} />
                </div>

                {/* Queue button */}
                {hovered && onAddToQueue && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>
                        <QueueBtn song={song} onAddToQueue={onAddToQueue} success={success} size={28} />
                    </div>
                )}

                {/* Active indicator dot */}
                {isActive && !isPlaying && (
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: colors.accent,
                        boxShadow: `0 0 8px ${colors.accent}80`,
                    }} />
                )}
            </div>

            {/* Text */}
            <div style={{
                fontFamily: fonts.primary,
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                color: isActive ? colors.accent : colors.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '3px',
                transition: 'color 0.22s ease',
                lineHeight: 1.3,
            }}>
                {song.name || song.title}
            </div>
            <div style={{
                fontFamily: fonts.mono,
                fontSize: 'var(--text-xs)',
                color: colors.inkMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
            }}>
                {song.primaryArtists || 'Unknown Artist'}
            </div>
        </div>
    )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function DiscoverSection({ songs, loading, featured = false, onPlaySong, onAddToQueue }) {
    const { colors, fonts } = useTheme()
    const { currentSong, isPlaying } = usePlayer()
    const { success } = useToast()

    if (loading && featured) {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
            }}>
                <SkeletonLoader type="card" count={5} />
            </div>
        )
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px 0 12px 0' }}>
                <SkeletonLoader type="card" count={6} />
            </div>
        )
    }

    if (!songs || songs.length === 0) return null

    const handlePlay = (song) => { if (onPlaySong) onPlaySong(song) }

    const sharedProps = { onPlay: handlePlay, onAddToQueue, currentSong, isPlaying, colors, fonts, success }

    // ─── Featured editorial grid ─────────────────────────────────────────────
    if (featured && songs.length >= 5) {
        const [hero, ...rest] = songs.slice(0, 5)
        return (
            <>
                <style>{`
          @keyframes cardFadeIn {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
                    gap: '14px',
                    height: 'clamp(300px, 33vw, 440px)',
                }}>
                    <HeroCard song={hero} {...sharedProps} />
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '1fr 1fr',
                        gap: '12px',
                    }}>
                        {rest.slice(0, 4).map((song, i) => (
                            <SmallCard key={song.id} song={song} index={i} {...sharedProps} />
                        ))}
                    </div>
                </div>
            </>
        )
    }

    // ─── Horizontal scroll row ────────────────────────────────────────────────
    return (
        <>
            <style>{`
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
            <div
                className="hide-scrollbar"
                style={{
                    display: 'flex',
                    gap: '14px',
                    overflowX: 'auto',
                    paddingBottom: '12px',
                    paddingLeft: '4px',
                    marginLeft: '-4px',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {songs.map((song, index) => (
                    <ScrollCard key={song.id} song={song} index={index} {...sharedProps} />
                ))}
            </div>
        </>
    )
}