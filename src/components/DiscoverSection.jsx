import { useState, useRef } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { encryptedGetItem } from '@/lib/encryption'
import SkeletonLoader from './SkeletonLoader'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getImageUrl(song) {
    if (!song) return ''
    
    // Collect all candidates
    const urls = new Set()
    
    // 1. Check song.image array
    if (Array.isArray(song.image)) {
        song.image.forEach(img => {
            if (img) {
                if (typeof img === 'string') {
                    urls.add(img)
                } else if (typeof img === 'object') {
                    if (img.link && typeof img.link === 'string') urls.add(img.link)
                    if (img.url && typeof img.url === 'string') urls.add(img.url)
                }
            }
        })
    }
    
    // 2. Check song.imageUrl string
    if (song.imageUrl && typeof song.imageUrl === 'string') {
        urls.add(song.imageUrl)
    }
    
    // Convert to array and filter out empty strings
    const candidates = Array.from(urls).map(u => u.trim()).filter(Boolean)
    if (candidates.length === 0) return ''

    // Helper to score a URL based on resolution
    const getScore = (url) => {
        if (url.includes('500x500')) return 3
        if (url.includes('350x350')) return 2.5
        if (url.includes('250x250')) return 2.2
        if (url.includes('150x150')) return 2
        if (url.includes('50x50')) return 1
        return 1.5 // neutral default
    }

    // Sort by score descending (prefer highest resolution first)
    candidates.sort((a, b) => getScore(b) - getScore(a))
    
    let bestUrl = candidates[0]
    
    // Auto-upgrade JioSaavn CDN image quality to 500x500 if low quality
    if (bestUrl && (bestUrl.includes('150x150') || bestUrl.includes('50x50')) && !bestUrl.includes('500x500')) {
        const upgraded = bestUrl.replace('150x150', '500x500').replace('50x50', '500x500')
        bestUrl = upgraded
    }
    
    return bestUrl
}

// ─── Bouncy Equalizer Visualizer ─────────────────────────────────────────────
function NowPlayingBars({ color = '#fff', size = 14 }) {
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${size}px` }}>
                {[0.6, 1, 0.45, 0.8, 0.55].map((h, i) => (
                    <div
                        key={i}
                        style={{
                            width: '2.5px',
                            height: `${h * 100}%`,
                            background: color,
                            borderRadius: '2px',
                            animation: `barBounce 0.75s ease-in-out ${i * 0.13}s infinite alternate`,
                            transformOrigin: 'bottom',
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

// ─── Queue button (Translucent Glassmorphic) ───────────────────────────────
function QueueBtn({ song, onAddToQueue, size = 28 }) {
    const [added, setAdded] = useState(false)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    const handleClick = (e) => {
        e.stopPropagation()
        if (added) return
        onAddToQueue(song)
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    return (
        <button
            onClick={handleClick}
            title={added ? "Added to queue" : "Add to queue"}
            aria-label={added ? "Added to queue" : "Add to queue"}
            className="icon-btn"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '8px',
                background: added ? 'rgba(16, 185, 129, 0.95)' : 'var(--color-overlay)',
                border: added ? '1px solid rgba(16, 185, 129, 0.7)' : '1px solid var(--color-border)',
                color: added ? '#ffffff' : 'var(--color-ink-muted)',
                padding: 0,
                minWidth: 0,
                minHeight: 0,
                boxSizing: 'border-box',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            {/* Invisible touch target expander for mobile accessibility */}
            <span style={{
                position: 'absolute',
                top: '-12px',
                left: '-12px',
                right: '-12px',
                bottom: '-12px',
                cursor: 'pointer',
            }} />
            {added ? (
                <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ) : (
                <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            )}
        </button>
    )
}

// ─── Playlist button (Translucent Glassmorphic) ───────────────────────────
function PlaylistBtn({ song, onAddToPlaylist, size = 28 }) {
    const handleClick = (e) => {
        e.stopPropagation()
        onAddToPlaylist(song)
    }

    return (
        <button
            onClick={handleClick}
            title="Add to playlist"
            aria-label="Add to playlist"
            className="icon-btn"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '8px',
                background: 'var(--color-overlay)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink-muted)',
                padding: 0,
                minWidth: 0,
                minHeight: 0,
                boxSizing: 'border-box',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            <span style={{
                position: 'absolute',
                top: '-12px',
                left: '-12px',
                right: '-12px',
                bottom: '-12px',
                cursor: 'pointer',
            }} />
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="20" y2="12" />
                <line x1="8" y1="18" x2="16" y2="18" />
                <circle cx="3" cy="6" r="1.2" fill="currentColor" />
                <circle cx="3" cy="12" r="1.2" fill="currentColor" />
                <circle cx="3" cy="18" r="1.2" fill="currentColor" />
                <line x1="19" y1="15" x2="19" y2="21" />
                <line x1="16" y1="18" x2="22" y2="18" />
            </svg>
        </button>
    )
}

// ─── Play button (Frosted Glass or Solid Accent) ─────────────────────────────
function PlayCircle({ isActive, isPlaying, accentColor, size = 42, hovered }) {
    const bg = isActive && isPlaying ? accentColor : 'var(--color-paper-dark)'
    const iconColor = isActive && isPlaying ? '#ffffff' : 'var(--color-ink)'
    const borderColor = isActive && isPlaying ? accentColor : 'var(--color-border)'
    const bgImage = isActive && isPlaying ? 'none' : 'var(--background-image-ske-button)'
    const shadow = isActive && isPlaying ? 'var(--shadow-ske-inset-sm)' : 'var(--shadow-ske-xs)'
    
    return (
        <div
            className={`icon-btn ${isActive && isPlaying ? 'active' : ''}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '10px',
                background: bg,
                backgroundImage: bgImage,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: hovered ? 'scale(1.1) translateY(-1px)' : 'scale(0.85)',
                opacity: hovered || (isActive && isPlaying) ? 1 : 0,
                transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease, background 250ms ease, border-color 250ms ease, box-shadow 250ms ease',
                flexShrink: 0,
                border: `1px solid ${borderColor}`,
                boxShadow: hovered ? (isActive && isPlaying ? shadow : `0 8px 20px ${accentColor}35, ${shadow}`) : shadow,
                color: iconColor,
            }}>
            {isActive && isPlaying ? (
                <svg width={size * 0.38} height={size * 0.38} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
            ) : (
                <svg width={size * 0.38} height={size * 0.38} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                    <path d="M8 5v14l11-7L8 5z" />
                </svg>
            )}
        </div>
    )
}

