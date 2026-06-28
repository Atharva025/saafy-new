import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { encryptedGetItem } from '@/lib/encryption'
import SkeletonLoader from './SkeletonLoader'
import { adjustColorForTheme } from '@/lib/utils'
import AudioVisualizer from './AudioVisualizer'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getImageUrl(song) {
    if (!song) return ''
    const urls = new Set()
    if (Array.isArray(song.image)) {
        song.image.forEach(img => {
            if (img) {
                if (typeof img === 'string') urls.add(img)
                else if (typeof img === 'object') {
                    if (img.link && typeof img.link === 'string') urls.add(img.link)
                    if (img.url && typeof img.url === 'string') urls.add(img.url)
                }
            }
        })
    }
    if (song.imageUrl && typeof song.imageUrl === 'string') urls.add(song.imageUrl)
    const candidates = Array.from(urls).map(u => u.trim()).filter(Boolean)
    if (candidates.length === 0) return ''
    const getScore = (url) => {
        if (url.includes('500x500')) return 3
        if (url.includes('350x350')) return 2.5
        if (url.includes('250x250')) return 2.2
        if (url.includes('150x150')) return 2
        if (url.includes('50x50')) return 1
        return 1.5
    }
    candidates.sort((a, b) => getScore(b) - getScore(a))
    let bestUrl = candidates[0]
    if (bestUrl && (bestUrl.includes('150x150') || bestUrl.includes('50x50')) && !bestUrl.includes('500x500')) {
        bestUrl = bestUrl.replace('150x150', '500x500').replace('50x50', '500x500')
    }
    return bestUrl
}

// ─── Shared Keyframe Animations ───────────────────────────────────────────────
const GLOBAL_STYLES = `
    @keyframes cardFadeIn {
        from { opacity: 0; transform: translateY(16px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes glowPulse {
        from { opacity: 0.7; transform: scale(1); }
        to   { opacity: 1;   transform: scale(1.03); }
    }
    @keyframes barBounce {
        from { transform: scaleY(0.3); opacity: 0.6; }
        to   { transform: scaleY(1);   opacity: 1; }
    }
    @keyframes shimmerSlide {
        from { transform: translateX(-100%); }
        to   { transform: translateX(200%); }
    }
    @keyframes modalFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    @keyframes modalScaleUp {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes bottomSheetFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    @keyframes bottomSheetSlideUp {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
    }
    @keyframes rowSlideIn {
        from { opacity: 0; transform: translateX(-8px); }
        to   { opacity: 1; transform: translateX(0); }
    }
    
    /* Focus Ring styling for Keyboard Accessibility */
    .ske-card:focus-visible {
        outline: none !important;
        box-shadow: var(--shadow-ske-focus) !important;
        border-color: var(--color-accent) !important;
    }
`

