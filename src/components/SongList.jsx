import { useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { encryptedGetItem } from '@/lib/encryption'
import { adjustColorForTheme } from '@/lib/utils'
import Tooltip from './Tooltip'

export default function SongList({ songs, onPlaySong, onAddToQueue }) {
    const { colors, fonts, isDark } = useTheme()
    const { playSong, addToQueue, currentSong, isPlaying, togglePlay, playlists, addSongToPlaylist, createPlaylist, dominantColor } = usePlayer()
    const { success: toastSuccess, error: toastError } = useToast()
    const [hoveredIndex, setHoveredIndex] = useState(null)
    const [activePlaylistSong, setActivePlaylistSong] = useState(null)
    const [isCreatingInModal, setIsCreatingInModal] = useState(false)
    const [newPlaylistNameInModal, setNewPlaylistNameInModal] = useState('')
    const [isCreatingPlaylistLoading, setIsCreatingPlaylistLoading] = useState(false)
    const [addedSongs, setAddedSongs] = useState({})
    const currentUser = encryptedGetItem('saafy_user', null)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    if (!songs || songs.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '64px 0',
                fontFamily: fonts.mono,
                color: colors.inkLight,
            }}>
                No songs found
            </div>
        )
    }

    const handlePlay = (song) => {
        if (onPlaySong) {
            onPlaySong(song)
        } else {
            playSong(song)
        }
    }

    const formatDuration = (seconds) => {
        if (!seconds) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div>
            {songs.map((song, index) => {
                const isCurrentSong = currentSong?.id === song.id
                // Use highest quality image available - check both .link and .url
                const imageUrl = song.image?.[2]?.link || song.image?.[2]?.url ||
                    song.image?.[1]?.link || song.image?.[1]?.url ||
                    song.image?.[0]?.link || song.image?.[0]?.url ||
                    song.imageUrl || ''

                // Soft glassmorphic background & glow shadow for active song matching its dominant color
                const activeColor = (isCurrentSong && dominantColor)
                    ? adjustColorForTheme(dominantColor, isDark)
                    : null
                
                const activeBg = activeColor
                    ? activeColor.rgba(isDark ? 0.08 : 0.05)
                    : (isDark ? 'rgba(224,115,86,0.07)' : 'rgba(196,92,62,0.05)')
                
                const activeBorder = activeColor
                    ? `1px solid ${activeColor.rgba(isDark ? 0.20 : 0.12)}`
                    : `1px solid ${colors.accent}22`

                const activeBorderLeft = isCurrentSong
                    ? `3px solid ${activeColor ? activeColor.rgb : colors.accent}`
                    : '3px solid transparent'

                return (
                    <div
                        key={song.id}
                        onClick={() => handlePlay(song)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => {
                            setHoveredIndex(null)
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'clamp(12px, 3vw, 16px)',
                            padding: 'clamp(12px, 3vw, 16px)',
                            cursor: 'pointer',
                            background: isCurrentSong
                                ? activeBg
                                : hoveredIndex === index ? colors.paperDark : 'transparent',
                            backgroundImage: (isCurrentSong || hoveredIndex === index) ? 'var(--background-image-ske-surface)' : 'none',
                            borderRadius: 'clamp(8px, 2vw, 10px)',
                            border: isCurrentSong ? activeBorder : '1px solid transparent',
                            borderLeft: activeBorderLeft,
                            boxShadow: isCurrentSong
                                ? `0 8px 20px ${activeColor ? activeColor.rgba(isDark ? 0.20 : 0.12) : `${colors.accent}12`}, inset 1px 1px 0 rgba(255,255,255,${isDark ? 0.05 : 0.60})`
                                : hoveredIndex === index
                                    ? `1px 2px 6px var(--ske-shadow), -1px -1px 4px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight)`
                                    : 'none',
                            backdropFilter: isCurrentSong ? 'blur(12px) saturate(140%)' : 'none',
                            WebkitBackdropFilter: isCurrentSong ? 'blur(12px) saturate(140%)' : 'none',
                            opacity: isCurrentSong ? 1 : hoveredIndex === index ? 1 : isPlaying && currentSong ? 0.6 : 1,
                            transition: 'background 0.2s ease, box-shadow 150ms ease-out, border 0.25s ease, opacity 0.25s ease, transform 0.25s var(--ease-spring)',
                            transform: hoveredIndex === index && !isCurrentSong ? 'translateY(-1px)' : 'none',
                            marginBottom: '4px',
                            position: 'relative',
                        }}
                    >
                        {/* Track Number / Play Overlay */}
                        <div 
                            style={{
                                width: 'clamp(28px, 7vw, 32px)',
                                textAlign: 'center',
                                fontFamily: fonts.mono,
                                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                                color: isCurrentSong ? colors.accent : colors.inkLight,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                            onClick={(e) => {
                                if (hoveredIndex === index) {
                                    e.stopPropagation() // Prevent triggering the entire row click
                                    if (isCurrentSong) {
                                        togglePlay()
                                    } else {
                                        handlePlay(song)
                                    }
                                }
                            }}
                        >
                            {hoveredIndex === index ? (
                                isCurrentSong && isPlaying ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: colors.accent }}>
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                    </svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: isCurrentSong ? colors.accent : colors.ink, marginLeft: '2.5px' }}>
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )
                            ) : (
                                isCurrentSong && isPlaying ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', alignItems: 'flex-end', height: '14px' }}>
                                        {[0.6, 1, 0.45].map((h, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    width: '2.5px',
                                                    height: `${h * 100}%`,
                                                    background: colors.accent,
                                                    borderRadius: '1px',
                                                    animation: `pulse 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                                                    transformOrigin: 'bottom',
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <span style={{ color: isCurrentSong ? colors.accent : 'inherit' }}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                )
                            )}
                        </div>


                        {/* Album Art */}
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt="" 
                                className="ske-art"
                                style={{
                                    width: 'clamp(42px, 10vw, 48px)',
                                    height: 'clamp(42px, 10vw, 48px)',
                                    objectFit: 'cover',
                                    flexShrink: 0,
                                    borderRadius: 'clamp(6px, 1.5vw, 8px)',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                                }} 
                            />
                        ) : (
                            <div style={{
                                width: 'clamp(42px, 10vw, 48px)',
                                height: 'clamp(42px, 10vw, 48px)',
                                background: colors.paperDark,
                                backgroundImage: 'var(--background-image-ske-recessed)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                borderRadius: 'clamp(6px, 1.5vw, 8px)',
                                boxShadow: 'var(--shadow-ske-inset-sm)',
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={colors.inkLight}>
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                </svg>
                            </div>
                        )}

                        {/* Song Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {(song.name || song.title) && (song.name || song.title).length > 20 ? (
                                <Tooltip text={song.name || song.title}>
                                    <div style={{
                                        fontFamily: fonts.primary,
                                        fontWeight: 500,
                                        fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                                        color: isCurrentSong ? colors.accent : colors.ink,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {song.name || song.title}
                                    </div>
                                </Tooltip>
                            ) : (
                                <div style={{
                                    fontFamily: fonts.primary,
                                    fontWeight: 500,
                                    fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                                    color: isCurrentSong ? colors.accent : colors.ink,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {song.name || song.title}
                                </div>
                            )}
                            {song.primaryArtists && song.primaryArtists.length > 28 ? (
                                <Tooltip text={song.primaryArtists}>
                                    <div style={{
                                        fontFamily: fonts.mono,
                                        fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                                        color: colors.inkMuted,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {song.primaryArtists}
                                    </div>
                                </Tooltip>
                            ) : (
                                <div style={{
                                    fontFamily: fonts.mono,
                                    fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                                    color: colors.inkMuted,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {song.primaryArtists || 'Unknown'}
                                </div>
                            )}
                        </div>

                        {/* Duration */}
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                            color: colors.inkLight,
                            width: isMobile ? 'auto' : '48px',
                            textAlign: 'right',
                            display: isMobile ? 'none' : 'block',
                        }}>
                            {formatDuration(song.duration)}
                        </div>

                        {/* Actions container */}
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                marginLeft: 'auto', 
                                flexShrink: 0 
                            }}
                        >
                            {/* Play Button */}
                            {(onPlaySong || playSong) && (
                                <button
                                    onClick={() => handlePlay(song)}
                                    className="icon-btn"
                                    style={{
                                        width: isMobile ? '24px' : '32px',
                                        height: isMobile ? '24px' : '32px',
                                        borderRadius: isMobile ? '6px' : '8px',
                                        background: isCurrentSong && isPlaying ? 'var(--color-accent)' : colors.paperDarker,
                                        backgroundImage: isCurrentSong && isPlaying ? 'none' : 'var(--background-image-ske-button)',
                                        border: isCurrentSong && isPlaying ? '1px solid var(--color-accent)' : `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'}`,
                                        padding: 0,
                                        minWidth: 0,
                                        minHeight: 0,
                                        boxSizing: 'border-box',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isCurrentSong && isPlaying ? '#fff' : colors.inkMuted,
                                        boxShadow: 'var(--shadow-ske-xs)',
                                        transition: 'box-shadow 80ms ease-out, transform 80ms ease-out, background 0.1s, border-color 0.1s',
                                        position: 'relative',
                                    }}
                                    onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' }}
                                    onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-ske-xs)' }}
                                    onMouseEnter={(e) => {
                                        if (isCurrentSong && isPlaying) return
                                        e.currentTarget.style.background = colors.accent
                                        e.currentTarget.style.color = '#fff'
                                        e.currentTarget.style.borderColor = colors.accent
                                    }}
                                    onMouseLeave={(e) => {
                                        if (isCurrentSong && isPlaying) return
                                        e.currentTarget.style.background = colors.paperDarker
                                        e.currentTarget.style.color = colors.inkMuted
                                        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'
                                    }}
                                    title={isCurrentSong && isPlaying ? "Pause" : "Play Now"}
                                >
                                    <span style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        left: '-10px',
                                        right: '-10px',
                                        bottom: '-10px',
                                        cursor: 'pointer',
                                    }} />
                                    {isCurrentSong && isPlaying ? (
                                        <svg width="clamp(12px, 3vw, 14px)" height="clamp(12px, 3vw, 14px)" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                        </svg>
                                    ) : (
                                        <svg width="clamp(12px, 3vw, 14px)" height="clamp(12px, 3vw, 14px)" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '1px' }}>
                                            <path d="M8 5v14l11-7L8 5z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Add to Queue Button */}
                            {(onAddToQueue || addToQueue) && (
                                <button
                                    onClick={() => {
                                        if (addedSongs[song.id]) return
                                        if (onAddToQueue) {
                                            onAddToQueue(song)
                                        } else {
                                            addToQueue(song)
                                        }
                                        setAddedSongs(prev => ({ ...prev, [song.id]: true }))
                                        setTimeout(() => {
                                            setAddedSongs(prev => ({ ...prev, [song.id]: false }))
                                        }, 2000)
                                    }}
                                    style={{
                                        width: isMobile ? '24px' : '32px',
                                        height: isMobile ? '24px' : '32px',
                                        borderRadius: isMobile ? '6px' : '8px',
                                        background: addedSongs[song.id] ? 'rgba(16, 185, 129, 0.95)' : colors.paperDarker,
                                        backgroundImage: addedSongs[song.id] ? 'none' : 'var(--background-image-ske-button)',
                                        border: addedSongs[song.id] ? '1px solid rgba(16, 185, 129, 0.7)' : `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'}`,
                                        padding: 0,
                                        minWidth: 0,
                                        minHeight: 0,
                                        boxSizing: 'border-box',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: addedSongs[song.id] ? '#fff' : colors.inkMuted,
                                        boxShadow: 'var(--shadow-ske-xs)',
                                        transition: 'box-shadow 80ms ease-out, transform 80ms ease-out, background 0.1s, border-color 0.1s',
                                        position: 'relative',
                                    }}
                                    onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' }}
                                    onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-ske-xs)' }}
                                    onMouseEnter={(e) => {
                                        if (addedSongs[song.id]) return
                                        e.currentTarget.style.background = colors.accent
                                        e.currentTarget.style.color = '#fff'
                                        e.currentTarget.style.borderColor = colors.accent
                                    }}
                                    onMouseLeave={(e) => {
                                        if (addedSongs[song.id]) return
                                        e.currentTarget.style.background = colors.paperDarker
                                        e.currentTarget.style.color = colors.inkMuted
                                        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'
                                    }}
                                    title="Add to Queue"
                                >
                                    <span style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        left: '-10px',
                                        right: '-10px',
                                        bottom: '-10px',
                                        cursor: 'pointer',
                                    }} />
                                    {addedSongs[song.id] ? (
                                        <svg width="clamp(12px, 3vw, 14px)" height="clamp(12px, 3vw, 14px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg width="clamp(12px, 3vw, 14px)" height="clamp(12px, 3vw, 14px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Add to Playlist Button */}
                            {currentUser && (
                                <div onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setActivePlaylistSong(song)
                                        }}
                                        style={{
                                            width: isMobile ? '24px' : '32px',
                                            height: isMobile ? '24px' : '32px',
                                            borderRadius: isMobile ? '6px' : '8px',
                                            background: colors.paperDarker,
                                            backgroundImage: 'var(--background-image-ske-button)',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'}`,
                                            padding: 0,
                                            minWidth: 0,
                                            minHeight: 0,
                                            boxSizing: 'border-box',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: colors.inkMuted,
                                            boxShadow: 'var(--shadow-ske-xs)',
                                            transition: 'box-shadow 80ms ease-out, transform 80ms ease-out, background 0.1s, border-color 0.1s',
                                            position: 'relative',
                                        }}
                                        onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' }}
                                        onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-ske-xs)' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = colors.accent
                                            e.currentTarget.style.color = '#fff'
                                            e.currentTarget.style.borderColor = colors.accent
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = colors.paperDarker
                                            e.currentTarget.style.color = colors.inkMuted
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'
                                        }}
                                        title="Add to Playlist"
                                    >
                                        <svg width="clamp(13px, 3.2vw, 15px)" height="clamp(13px, 3.2vw, 15px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}

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
                                                    toastSuccess(`Added to "${playlist.name}"`)
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
                                                toastSuccess(`Playlist "${trimmedName}" created!`)
                                                setNewPlaylistNameInModal('')
                                                setIsCreatingInModal(false)
                                                // Automatically add the song to the new playlist
                                                const res = await addSongToPlaylist(userId, newPlaylist._id || newPlaylist.id, activePlaylistSong)
                                                if (res.success) {
                                                    toastSuccess(`Added to "${trimmedName}"`)
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
                @keyframes pulse {
                    0% { transform: scaleY(0.6); }
                    100% { transform: scaleY(1); }
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScaleUp {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    )
}