// ─── Grid Play circle (Premium circular frosted button) ──────────────────────
function GridPlayCircle({ isActive, isPlaying, accentColor, size = 36, hovered }) {
    const bg = isActive && isPlaying ? accentColor : 'var(--color-overlay)'
    const iconColor = isActive && isPlaying ? '#ffffff' : 'var(--color-ink)'
    const borderColor = isActive && isPlaying ? accentColor : 'var(--color-border)'
    
    return (
        <div
            className={`grid-play-circle ${isActive && isPlaying ? 'active' : ''}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: bg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${borderColor}`,
                boxShadow: '0 6px 16px rgba(0,0,0,0.22), var(--shadow-ske-xs)',
                color: iconColor,
                transform: hovered ? 'scale(1.1) translateY(-1px)' : 'scale(1)',
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            {isActive && isPlaying ? (
                <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
            ) : (
                <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2.5px' }}>
                    <path d="M8 5v14l11-7L8 5z" />
                </svg>
            )}
        </div>
    )
}


// ─── Hero Card (Frosted Asymmetric Glass Capsule) ──────────────────────────
function HeroCard({ song, onPlay, onAddToQueue, onAddToPlaylist, currentUser, currentSong, isPlaying, colors, fonts, success }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    return (
        <div
            style={{ height: '100%', perspective: '1000px' }}
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
                    borderRadius: '24px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: colors.paperDarker,
                    border: isActive
                        ? `2px solid ${colors.accent}`
                        : `1px solid ${colors.border}`,
                    boxShadow: isActive
                        ? `0 24px 48px ${colors.accent}24, var(--shadow-ske-sm)`
                        : hovered
                            ? `0 30px 60px ${colors.accent}1c, 0 12px 24px var(--ske-shadow), var(--shadow-ske-md)`
                            : `0 8px 24px var(--ske-shadow), var(--shadow-ske-xs)`,
                    transform: hovered ? 'translateY(-6px) rotateX(1deg) rotateY(1deg)' : 'translateY(0) rotateX(0) rotateY(0)',
                    transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Artwork */}
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
                            transform: hovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    />
                )}

                {/* Dark depth scrim */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 100%)',
                }} />

                {/* Top badges */}
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    right: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 10
                }}>
                    {isActive && isPlaying ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: colors.accent,
                            borderRadius: '99px',
                            padding: '6px 14px',
                            boxShadow: `0 8px 20px ${colors.accent}40`,
                            animation: 'glowPulse 2s infinite alternate',
                        }}>
                            <NowPlayingBars color="#fff" size={11} />
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.62rem',
                                color: '#fff',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}>
                                Playing
                            </span>
                        </div>
                    ) : (
                        <div style={{
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            borderRadius: '99px',
                            padding: '6px 14px',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}>
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.62rem',
                                color: 'rgba(255,255,255,0.9)',
                                fontWeight: 600,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}>
                                FEATURED
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        {onAddToQueue && !isActive && (
                            <QueueBtn song={song} onAddToQueue={onAddToQueue} success={success} size={isMobile ? 24 : 34} />
                        )}
                        {currentUser && onAddToPlaylist && !isActive && (
                            <PlaylistBtn song={song} onAddToPlaylist={onAddToPlaylist} size={isMobile ? 24 : 34} />
                        )}
                    </div>
                </div>

                {/* Floating Frosted Glass Info Panel */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    margin: isMobile ? '12px' : '16px',
                    padding: isMobile ? '14px' : '18px 20px',
                    borderRadius: '16px',
                    background: colors.overlay,
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: `1px solid ${colors.border}`,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transform: 'translateZ(20px)', // Lifted 3D element
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: fonts.display,
                            fontWeight: 800,
                            fontSize: 'clamp(0.95rem, 2.5vw, 1.3rem)',
                            color: colors.ink,
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                        }}>
                            {song.name}
                        </div>
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: 'clamp(0.68rem, 1.8vw, 0.75rem)',
                            color: colors.inkMuted,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.01em',
                        }}>
                            {song.primaryArtists}
                        </div>
                    </div>
                    <PlayCircle isActive={isActive} isPlaying={isPlaying} accentColor={colors.accent} size={isMobile ? 40 : 46} hovered={hovered} />
                </div>
            </div>
            <style>{`
                @keyframes glowPulse {
                    from { box-shadow: 0 4px 12px var(--color-accent-subtle); }
                    to   { box-shadow: 0 8px 24px var(--color-accent-border); }
                }
            `}</style>
        </div>
    )
}