// ─── Bouncy Equalizer Visualizer ─────────────────────────────────────────────
function NowPlayingBars({ color = '#fff', size = 14 }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${size}px` }}>
            {[0.5, 1, 0.4, 0.8, 0.6].map((h, i) => (
                <div
                    key={i}
                    style={{
                        width: '2.5px',
                        height: `${h * 100}%`,
                        background: color,
                        borderRadius: '2px',
                        animation: `barBounce 0.75s ease-in-out ${i * 0.12}s infinite alternate`,
                        transformOrigin: 'bottom',
                    }}
                />
            ))}
        </div>
    )
}

// ─── Interactive Action Buttons ──────────────────────────────────────────────
function QueueBtn({ song, onAddToQueue, size = 30 }) {
    const [added, setAdded] = useState(false)

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
            className="ske-raised-xs"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '8px',
                background: added ? 'rgba(16, 185, 129, 0.95)' : 'var(--color-overlay)',
                border: added ? '1px solid rgba(16, 185, 129, 0.7)' : '1px solid var(--color-border)',
                color: added ? '#ffffff' : 'var(--color-ink-muted)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            {added ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            )}
        </button>
    )
}

function PlaylistBtn({ song, onAddToPlaylist, size = 30 }) {
    const handleClick = (e) => {
        e.stopPropagation()
        onAddToPlaylist(song)
    }

    return (
        <button
            onClick={handleClick}
            title="Add to playlist"
            aria-label="Add to playlist"
            className="ske-raised-xs"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '8px',
                background: 'var(--color-overlay)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink-muted)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Play Button (Frosted Circular Icon) ─────────────────────────────────────
function PlayCircleBtn({ isActive, isPlaying, accentColor, size = 46, visible }) {
    const activeGradient = `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`
    const defaultGradient = 'linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 100%)'
    
    const border = isActive && isPlaying 
        ? `1.5px solid rgba(255, 255, 255, 0.45)` 
        : '1.5px solid rgba(255, 255, 255, 0.35)'
        
    const shadow = isActive && isPlaying
        ? `0 8px 24px ${accentColor}60, inset 0 1.5px 2px rgba(255, 255, 255, 0.3)`
        : '0 12px 30px rgba(0, 0, 0, 0.35), inset 0 1.5px 2px rgba(255, 255, 255, 0.25)'

    return (
        <div
            className="ske-raised"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: isActive && isPlaying ? activeGradient : defaultGradient,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: shadow,
                color: '#ffffff',
                transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(6px)',
                opacity: visible ? 1 : 0,
                cursor: 'pointer',
                transition: 'all 350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)'
                e.currentTarget.style.boxShadow = isActive && isPlaying
                    ? `0 12px 28px ${accentColor}80, inset 0 2px 3px rgba(255, 255, 255, 0.45)`
                    : '0 16px 36px rgba(0, 0, 0, 0.45), inset 0 2px 3px rgba(255, 255, 255, 0.35)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(6px)'
                e.currentTarget.style.boxShadow = shadow
            }}
        >
            {isActive && isPlaying ? (
                <svg width={size * 0.35} height={size * 0.35} viewBox="0 0 24 24" fill="currentColor">
                    <rect x="5" y="4" width="4" height="16" rx="1.5" />
                    <rect x="15" y="4" width="4" height="16" rx="1.5" />
                </svg>
            ) : (
                <svg width={size * 0.35} height={size * 0.35} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}>
                    <path d="M7 4.25c-1.105 0-2 .895-2 2v11.5c0 1.105.895 2 2 2h.2c.45 0 .88-.17 1.2-.5l7.5-5.75c.8-.62.8-1.88 0-2.5L8.4 5.75c-.32-.33-.75-.5-1.2-.5H7z" />
                </svg>
            )}
        </div>
    )
}

// ─── Desktop Unified Options Trigger Button ──────────────────────────────────
function MoreOptionsBtn({ onOpenMenu, size = 30 }) {
    return (
        <button
            onClick={onOpenMenu}
            title="More Options"
            aria-label="More Options"
            className="ske-raised-xs"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '8px',
                background: 'var(--color-overlay)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink-muted)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" />
            </svg>
        </button>
    )
}

// ─── Cinematic Hero Card ──────────────────────────────────────────────────────
function CinematicHeroCard({ song, onPlay, onOpenDesktopMenu, currentUser, currentSong, isPlaying, colors, fonts, dominantColor, isDark, onOpenMenu }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    const accentHex = dominantColor
        ? (adjustColorForTheme(dominantColor, isDark)?.hex || colors.accent)
        : colors.accent
    const auraColor = dominantColor
        ? (adjustColorForTheme(dominantColor, isDark)?.rgba(isDark ? 0.3 : 0.18) || `${colors.accent}33`)
        : `${colors.accent}33`

    return (
        <div
            style={{ height: '100%', position: 'relative', isolation: 'isolate' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Soft Ambient aura */}
            <div style={{
                position: 'absolute',
                inset: '-12px',
                borderRadius: '32px',
                background: `radial-gradient(ellipse at 50% 65%, ${auraColor} 0%, transparent 75%)`,
                filter: 'blur(40px)',
                zIndex: -1,
                opacity: isActive ? 1 : hovered ? 0.8 : 0.4,
                transition: 'opacity 600ms ease, background 600ms ease',
                pointerEvents: 'none',
            }} />

            {/* Card Frame */}
            <div
                className="ske-card ske-textured"
                tabIndex={0}
                aria-label={`Play ${song.name}`}
                onKeyDown={e => e.key === 'Enter' && onPlay(song)}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: isMobile ? '20px' : '24px',
                    overflow: 'hidden',
                    cursor: 'default',
                    border: isActive ? `2px solid ${accentHex}` : undefined,
                    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 380ms cubic-bezier(0.16, 1, 0.3, 1)',
                    animation: 'cardFadeIn 0.5s ease-out both',
                }}
            >
                {/* Artwork Area (Hotspot for playing) */}
                <div
                    onClick={() => onPlay(song)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        cursor: 'pointer',
                    }}
                >
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={song.name}
                            loading="lazy"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: hovered ? 'scale(1.04)' : 'scale(1)',
                                transition: 'transform 600ms var(--ease-premium)',
                            }}
                        />
                    )}
                    {/* Cover Gradient Scrim */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.08) 100%)',
                    }} />
                </div>

                {/* Shimmer Sheen */}
                {hovered && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.06) 50%, transparent 65%)',
                        animation: 'shimmerSlide 1.2s ease-in-out',
                        pointerEvents: 'none',
                    }} />
                )}

                {/* Badges Row */}
                <div style={{
                    position: 'absolute',
                    top: isMobile ? '12px' : '18px',
                    left: isMobile ? '12px' : '18px',
                    right: isMobile ? '12px' : '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 10,
                    pointerEvents: 'none',
                }}>
                    {isActive && isPlaying ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: accentHex,
                            borderRadius: '99px',
                            padding: '4px 10px',
                            boxShadow: `0 4px 14px ${accentHex}50`,
                            animation: 'glowPulse 2.5s infinite alternate',
                        }}>
                            <NowPlayingBars color="#fff" size={10} />
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.58rem',
                                color: '#fff',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}>Live</span>
                        </div>
                    ) : (
                        <div style={{
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: '99px',
                            padding: '4px 10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}>
                            <span style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.58rem',
                                color: 'rgba(255,255,255,0.9)',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}>Spotlight</span>
                        </div>
                    )}
                </div>

                {/* Bottom Frosted Info Slate (Clicking text does not play) */}
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        margin: isMobile ? '8px' : '14px',
                        padding: isMobile ? '12px 14px' : '16px 20px',
                        borderRadius: isMobile ? '12px' : '16px',
                        background: 'var(--color-overlay)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'default',
                    }}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: fonts.display,
                            fontWeight: 800,
                            fontSize: 'var(--text-lg)',
                            color: 'var(--color-ink)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.25,
                            marginBottom: '2px',
                        }}>
                            {song.name}
                        </div>
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-ink-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.01em',
                        }}>
                            {song.primaryArtists}
                        </div>
                    </div>

                    {/* Action Hotspots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isMobile && (
                            <MoreOptionsBtn onOpenMenu={(e) => onOpenDesktopMenu(e, song)} size={36} />
                        )}
                        {isMobile && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenMenu(song) }}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--color-paper-dark)', border: '1px solid var(--color-border)',
                                    color: 'var(--color-ink-muted)', cursor: 'pointer',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
                                </svg>
                            </button>
                        )}
                        <div onClick={() => onPlay(song)} style={{ cursor: 'pointer' }}>
                            <PlayCircleBtn
                                isActive={isActive}
                                isPlaying={isPlaying}
                                accentColor={accentHex}
                                size={isMobile ? 38 : 44}
                                visible={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Editorial Sidebar Row ─────────────────────────────────────────────────────
function EditorialSidebarRow({ song, index, onPlay, onOpenDesktopMenu, currentUser, currentSong, isPlaying, colors, fonts, success, dominantColor, isDark, onOpenMenu, isMobile }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)
    const num = String(index + 1).padStart(2, '0')

    const accentHex = dominantColor
        ? (adjustColorForTheme(dominantColor, isDark)?.hex || colors.accent)
        : colors.accent

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            role="button"
            tabIndex={0}
            aria-label={`Play ${song.name}`}
            onKeyDown={e => e.key === 'Enter' && onPlay(song)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 10px',
                borderRadius: '12px',
                background: isActive
                    ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
                    : hovered
                        ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')
                        : 'transparent',
                borderLeft: isActive ? `3px solid ${accentHex}` : '3px solid transparent',
                cursor: 'default',
                transition: 'all 200ms ease',
                animation: 'rowSlideIn 0.3s ease-out both',
                animationDelay: `${index * 0.05}s`,
            }}
        >
            {/* Number Index */}
            <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                {isActive && isPlaying ? (
                    <NowPlayingBars color={accentHex} size={11} />
                ) : (
                    <span style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isActive ? accentHex : 'var(--color-ink-light)',
                    }}>{num}</span>
                )}
            </div>

            {/* Thumbnail Hotspot for Play */}
            <div
                onClick={() => onPlay(song)}
                className="ske-art"
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                    cursor: 'pointer',
                }}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper-darker)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-ink-light)">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}
                {/* Visualizer bars over thumbnail when active */}
                {isActive && isPlaying && (
                    <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <NowPlayingBars color="#fff" size={10} />
                    </div>
                )}
            </div>

            {/* Meta (Inert for play) */}
            <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
                <div style={{
                    fontFamily: fonts.primary,
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    color: isActive ? accentHex : 'var(--color-ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.25,
                    marginBottom: '1px',
                }}>
                    {song.name}
                </div>
                <div style={{
                    fontFamily: fonts.mono,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-ink-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {song.primaryArtists}
                </div>
            </div>

            {/* Action options */}
            <div style={{
                display: 'flex', gap: '6px', alignItems: 'center',
                opacity: hovered || isActive || isMobile ? 1 : 0,
                transition: 'opacity 0.2s ease',
            }} onClick={e => e.stopPropagation()}>
                {isMobile ? (
                    <button onClick={() => onOpenMenu(song)} style={{ color: 'var(--color-ink-muted)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
                        </svg>
                    </button>
                ) : (
                    <MoreOptionsBtn onOpenMenu={(e) => onOpenDesktopMenu(e, song)} size={28} />
                )}
            </div>
        </div>
    )
}

// ─── Mosaic Spotlight Card ───────────────────────────────────────────────────
function MosaicSpotlightCard({ song, onPlay, onOpenDesktopMenu, currentUser, currentSong, isPlaying, colors, fonts, dominantColor, isDark, onOpenMenu, isMobile }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)

    const accentHex = dominantColor
        ? (adjustColorForTheme(dominantColor, isDark)?.hex || colors.accent)
        : colors.accent
    const auraColor = dominantColor
        ? (adjustColorForTheme(dominantColor, isDark)?.rgba(isDark ? 0.35 : 0.2) || `${colors.accent}33`)
        : `${colors.accent}33`

    return (
        <div
            className="ske-card ske-lift ske-textured"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            tabIndex={0}
            aria-label={`Play ${song.name}`}
            onKeyDown={e => e.key === 'Enter' && onPlay(song)}
            style={{
                height: '100%',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'default',
                padding: '16px',
                border: isActive ? `2px solid ${accentHex}` : undefined,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            {/* Artwork Backdrop (Play hotspot) */}
            <div
                onClick={() => onPlay(song)}
                style={{
                    position: 'absolute', inset: 0, cursor: 'pointer', zIndex: -1,
                }}
            >
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            transform: hovered ? 'scale(1.04)' : 'scale(1)',
                            transition: 'transform 0.5s var(--ease-premium)',
                        }}
                    />
                )}
                {/* Scrim */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
                }} />
            </div>

            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="ske-pill" style={{
                    fontFamily: fonts.mono,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: 'rgba(0,0,0,0.38)',
                    border: '1px solid rgba(255,255,255,0.15)',
                }}>Featured Spotlight</span>

                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                    {!isMobile && (
                        <MoreOptionsBtn onOpenMenu={(e) => onOpenDesktopMenu(e, song)} size={28} />
                    )}
                    {isMobile && (
                        <button onClick={() => onOpenMenu(song)} style={{ color: '#fff' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Center Play Button */}
            <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <PlayCircleBtn
                    isActive={isActive}
                    isPlaying={isPlaying}
                    accentColor={accentHex}
                    size={48}
                    visible={hovered || (isActive && isPlaying)}
                />
            </div>

            {/* Bottom meta (Inert) */}
            <div onClick={e => e.stopPropagation()}>
                {isActive && isPlaying && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <NowPlayingBars color={accentHex} size={10} />
                        <span style={{ fontFamily: fonts.mono, fontSize: '0.6rem', color: accentHex, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Playing</span>
                    </div>
                )}
                <div style={{
                    fontFamily: fonts.display,
                    fontWeight: 800,
                    fontSize: 'var(--text-lg)',
                    color: '#ffffff',
                    lineHeight: 1.25,
                    marginBottom: '3px',
                }}>
                    {song.name}
                </div>
                <div style={{
                    fontFamily: fonts.mono,
                    fontSize: 'var(--text-xs)',
                    color: 'rgba(255,255,255,0.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {song.primaryArtists}
                </div>
            </div>
        </div>
    )
}

// ─── Mosaic Standard Card ────────────────────────────────────────────────────
function MosaicStandardCard({ song, index, onPlay, onOpenDesktopMenu, currentUser, currentSong, isPlaying, colors, fonts, success, onOpenMenu }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const accentHex = colors.accent

    return (
        <div
            className="ske-card ske-lift ske-textured"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            tabIndex={0}
            aria-label={`Play ${song.name}`}
            onKeyDown={e => e.key === 'Enter' && onPlay(song)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '12px',
                borderRadius: '20px',
                cursor: 'default',
                border: isActive ? `2px solid ${accentHex}` : undefined,
                animation: 'cardFadeIn 0.4s ease-out both',
                animationDelay: `${index * 0.04}s`,
            }}
        >
            {/* Artwork Play hotspot */}
            <div
                onClick={() => onPlay(song)}
                className="ske-art"
                style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '10px',
                    cursor: 'pointer',
                }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={song.name}
                        loading="lazy"
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            transform: hovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.5s var(--ease-premium)',
                        }}
                    />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper-darker)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-ink-light)">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}

                {/* Play Button Overlay */}
                {!isMobile && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        opacity: hovered || (isActive && isPlaying) ? 1 : 0,
                        transition: 'opacity 0.25s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <PlayCircleBtn
                            isActive={isActive}
                            isPlaying={isPlaying}
                            accentColor={accentHex}
                            size={38}
                            visible={hovered || (isActive && isPlaying)}
                        />
                    </div>
                )}

                {/* EQ Bars */}
                {isActive && isPlaying && (
                    <div style={{
                        position: 'absolute', bottom: '8px', left: '8px', zIndex: 10,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        padding: '4px 6px', borderRadius: '6px',
                    }}>
                        <NowPlayingBars color={accentHex} size={9} />
                    </div>
                )}
            </div>

            {/* Info row (Inert for play) */}
            <div
                onClick={e => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', minWidth: 0 }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontFamily: fonts.primary,
                        fontWeight: 700,
                        fontSize: 'var(--text-sm)',
                        color: isActive ? accentHex : 'var(--color-ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                        marginBottom: '2px',
                    }}>
                        {song.name || song.title}
                    </div>
                    <div style={{
                        fontFamily: fonts.mono,
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-ink-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.01em',
                    }}>
                        {song.primaryArtists || 'Unknown Artist'}
                    </div>
                </div>

                {/* Actions (visible on hover) */}
                <div style={{
                    display: 'flex', gap: '4px', alignItems: 'center',
                    opacity: hovered || isMobile ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                }}>
                    {isMobile ? (
                        <button onClick={() => onOpenMenu(song)} style={{ color: 'var(--color-ink-muted)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
                            </svg>
                        </button>
                    ) : (
                        <MoreOptionsBtn onOpenMenu={(e) => onOpenDesktopMenu(e, song)} size={26} />
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Premium Carousel Card ─────────────────────────────────────────────────────
function CarouselCard({ song, index, onPlay, onOpenDesktopMenu, currentUser, currentSong, isPlaying, colors, fonts, success, onOpenMenu }) {
    const [hovered, setHovered] = useState(false)
    const isActive = currentSong?.id === song.id
    const imageUrl = getImageUrl(song)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const accentHex = colors.accent

    return (
        <div
            className="scroll-snap-item ske-card ske-lift ske-textured"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            tabIndex={0}
            aria-label={`Play ${song.name}`}
            onKeyDown={e => e.key === 'Enter' && onPlay(song)}
            style={{
                flexShrink: 0,
                width: isMobile ? '144px' : 'clamp(140px, 16vw, 180px)',
                padding: '12px',
                borderRadius: '20px',
                cursor: 'default',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                border: isActive ? `2px solid ${accentHex}` : undefined,
                animation: 'cardFadeIn 0.4s ease-out both',
                animationDelay: `${index * 0.05}s`,
            }}
        >
            {/* Artwork wrapper with play hotspot */}
            <div
                onClick={() => onPlay(song)}
                className="ske-art"
                style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '10px',
                    cursor: 'pointer',
                }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={song.name}
                        loading="lazy"
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            transform: hovered ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.5s var(--ease-premium)',
                        }}
                    />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper-darker)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-ink-light)">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                )}

                {/* Play Button Overlay */}
                {!isMobile && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        opacity: hovered || (isActive && isPlaying) ? 1 : 0,
                        transition: 'opacity 0.25s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <PlayCircleBtn
                            isActive={isActive}
                            isPlaying={isPlaying}
                            accentColor={accentHex}
                            size={38}
                            visible={hovered || (isActive && isPlaying)}
                        />
                    </div>
                )}

                {/* EQ Bars */}
                {isActive && isPlaying && (
                    <div style={{
                        position: 'absolute', bottom: '8px', left: '8px', zIndex: 10,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        padding: '4px 6px', borderRadius: '6px',
                    }}>
                        <NowPlayingBars color={accentHex} size={9} />
                    </div>
                )}
            </div>

            {/* Info row (Inert click) */}
            <div
                onClick={e => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', minWidth: 0 }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontFamily: fonts.primary,
                        fontWeight: 700,
                        fontSize: 'var(--text-sm)',
                        color: isActive ? accentHex : 'var(--color-ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                        marginBottom: '3px',
                    }}>
                        {song.name || song.title}
                    </div>
                    <div style={{
                        fontFamily: fonts.mono,
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-ink-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.01em',
                    }}>
                        {song.primaryArtists || 'Unknown Artist'}
                    </div>
                </div>

                {/* Actions (visible on hover) */}
                <div style={{
                    display: 'flex', gap: '4px', alignItems: 'center',
                    opacity: hovered || isMobile ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                }}>
                    {isMobile ? (
                        <button onClick={() => onOpenMenu(song)} style={{ color: 'var(--color-ink-muted)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
                            </svg>
                        </button>
                    ) : (
                        <MoreOptionsBtn onOpenMenu={(e) => onOpenDesktopMenu(e, song)} size={24} />
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── DiscoverSection Export ───────────────────────────────────────────────────
export default function DiscoverSection({ songs, loading, featured = false, layout, onPlaySong, onAddToQueue }) {
    const { colors, fonts, isDark } = useTheme()
    const { currentSong, isPlaying, playlists, addSongToPlaylist, createPlaylist, dominantColor } = usePlayer()
    const { success, error: toastError } = useToast()
    const [activePlaylistSong, setActivePlaylistSong] = useState(null)
    const [activeMenuSong, setActiveMenuSong] = useState(null)
    const [isCreatingInModal, setIsCreatingInModal] = useState(false)
    const [newPlaylistNameInModal, setNewPlaylistNameInModal] = useState('')
    const [isCreatingPlaylistLoading, setIsCreatingPlaylistLoading] = useState(false)
    const currentUser = encryptedGetItem('saafy_user', null)

    // Carousel Drag-to-Scroll Refs & State
    const scrollRef = useRef(null)
    const [scrollPercent, setScrollPercent] = useState(0)
    const isDragging = useRef(false)
    const startX = useRef(0)
    const scrollLeftVal = useRef(0)
    const hasMoved = useRef(false)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    // Desktop Options Context Dropdown State
    const [desktopMenuSong, setDesktopMenuSong] = useState(null)
    const [desktopMenuPos, setDesktopMenuPos] = useState({ top: 0, left: 0 })

    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -420 : 420
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    const updateScrollProgress = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            const maxScroll = scrollWidth - clientWidth
            if (maxScroll > 0) {
                setScrollPercent(scrollLeft / maxScroll)
            }
        }
    }

    // Drag-to-scroll event handlers
    const handleDragStart = (e) => {
        if (isMobile || !scrollRef.current) return
        isDragging.current = true
        hasMoved.current = false
        startX.current = e.pageX - scrollRef.current.offsetLeft
        scrollLeftVal.current = scrollRef.current.scrollLeft
        scrollRef.current.style.scrollBehavior = 'auto'
        scrollRef.current.style.cursor = 'grabbing'
    }

    const handleDragEnd = () => {
        if (!isDragging.current || !scrollRef.current) return
        isDragging.current = false
        scrollRef.current.style.scrollBehavior = 'smooth'
        scrollRef.current.style.cursor = 'pointer'
        // Delay resetting hasMoved slightly to prevent click event trigger
        setTimeout(() => {
            hasMoved.current = false
        }, 50)
    }

    const handleDragMove = (e) => {
        if (!isDragging.current || !scrollRef.current) return
        e.preventDefault()
        const x = e.pageX - scrollRef.current.offsetLeft
        const walk = (x - startX.current) * 1.6 // speed modifier
        if (Math.abs(walk) > 6) {
            hasMoved.current = true
        }
        scrollRef.current.scrollLeft = scrollLeftVal.current - walk
    }

    useEffect(() => {
        const el = scrollRef.current
        if (el) {
            el.addEventListener('scroll', updateScrollProgress)
            updateScrollProgress()
        }
        return () => {
            if (el) el.removeEventListener('scroll', updateScrollProgress)
        }
    }, [songs, loading])

    // ── Open desktop menu ──
    const handleOpenDesktopMenu = (e, song) => {
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        
        let top = rect.bottom + 6
        // Flip menu upwards if it overflows the viewport bottom
        if (rect.bottom + 160 > window.innerHeight) {
            top = rect.top - 160 - 6
        }
        
        const left = Math.max(12, rect.right - 160)
        
        setDesktopMenuPos({ top, left })
        setDesktopMenuSong(song)
    }

    // ── Loading States ──
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

    // Elegant empty/error state instead of returning null
    if (!songs || songs.length === 0) {
        return (
            <div
                className="ske-card ske-textured"
                style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    borderRadius: '20px',
                    color: 'var(--color-ink-muted)',
                    fontFamily: fonts.primary,
                    fontSize: '0.88rem',
                    border: '1px dashed var(--color-border)',
                    background: 'var(--color-overlay)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                No recommendations found for this category at the moment. Try checking your internet connection or exploring other music choices!
            </div>
        )
    }

    const handlePlay = (song) => {
        if (hasMoved.current) return // Prevent playing if user was just swiping carousel
        if (onPlaySong) onPlaySong(song)
    }
    const handleAddToPlaylist = (song) => { setActivePlaylistSong(song) }

    const sharedProps = {
        onPlay: handlePlay,
        onOpenDesktopMenu: handleOpenDesktopMenu,
        currentUser,
        currentSong,
        isPlaying,
        colors,
        fonts,
        success,
        dominantColor,
        isDark,
        onOpenMenu: setActiveMenuSong,
    }

    let content = null

    // ── GRID LAYOUT — Mosaic Discovery Grid ──────────────────────────────────
    if (layout === 'grid') {
        const [spotlight, ...rest] = songs
        content = (
            <>
                <style>{GLOBAL_STYLES}</style>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile
                        ? 'repeat(2, 1fr)'
                        : 'repeat(auto-fill, minmax(clamp(140px, 13vw, 180px), 1fr))',
                    gap: isMobile ? '12px' : '24px',
                    padding: '4px 0',
                }}>
                    {/* Spotlight card (2×2) — desktop only */}
                    {!isMobile && spotlight && (
                        <div style={{ gridColumn: 'span 2', gridRow: 'span 2' }}>
                            <MosaicSpotlightCard song={spotlight} {...sharedProps} />
                        </div>
                    )}

                    {/* Mobile spotlight representation */}
                    {isMobile && spotlight && (
                        <MosaicStandardCard song={spotlight} index={0} {...sharedProps} />
                    )}

                    {/* Rest of the items */}
                    {rest.map((song, index) => (
                        <MosaicStandardCard
                            key={song.id}
                            song={song}
                            index={isMobile ? index + 1 : index}
                            {...sharedProps}
                        />
                    ))}
                </div>
            </>
        )

        // ── FEATURED LAYOUT — Cinematic Editorial Stage ───────────────────────────
    } else if (featured && songs.length >= 5) {
        const [hero, ...rest] = songs.slice(0, 8)

        if (isMobile) {
            content = (
                <>
                    <style>{GLOBAL_STYLES}</style>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ height: 'clamp(230px, 60vw, 300px)' }}>
                            <CinematicHeroCard song={hero} {...sharedProps} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {rest.slice(0, 5).map((song, i) => (
                                <EditorialSidebarRow
                                    key={song.id}
                                    song={song}
                                    index={i}
                                    isMobile={true}
                                    {...sharedProps}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )
        } else {
            content = (
                <>
                    <style>{GLOBAL_STYLES}</style>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
                        gap: '24px',
                        height: 'clamp(340px, 36vw, 480px)',
                    }}>
                        {/* Cinematic Hero */}
                        <CinematicHeroCard song={hero} {...sharedProps} />

                        {/* Editorial List Panel */}
                        <div
                            className="ske-card ske-textured"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                padding: '20px',
                                borderRadius: '24px',
                                background: 'var(--color-overlay)',
                                border: '1px solid var(--color-border)',
                                boxSizing: 'border-box',
                            }}
                        >
                            {/* Head Label */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '16px',
                            }}>
                                <span className="ske-pill" style={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    color: colors.accent,
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    background: 'var(--color-overlay)',
                                    border: '1px solid var(--color-border)',
                                    boxShadow: 'var(--shadow-ske-xs)',
                                }}>Trending</span>
                                <span style={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.62rem',
                                    color: 'var(--color-ink-muted)',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}>Discover More</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
                                {rest.slice(0, currentSong && isPlaying ? 5 : 6).map((song, i) => (
                                    <EditorialSidebarRow
                                        key={song.id}
                                        song={song}
                                        index={i}
                                        isMobile={false}
                                        {...sharedProps}
                                    />
                                ))}

                                {currentSong && isPlaying && (
                                    <div style={{
                                        marginTop: 'auto',
                                        padding: '10px 12px',
                                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        borderRadius: '16px',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                                        animation: 'rowSlideIn 0.3s ease-out both'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: colors.accent,
                                            boxShadow: `0 0 10px ${colors.accent}`,
                                            flexShrink: 0,
                                            animation: 'pulse 1.5s infinite alternate'
                                        }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '9px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: fonts.mono }}>
                                                Live Session
                                            </div>
                                            <div style={{ fontSize: '11.5px', fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px', fontFamily: fonts.primary }}>
                                                {currentSong.name}
                                            </div>
                                        </div>
                                        <div style={{ width: '70px', height: '16px', flexShrink: 0 }}>
                                            <AudioVisualizer compact={true} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )
        }

        // ── CAROUSEL LAYOUT — Premium Horizontal Scroll ───────────────────────────
    } else {
        content = (
            <>
                <style>{GLOBAL_STYLES}</style>
                <div
                    className="carousel-wrapper"
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                >
                    {/* Left Scroll Button */}
                    <button
                        className="carousel-arrow carousel-arrow-left"
                        onClick={(e) => { e.stopPropagation(); handleScroll('left') }}
                        aria-label="Scroll left"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    {/* Scroll Track */}
                    <div
                        ref={scrollRef}
                        className="hide-scrollbar scroll-snap-x"
                        onMouseDown={handleDragStart}
                        onMouseMove={handleDragMove}
                        style={{
                            display: 'flex',
                            gap: isMobile ? '12px' : '18px',
                            overflowX: 'auto',
                            paddingBottom: '16px',
                            paddingLeft: '4px',
                            marginLeft: '-4px',
                            WebkitOverflowScrolling: 'touch',
                            cursor: 'pointer',
                        }}
                    >
                        {songs.map((song, index) => (
                            <CarouselCard
                                key={song.id}
                                song={song}
                                index={index}
                                {...sharedProps}
                            />
                        ))}
                    </div>

                    {/* Right Scroll Button */}
                    <button
                        className="carousel-arrow carousel-arrow-right"
                        onClick={(e) => { e.stopPropagation(); handleScroll('right') }}
                        aria-label="Scroll right"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    {/* Scroll Progress Bar Indicator */}
                    {!isMobile && (
                        <div
                            className="ske-recessed"
                            style={{
                                height: '3px',
                                width: '120px',
                                margin: '8px auto 0 auto',
                                borderRadius: '99px',
                                position: 'relative',
                                overflow: 'hidden',
                                opacity: 0.7,
                            }}
                        >
                            <div
                                className="ske-progress-fill"
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    height: '100%',
                                    width: '30px', // thumb width
                                    borderRadius: '99px',
                                    background: colors.accent,
                                    transform: `translateX(${scrollPercent * 90}px)`, // 90px max translation
                                    transition: 'transform 0.1s ease-out',
                                }}
                            />
                        </div>
                    )}
                </div>
            </>
        )
    }

    return (
        <>
            {content}

            {/* ── Playlist Selection Modal ── */}
            {activePlaylistSong && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: isDark ? 'rgba(15, 12, 11, 0.65)' : 'rgba(26, 22, 20, 0.45)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 99999,
                        animation: 'modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
                    }}
                    onClick={() => {
                        setActivePlaylistSong(null)
                        setIsCreatingInModal(false)
                        setNewPlaylistNameInModal('')
                    }}
                >
                    <div
                        className="ske-float ske-textured"
                        style={{
                            width: 'min(420px, 92vw)',
                            borderRadius: '24px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.70)'}`,
                            padding: '28px',
                            display: 'flex', flexDirection: 'column', gap: '20px',
                            animation: 'modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
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
                                position: 'absolute', top: '20px', right: '20px',
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: colors.paperDark, border: `1px solid ${colors.rule}`,
                                color: colors.inkMuted, cursor: 'pointer',
                                transition: 'all 0.2s ease', boxShadow: 'var(--shadow-ske-xs)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = colors.accent; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = colors.accent }}
                            onMouseLeave={e => { e.currentTarget.style.background = colors.paperDark; e.currentTarget.style.color = colors.inkMuted; e.currentTarget.style.borderColor = colors.rule }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {/* Header */}
                        <div>
                            <h3 style={{ fontFamily: fonts.display, fontSize: '1.4rem', fontWeight: 700, color: colors.ink, marginBottom: '6px' }}>
                                Add to Playlist
                            </h3>
                            <p style={{ fontFamily: fonts.primary, fontSize: '0.85rem', color: colors.inkMuted, lineHeight: '1.4' }}>
                                Select a playlist to add <span style={{ color: colors.accent, fontWeight: 600 }}>{activePlaylistSong.name || activePlaylistSong.title}</span>
                            </p>
                        </div>

                        {/* Playlists List */}
                        <div style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {playlists.length === 0 ? (
                                <div style={{ padding: '24px 16px', textAlign: 'center', borderRadius: '16px', background: colors.paperDark, border: `1px dashed ${colors.rule}`, color: colors.inkLight, fontSize: '0.85rem' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 10px', opacity: 0.6 }}>
                                        <path d="M9 18H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
                                        <path d="M12 15h9" /><path d="M12 19h9" />
                                    </svg>
                                    No playlists found.<br />Create one below to start!
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
                                                width: '100%', padding: '12px 16px', borderRadius: '12px',
                                                border: `1px solid ${hasSong ? 'transparent' : colors.rule}`,
                                                background: hasSong ? colors.paperDarker : colors.paperDark,
                                                color: hasSong ? colors.inkLight : colors.ink,
                                                fontFamily: fonts.primary, fontSize: '0.9rem', fontWeight: 500,
                                                textAlign: 'left', cursor: hasSong ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                                                transition: 'all 0.2s ease', boxShadow: 'var(--shadow-ske-xs)',
                                                opacity: hasSong ? 0.6 : 1,
                                            }}
                                            onMouseEnter={(e) => { if (!hasSong) { e.currentTarget.style.background = colors.paperDarker; e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                                            onMouseLeave={(e) => { if (!hasSong) { e.currentTarget.style.background = colors.paperDark; e.currentTarget.style.borderColor = colors.rule; e.currentTarget.style.transform = 'none' } }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: colors.paperDarker, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                                    {playlist.image || (playlist.songs && playlist.songs.length > 0 && playlist.songs[0].image) ? (
                                                        <img src={playlist.image || playlist.songs[0].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasSong ? colors.inkLight : colors.accent} strokeWidth="2.5">
                                                            <path d="M9 18H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
                                                            <path d="M6 6H14" /><path d="M6 10H10" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    {playlist.name}
                                                </div>
                                            </div>
                                            {hasSong ? (
                                                <span style={{ fontSize: '0.75rem', fontFamily: fonts.mono, color: colors.inkLight }}>Already added</span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: colors.inkLight, fontFamily: fonts.mono }}>{playlist.songs?.length || 0} tracks</span>
                                            )}
                                        </button>
                                    )
                                })
                            )}
                        </div>

                        {/* Quick Create Playlist */}
                        <div style={{ marginTop: '8px', borderTop: `1px solid ${colors.rule}`, paddingTop: '16px' }}>
                            {!isCreatingInModal ? (
                                <button
                                    onClick={() => setIsCreatingInModal(true)}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: `1px dashed ${colors.accent}`, background: 'transparent',
                                        color: colors.accent, fontFamily: fonts.primary, fontSize: '0.88rem',
                                        fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = `${colors.accent}0a`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
                                    style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Playlist name..."
                                        value={newPlaylistNameInModal}
                                        onChange={e => setNewPlaylistNameInModal(e.target.value)}
                                        autoFocus
                                        disabled={isCreatingPlaylistLoading}
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: '10px',
                                            background: colors.paperDark, border: `1px solid ${colors.rule}`,
                                            color: colors.ink, fontFamily: fonts.primary, fontSize: '0.88rem',
                                            outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                                        }}
                                        onFocus={e => e.currentTarget.style.borderColor = colors.accent}
                                        onBlur={e => e.currentTarget.style.borderColor = colors.rule}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            disabled={isCreatingPlaylistLoading}
                                            onClick={() => { setIsCreatingInModal(false); setNewPlaylistNameInModal('') }}
                                            style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${colors.rule}`, background: 'transparent', color: colors.inkMuted, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}
                                        >Cancel</button>
                                        <button
                                            type="submit"
                                            disabled={isCreatingPlaylistLoading || !newPlaylistNameInModal.trim()}
                                            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: colors.accent, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: (!newPlaylistNameInModal.trim() || isCreatingPlaylistLoading) ? 0.5 : 1 }}
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

            {/* ── Desktop Inline Action Dropdown Menu ── */}
            {!isMobile && desktopMenuSong && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 999999,
                    }}
                    onClick={() => setDesktopMenuSong(null)}
                >
                    <div
                        className="ske-float ske-textured animate-fadeIn"
                        style={{
                            position: 'absolute',
                            top: `${desktopMenuPos.top}px`,
                            left: `${desktopMenuPos.left}px`,
                            width: '160px',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)',
                            boxShadow: 'var(--shadow-ske-md)',
                            padding: '6px',
                            display: 'flex', flexDirection: 'column', gap: '2px',
                            animation: 'modalScaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) both',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => { handlePlay(desktopMenuSong); setDesktopMenuSong(null) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 10px', borderRadius: '8px',
                                width: '100%', textAlign: 'left',
                                fontFamily: fonts.primary, fontSize: '0.82rem',
                                cursor: 'pointer', color: 'var(--color-ink)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper-dark)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            Play Now
                        </button>
                        {onAddToQueue && (
                            <button
                                onClick={() => { onAddToQueue(desktopMenuSong); setDesktopMenuSong(null) }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 10px', borderRadius: '8px',
                                    width: '100%', textAlign: 'left',
                                    fontFamily: fonts.primary, fontSize: '0.82rem',
                                    cursor: 'pointer', color: 'var(--color-ink)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper-dark)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Add to Queue
                            </button>
                        )}
                        {currentUser && (
                            <button
                                onClick={() => { handleAddToPlaylist(desktopMenuSong); setDesktopMenuSong(null) }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 10px', borderRadius: '8px',
                                    width: '100%', textAlign: 'left',
                                    fontFamily: fonts.primary, fontSize: '0.82rem',
                                    cursor: 'pointer', color: 'var(--color-ink)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-paper-dark)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                                    <circle cx="3" cy="6" r="1.2" fill="currentColor" /><circle cx="3" cy="12" r="1.2" fill="currentColor" /><circle cx="3" cy="18" r="1.2" fill="currentColor" />
                                    <line x1="19" y1="15" x2="19" y2="21" /><line x1="16" y1="18" x2="22" y2="18" />
                                </svg>
                                Add to Playlist
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* ── Mobile Actions Bottom Sheet ── */}
            {isMobile && activeMenuSong && createPortal(
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        zIndex: 999999, display: 'flex', alignItems: 'flex-end',
                        animation: 'bottomSheetFadeIn 0.25s ease-out',
                    }}
                    onClick={() => setActiveMenuSong(null)}
                >
                    <div
                        className="ske-float ske-textured"
                        style={{
                            width: '100%',
                            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                            borderTop: `1px solid ${colors.border}`,
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
                            padding: '16px 20px 24px 20px',
                            display: 'flex', flexDirection: 'column', gap: '16px',
                            animation: 'bottomSheetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
                            boxSizing: 'border-box',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Grab Handle */}
                        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: colors.border, margin: '0 auto 8px auto' }} />

                        {/* Song Header Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: `1px solid ${colors.border}` }}>
                            <div className="ske-art" style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                                {getImageUrl(activeMenuSong) ? (
                                    <img src={getImageUrl(activeMenuSong)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper-darker)' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.inkLight}>
                                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: fonts.primary, fontWeight: 700, fontSize: '0.95rem', color: colors.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {activeMenuSong.name || activeMenuSong.title}
                                </div>
                                <div style={{ fontFamily: fonts.mono, fontSize: '0.75rem', color: colors.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                    {activeMenuSong.primaryArtists || 'Unknown Artist'}
                                </div>
                            </div>
                        </div>

                        {/* Menu Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <button
                                onClick={() => { handlePlay(activeMenuSong); setActiveMenuSong(null) }}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 12px', width: '100%', background: 'transparent', border: 'none', borderRadius: '12px', cursor: 'pointer', color: colors.ink, fontFamily: fonts.primary, fontSize: '0.9rem', textAlign: 'left', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = colors.paperDark}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                Play Now
                            </button>

                            {onAddToQueue && (
                                <button
                                    onClick={() => { onAddToQueue(activeMenuSong); setActiveMenuSong(null) }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 12px', width: '100%', background: 'transparent', border: 'none', borderRadius: '12px', cursor: 'pointer', color: colors.ink, fontFamily: fonts.primary, fontSize: '0.9rem', textAlign: 'left', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = colors.paperDark}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Add to Queue
                                </button>
                            )}

                            {currentUser && (
                                <button
                                    onClick={() => { handleAddToPlaylist(activeMenuSong); setActiveMenuSong(null) }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 12px', width: '100%', background: 'transparent', border: 'none', borderRadius: '12px', cursor: 'pointer', color: colors.ink, fontFamily: fonts.primary, fontSize: '0.9rem', textAlign: 'left', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = colors.paperDark}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                                        <circle cx="3" cy="6" r="1.2" fill="currentColor" /><circle cx="3" cy="12" r="1.2" fill="currentColor" /><circle cx="3" cy="18" r="1.2" fill="currentColor" />
                                        <line x1="19" y1="15" x2="19" y2="21" /><line x1="16" y1="18" x2="22" y2="18" />
                                    </svg>
                                    Add to Playlist
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}