// ─── Small companion card (Frosted Sleek Row-Card style) ──────────────────────
function SmallCard({ song, index, onPlay, onAddToQueue, onAddToPlaylist, currentUser, currentSong, isPlaying, colors, fonts, success }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

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
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: colors.paperDark,
                border: isActive ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                boxShadow: isActive
                    ? `0 12px 28px ${colors.accent}18, var(--shadow-ske-sm)`
                    : hovered
                        ? `0 16px 36px rgba(0,0,0,0.12), var(--shadow-ske-md)`
                        : `0 4px 12px var(--ske-shadow), var(--shadow-ske-xs)`,
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'cardFadeIn 0.4s ease-out both',
                animationDelay: `${index * 0.06}s`,
            }}
        >
            {/* Artwork */}
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
                        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                />
            )}

            {/* Gradient Scrim */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            }} />

            {/* Top widgets */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                {isActive && isPlaying ? (
                    <div style={{
                        background: colors.accent,
                        borderRadius: '99px',
                        padding: '4px 10px',
                        boxShadow: `0 4px 12px ${colors.accent}40`,
                    }}>
                        <NowPlayingBars color="#fff" size={10} />
                    </div>
                ) : <div />}

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    {onAddToQueue && !isActive && (
                        <QueueBtn song={song} onAddToQueue={onAddToQueue} success={success} size={isMobile ? 20 : 28} />
                    )}
                    {currentUser && onAddToPlaylist && !isActive && (
                        <PlaylistBtn song={song} onAddToPlaylist={onAddToPlaylist} size={isMobile ? 20 : 28} />
                    )}
                </div>
            </div>

            {/* Center Play Circle Reveal */}
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

            {/* Card Metadata info */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
            }}>
                <div style={{
                    fontFamily: fonts.primary,
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}>
                    {song.name}
                </div>
                <div style={{
                    fontFamily: fonts.mono,
                    fontSize: 'var(--text-xs)',
                    color: 'rgba(255,255,255,0.65)',
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

// ─── Mobile Compact Card (Glassmorphic cells under hero on mobile) ───────────
function MobileCompactCard({ song, index, onPlay, onAddToQueue, onAddToPlaylist, currentUser, currentSong, isPlaying, colors, fonts, success }) {
    const [touched, setTouched] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)

    return (
        <div
            onClick={() => onPlay(song)}
            role="button"
            tabIndex={0}
            aria-label={`Play ${song.name}`}
            onKeyDown={e => e.key === 'Enter' && onPlay(song)}
            onTouchStart={() => setTouched(true)}
            onTouchEnd={() => setTimeout(() => setTouched(false), 180)}
            style={{
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                border: isActive
                    ? `1.5px solid ${colors.accent}`
                    : `1px solid ${colors.border}`,
                boxShadow: isActive
                    ? `0 6px 14px ${colors.accent}1c`
                    : touched ? 'none' : '0 2px 6px rgba(0,0,0,0.06)',
                animation: `cardFadeIn 0.35s ease-out both`,
                animationDelay: `${index * 0.05}s`,
                transform: touched ? 'scale(0.96)' : 'scale(1)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
        >
            <div style={{ position: 'relative', paddingBottom: '100%', background: colors.paperDark }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={song.name}
                        loading="lazy"
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.inkLight}>
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}

                {/* Dark Vignette overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
                }} />

                {/* Playing EQ overlay */}
                {isActive && isPlaying && (
                    <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 10 }}>
                        <NowPlayingBars color={colors.accent} size={9} />
                    </div>
                )}

                {/* Action buttons wrapper */}
                <div style={{ position: 'absolute', top: '5px', right: '5px', zIndex: 10, display: 'flex', gap: '4px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    {onAddToQueue && !isActive && (
                        <QueueBtn song={song} onAddToQueue={onAddToQueue} success={success} size={18} />
                    )}
                    {currentUser && onAddToPlaylist && !isActive && (
                        <PlaylistBtn song={song} onAddToPlaylist={onAddToPlaylist} size={18} />
                    )}
                </div>

                {/* Label Overlay */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px 8px' }}>
                    <div style={{
                        fontFamily: fonts.primary,
                        fontWeight: 700,
                        fontSize: '0.62rem',
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}>
                        {song.name}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Scroll Card (Premium Sleeve Pull-out Design) ───────────────────────────
function ScrollCard({ song, index, onPlay, onAddToQueue, onAddToPlaylist, currentUser, currentSong, isPlaying, colors, fonts, success, layout }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    if (layout === 'grid') {
        return (
            <div
                className="grid-card-tile"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => onPlay(song)}
                role="button"
                tabIndex={0}
                aria-label={`Play ${song.name}`}
                onKeyDown={e => e.key === 'Enter' && onPlay(song)}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px',
                    borderRadius: '20px',
                    background: hovered ? colors.paperDarker : colors.paperDark,
                    backgroundImage: 'var(--background-image-ske-surface)',
                    border: isActive 
                        ? `1.5px solid ${colors.accent}` 
                        : hovered 
                            ? `1px solid ${colors.border}` 
                            : '1px solid transparent',
                    boxShadow: isActive
                        ? `0 12px 28px ${colors.accent}20, var(--shadow-ske-sm)`
                        : hovered
                            ? 'var(--shadow-ske-md), 0 10px 20px rgba(0, 0, 0, 0.06)'
                            : 'var(--shadow-ske-xs)',
                    transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                    animation: 'cardFadeIn 0.4s ease-out both',
                    animationDelay: `${index * 0.04}s`,
                }}
            >
                {/* Artwork Sleeve */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '100%',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: colors.paperDarker,
                    border: `1px solid ${colors.border}`,
                    boxShadow: 'var(--shadow-ske-inset-sm)',
                }}>
                    {imageUrl ? (
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
                                transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
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
                            <svg width="28" height="28" viewBox="0 0 24 24" fill={colors.inkLight}>
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        </div>
                    )}

                    {/* Floating Action Buttons (top-right) */}
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 10,
                        opacity: hovered || isMobile ? 1 : 0,
                        transform: hovered || isMobile ? 'translateY(0) scale(1)' : 'translateY(-4px) scale(0.95)',
                        transition: 'opacity 250ms ease, transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center'
                    }}
                    onClick={e => e.stopPropagation()}
                    >
                        {onAddToQueue && !isActive && (
                            <QueueBtn song={song} onAddToQueue={onAddToQueue} success={success} size={28} />
                        )}
                        {currentUser && onAddToPlaylist && !isActive && (
                            <PlaylistBtn song={song} onAddToPlaylist={onAddToPlaylist} size={28} />
                        )}
                    </div>

                    {/* Floating circular frosted/accent play button (bottom-right) */}
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        zIndex: 10,
                        opacity: hovered || (isActive && isPlaying) || isMobile ? 1 : 0,
                        transform: hovered || (isActive && isPlaying) || isMobile ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
                        transition: 'opacity 250ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}>
                        <GridPlayCircle 
                            isActive={isActive} 
                            isPlaying={isPlaying} 
                            accentColor={colors.accent} 
                            size={36} 
                            hovered={hovered} 
                        />
                    </div>

                    {/* Bouncing EQ overlay (bottom-left) when active & playing */}
                    {isActive && isPlaying && (
                        <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            zIndex: 10,
                            background: 'rgba(0,0,0,0.65)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <NowPlayingBars color={colors.accent} size={9} />
                        </div>
                    )}
                </div>

                {/* Metadata block below */}
                <div style={{ padding: '8px 2px 2px 2px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{
                        fontFamily: fonts.primary,
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: isActive ? colors.accent : colors.ink,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.22s ease',
                        lineHeight: 1.3,
                    }}>
                        {song.name || song.title}
                    </div>
                    <div style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.72rem',
                        color: colors.inkMuted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                    }}>
                        {song.primaryArtists || 'Unknown Artist'}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className={layout === 'grid' ? 'grid-card' : 'scroll-snap-item'}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onPlay(song)}
            role="button"
            tabIndex={0}
            aria-label={`Play ${song.name}`}
            onKeyDown={e => e.key === 'Enter' && onPlay(song)}
            style={{
                flexShrink: layout === 'grid' ? 1 : 0,
                width: layout === 'grid' ? '100%' : 'clamp(124px, 37vw, 176px)',
                cursor: 'pointer',
                scrollSnapAlign: layout === 'grid' ? 'none' : 'start',
                display: 'flex',
                flexDirection: 'column',
                animation: 'cardFadeIn 0.4s ease-out both',
                animationDelay: `${index * 0.05}s`,
            }}
        >
            {/* Artwork sleeve */}
            <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '100%',
                borderRadius: '16px',
                background: colors.paperDark,
                border: isActive ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                boxShadow: isActive && isPlaying
                    ? `0 14px 28px ${colors.accent}24, var(--shadow-ske-sm)`
                    : hovered
                        ? `0 20px 40px ${colors.accent}18, 0 8px 16px var(--ske-shadow), var(--shadow-ske-md)`
                        : `0 4px 12px var(--ske-shadow), var(--shadow-ske-xs)`,
                transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                marginBottom: '12px',
                overflow: 'hidden',
            }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={song.name}
                        loading="lazy"
                        width="176"
                        height="176"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: hovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
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
                        <svg width="28" height="28" viewBox="0 0 24 24" fill={colors.inkLight}>
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}

                {/* Dark Hover overlay and Play button */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.38)',
                    opacity: hovered || (isActive && isPlaying) ? 1 : 0,
                    transition: 'opacity 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <PlayCircle isActive={isActive} isPlaying={isPlaying} accentColor={colors.accent} size={42} hovered={hovered} />
                </div>

                {/* Action buttons widget */}
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 10,
                    opacity: hovered || isMobile ? 1 : 0,
                    transition: 'opacity 0.22s ease',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center'
                }}
                onClick={e => e.stopPropagation()}
                >
                    {onAddToQueue && !isActive && (
                        <QueueBtn song={song} onAddToQueue={onAddToQueue} success={success} size={isMobile ? 20 : 28} />
                    )}
                    {currentUser && onAddToPlaylist && !isActive && (
                        <PlaylistBtn song={song} onAddToPlaylist={onAddToPlaylist} size={isMobile ? 20 : 28} />
                    )}
                </div>

                {/* Bouncing EQ overlay */}
                {isActive && isPlaying && (
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '8px' }}>
                        <NowPlayingBars color={colors.accent} size={10} />
                    </div>
                )}
            </div>

            {/* Sleeve Text Description */}
            <div style={{ padding: '0 2px' }}>
                <div style={{
                    fontFamily: fonts.primary,
                    fontWeight: 700,
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
        </div>
    )
}

// ─── DiscoverSection Export ──────────────────────────────────────────────────
export default function DiscoverSection({ songs, loading, featured = false, layout, onPlaySong, onAddToQueue }) {
    const { colors, fonts, isDark } = useTheme()
    const { currentSong, isPlaying, playlists, addSongToPlaylist, createPlaylist } = usePlayer()
    const { success, error: toastError } = useToast()
    const [activePlaylistSong, setActivePlaylistSong] = useState(null)
    const [isCreatingInModal, setIsCreatingInModal] = useState(false)
    const [newPlaylistNameInModal, setNewPlaylistNameInModal] = useState('')
    const [isCreatingPlaylistLoading, setIsCreatingPlaylistLoading] = useState(false)
    const currentUser = encryptedGetItem('saafy_user', null)
    const scrollRef = useRef(null)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    if (loading && layout === 'grid') {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(130px, 15vw, 170px), 1fr))',
                gap: isMobile ? '16px 12px' : '28px 20px',
                padding: '4px 0',
            }}>
                <SkeletonLoader type="card" count={12} />
            </div>
        )
    }

    if (loading && featured) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
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
    const handleAddToPlaylist = (song) => { setActivePlaylistSong(song) }
    const sharedProps = { 
        onPlay: handlePlay, 
        onAddToQueue, 
        onAddToPlaylist: handleAddToPlaylist,
        currentUser,
        currentSong, 
        isPlaying, 
        colors, 
        fonts, 
        success 
    }

    let content = null

    if (layout === 'grid') {
        const animStyle = `
            @keyframes cardFadeIn {
                from { opacity: 0; transform: translateY(24px) scale(0.97); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }
        `
        content = (
            <>
                <style>{animStyle}</style>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(130px, 15vw, 170px), 1fr))',
                    gap: isMobile ? '16px 12px' : '28px 20px',
                    padding: '4px 0',
                }}>
                    {songs.map((song, index) => (
                        <ScrollCard key={song.id} song={song} index={index} layout="grid" {...sharedProps} />
                    ))}
                </div>
            </>
        )
    } else if (featured && songs.length >= 5) {
        const [hero, ...rest] = songs.slice(0, 5)
        const animStyle = `
            @keyframes cardFadeIn {
                from { opacity: 0; transform: translateY(24px) scale(0.97); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }
        `

        // ── MOBILE VIEWPORT: Asymmetric Stack ──
        if (isMobile) {
            content = (
                <>
                    <style>{animStyle}</style>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Hero Capsule */}
                        <div style={{ height: 'clamp(210px, 55vw, 270px)', borderRadius: '24px', overflow: 'hidden' }}>
                            <HeroCard song={hero} {...sharedProps} />
                        </div>
                        {/* 4 Compact Glass Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '8px',
                        }}>
                            {rest.slice(0, 4).map((song, i) => (
                                <MobileCompactCard key={song.id} song={song} index={i} {...sharedProps} />
                            ))}
                        </div>
                    </div>
                </>
            )
        } else {
            // ── DESKTOP VIEWPORT: Asymmetric Editorial Layout ──
            content = (
                <>
                    <style>{animStyle}</style>
                    <div
                        className="featured-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
                            gap: '16px',
                            height: 'clamp(320px, 35vw, 460px)',
                        }}
                    >
                        {/* Primary Hero Capsule */}
                        <div className="featured-hero" style={{ height: '100%' }}>
                            <HeroCard song={hero} {...sharedProps} />
                        </div>

                        {/* Secondary 2x2 Grid of frosted cards */}
                        <div
                            className="featured-small-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gridTemplateRows: '1fr 1fr',
                                gap: '14px',
                            }}
                        >
                            {rest.slice(0, 4).map((song, i) => (
                                <SmallCard key={song.id} song={song} index={i} {...sharedProps} />
                            ))}
                        </div>
                    </div>
                </>
            )
        }
    } else {
        // ─── Horizontal Scroll snaps Carousel (Snapping Sleeve lists) ──────────
        content = (
            <div className="carousel-wrapper">
                <style>{`
                    @keyframes cardFadeIn {
                        from { opacity: 0; transform: translateY(24px) scale(0.97); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>

                {/* Left Scroll Button */}
                <button
                    className="carousel-arrow carousel-arrow-left"
                    onClick={(e) => { e.stopPropagation(); handleScroll('left'); }}
                    aria-label="Scroll left"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                <div
                    ref={scrollRef}
                    className="hide-scrollbar scroll-snap-x"
                    style={{
                        display: 'flex',
                        gap: '18px',
                        overflowX: 'auto',
                        paddingBottom: '16px',
                        paddingLeft: '4px',
                        marginLeft: '-4px',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {songs.map((song, index) => (
                        <ScrollCard key={song.id} song={song} index={index} {...sharedProps} />
                    ))}
                </div>

                {/* Right Scroll Button */}
                <button
                    className="carousel-arrow carousel-arrow-right"
                    onClick={(e) => { e.stopPropagation(); handleScroll('right'); }}
                    aria-label="Scroll right"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        )
    }

    return (
        <>
            {content}

            {/* Playlist Selection Modal Overlay */}
            {activePlaylistSong && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isDark ? 'rgba(15, 12, 11, 0.65)' : 'rgba(26, 22, 20, 0.45)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        animation: 'modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
                    }} 
                    onClick={() => {
                        setActivePlaylistSong(null)
                        setIsCreatingInModal(false)
                        setNewPlaylistNameInModal('')
                    }}
                >
                    {/* Modal Card */}
                    <div 
                        style={{
                            width: 'min(420px, 92vw)',
                            background: colors.paper,
                            borderRadius: '24px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.70)'}`,
                            boxShadow: isDark
                                ? '0 24px 64px rgba(0,0,0,0.55), inset 1px 1px 0 rgba(255,255,255,0.05)'
                                : '0 24px 64px rgba(26,22,20,0.15), inset 1px 1px 0 rgba(255,255,255,0.60)',
                            padding: '28px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            animation: 'modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                            backgroundImage: 'var(--background-image-ske-surface)',
                            position: 'relative',
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setActivePlaylistSong(null)
                                setIsCreatingInModal(false)
                                setNewPlaylistNameInModal('')
                            }}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: colors.paperDark,
                                border: `1px solid ${colors.rule}`,
                                color: colors.inkMuted,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: 'var(--shadow-ske-xs)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = colors.accent
                                e.currentTarget.style.color = '#fff'
                                e.currentTarget.style.borderColor = colors.accent
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = colors.paperDark
                                e.currentTarget.style.color = colors.inkMuted
                                e.currentTarget.style.borderColor = colors.rule
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {/* Header */}
                        <div>
                            <h3 style={{
                                fontFamily: fonts.display,
                                fontSize: '1.4rem',
                                fontWeight: 700,
                                color: colors.ink,
                                marginBottom: '6px',
                            }}>
                                Add to Playlist
                            </h3>
                            <p style={{
                                fontFamily: fonts.primary,
                                fontSize: '0.85rem',
                                color: colors.inkMuted,
                                lineHeight: '1.4',
                            }}>
                                Select a playlist to add <span style={{ color: colors.accent, fontWeight: 600 }}>{activePlaylistSong.name || activePlaylistSong.title}</span>
                            </p>
                        </div>

                        {/* Playlists List Container */}
                        <div style={{
                            maxHeight: '240px',
                            overflowY: 'auto',
                            paddingRight: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}>
                            {playlists.length === 0 ? (
                                <div style={{
                                    padding: '24px 16px',
                                    textAlign: 'center',
                                    borderRadius: '16px',
                                    background: colors.paperDark,
                                    border: `1px dashed ${colors.rule}`,
                                    color: colors.inkLight,
                                    fontSize: '0.85rem',
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 10px', opacity: 0.6 }}>
                                        <path d="M9 18H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
                                        <path d="M12 15h9" />
                                        <path d="M12 19h9" />
                                    </svg>
                                    No playlists found.<br/>Create one below to start!
                                </div>
                            ) : (
                                playlists.map((playlist) => {
                                    const hasSong = playlist.songs?.some(s => s.id === activePlaylistSong.id)
                                    return (
                                        <button
                                            key={playlist._id}
                                            disabled={hasSong}
                                            onClick={async () => {
                                                const res = await addSongToPlaylist(currentUser.id || currentUser._id, playlist._id, activePlaylistSong)
                                                if (res.success) {
                                                    success(`Added to "${playlist.name}"`)
                                                    setActivePlaylistSong(null)
                                                } else {
                                                    toastError(res.error || 'Failed to add')
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: `1px solid ${hasSong ? 'transparent' : colors.rule}`,
                                                background: hasSong ? colors.paperDarker : colors.paperDark,
                                                color: hasSong ? colors.inkLight : colors.ink,
                                                fontFamily: fonts.primary,
                                                fontSize: '0.9rem',
                                                fontWeight: 500,
                                                textAlign: 'left',
                                                cursor: hasSong ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '12px',
                                                transition: 'all 0.2s ease',
                                                boxShadow: 'var(--shadow-ske-xs)',
                                                opacity: hasSong ? 0.6 : 1,
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!hasSong) {
                                                    e.currentTarget.style.background = colors.paperDarker
                                                    e.currentTarget.style.borderColor = colors.accent
                                                    e.currentTarget.style.transform = 'translateY(-1px)'
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!hasSong) {
                                                    e.currentTarget.style.background = colors.paperDark
                                                    e.currentTarget.style.borderColor = colors.rule
                                                    e.currentTarget.style.transform = 'none'
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    background: colors.paperDarker,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    overflow: 'hidden',
                                                }}>
                                                    {playlist.image || (playlist.songs && playlist.songs.length > 0 && playlist.songs[0].image) ? (
                                                        <img src={playlist.image || playlist.songs[0].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasSong ? colors.inkLight : colors.accent} strokeWidth="2.5">
                                                            <path d="M9 18H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
                                                            <path d="M6 6H14" />
                                                            <path d="M6 10H10" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    {playlist.name}
                                                </div>
                                            </div>
                                            {hasSong ? (
                                                <span style={{ fontSize: '0.75rem', fontFamily: fonts.mono, color: colors.inkLight }}>
                                                    Already added
                                                </span>
                                            ) : (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: colors.inkLight,
                                                    fontFamily: fonts.mono,
                                                }}>
                                                    {playlist.songs?.length || 0} tracks
                                                </span>
                                            )}
                                        </button>
                                    )
                                })
                            )}
                        </div>

                        {/* Quick Create Playlist Section */}
                        <div style={{
                            marginTop: '8px',
                            borderTop: `1px solid ${colors.rule}`,
                            paddingTop: '16px',
                        }}>
                            {!isCreatingInModal ? (
                                <button
                                    onClick={() => setIsCreatingInModal(true)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: `1px dashed ${colors.accent}`,
                                        background: 'transparent',
                                        color: colors.accent,
                                        fontFamily: fonts.primary,
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = `${colors.accent}0a`
                                        e.currentTarget.style.transform = 'translateY(-1px)'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.transform = 'none'
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Create New Playlist
                                </button>
                            ) : (
                                <form 
                                    onSubmit={async (e) => {
                                        e.preventDefault()
                                        const trimmedName = newPlaylistNameInModal.trim()
                                        if (!trimmedName) return
                                        
                                        const userId = currentUser.id || currentUser._id
                                        setIsCreatingPlaylistLoading(true)
                                        try {
                                            const newPlaylist = await createPlaylist(userId, trimmedName)
                                            if (newPlaylist) {
                                                success(`Playlist "${trimmedName}" created!`)
                                                setNewPlaylistNameInModal('')
                                                setIsCreatingInModal(false)
                                                // Automatically add the song to the new playlist
                                                const res = await addSongToPlaylist(userId, newPlaylist._id || newPlaylist.id, activePlaylistSong)
                                                if (res.success) {
                                                    success(`Added to "${trimmedName}"`)
                                                    setActivePlaylistSong(null)
                                                } else {
                                                    toastError(res.error || 'Failed to add song')
                                                }
                                            } else {
                                                toastError('Failed to create playlist')
                                            }
                                        } catch (err) {
                                            toastError('An error occurred')
                                        } finally {
                                            setIsCreatingPlaylistLoading(false)
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Playlist name..."
                                        value={newPlaylistNameInModal}
                                        onChange={e => setNewPlaylistNameInModal(e.target.value)}
                                        autoFocus
                                        disabled={isCreatingPlaylistLoading}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            background: colors.paperDark,
                                            border: `1px solid ${colors.rule}`,
                                            color: colors.ink,
                                            fontFamily: fonts.primary,
                                            fontSize: '0.88rem',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onFocus={e => e.currentTarget.style.borderColor = colors.accent}
                                        onBlur={e => e.currentTarget.style.borderColor = colors.rule}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            disabled={isCreatingPlaylistLoading}
                                            onClick={() => {
                                                setIsCreatingInModal(false)
                                                setNewPlaylistNameInModal('')
                                            }}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '8px',
                                                border: `1px solid ${colors.rule}`,
                                                background: 'transparent',
                                                color: colors.inkMuted,
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isCreatingPlaylistLoading || !newPlaylistNameInModal.trim()}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: colors.accent,
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                opacity: (!newPlaylistNameInModal.trim() || isCreatingPlaylistLoading) ? 0.5 : 1,
                                            }}
                                        >
                                            {isCreatingPlaylistLoading ? 'Creating...' : 'Create & Add'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScaleUp {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    )
}