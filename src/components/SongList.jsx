import { useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'

export default function SongList({ songs, onPlaySong, onAddToQueue }) {
    const { colors, fonts } = useTheme()
    const { playSong, addToQueue, currentSong, isPlaying } = usePlayer()
    const { success } = useToast()
    const [hoveredIndex, setHoveredIndex] = useState(null)
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
                const imageUrl = song.image?.[0]?.link || song.image?.[0]?.url ||
                    song.image?.[1]?.link || song.image?.[1]?.url ||
                    song.image?.[2]?.link || song.image?.[2]?.url ||
                    song.imageUrl || ''

                return (
                    <div
                        key={song.id}
                        onClick={() => handlePlay(song)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'clamp(12px, 3vw, 16px)',
                            padding: 'clamp(12px, 3vw, 16px)',
                            cursor: 'pointer',
                            background: isCurrentSong
                                ? (isDark ? 'rgba(224,115,86,0.07)' : 'rgba(196,92,62,0.05)')
                                : hoveredIndex === index ? colors.paperDark : 'transparent',
                            backgroundImage: (isCurrentSong || hoveredIndex === index) ? 'var(--background-image-ske-surface)' : 'none',
                            borderRadius: 'clamp(8px, 2vw, 10px)',
                            borderLeft: isCurrentSong ? `3px solid ${colors.accent}` : '3px solid transparent',
                            boxShadow: isCurrentSong
                                ? `inset 1px 2px 5px var(--ske-inner-shadow), inset -1px -1px 3px var(--ske-inner-highlight)`
                                : hoveredIndex === index
                                    ? `1px 2px 6px var(--ske-shadow), -1px -1px 4px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight)`
                                    : 'none',
                            transition: 'background 0.1s ease, box-shadow 100ms ease-out',
                            marginBottom: '2px',
                            position: 'relative',
                        }}
                    >
                        {/* Track Number */}
                        <div style={{
                            width: 'clamp(28px, 7vw, 32px)',
                            textAlign: 'center',
                            fontFamily: fonts.mono,
                            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                            color: colors.inkLight,
                        }}>
                            {isCurrentSong && isPlaying ? (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                    <span style={{
                                        width: '3px',
                                        height: '12px',
                                        background: colors.accent,
                                        animation: 'pulse 0.6s infinite alternate',
                                    }} />
                                    <span style={{
                                        width: '3px',
                                        height: '16px',
                                        background: colors.accent,
                                        animation: 'pulse 0.6s infinite alternate 0.1s',
                                    }} />
                                    <span style={{
                                        width: '3px',
                                        height: '10px',
                                        background: colors.accent,
                                        animation: 'pulse 0.6s infinite alternate 0.2s',
                                    }} />
                                </div>
                            ) : (
                                String(index + 1).padStart(2, '0')
                            )}
                        </div>

                        {/* Album Art */}
                        {imageUrl ? (
                            <img src={imageUrl} alt="" style={{
                                width: 'clamp(42px, 10vw, 48px)',
                                height: 'clamp(42px, 10vw, 48px)',
                                objectFit: 'cover',
                                flexShrink: 0,
                                borderRadius: 'clamp(6px, 1.5vw, 8px)',
                                boxShadow: `1px 2px 5px var(--ske-shadow), -1px -1px 3px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight)`,
                            }} />
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

                        {/* Add to Queue Button */}
                        {(hoveredIndex === index || isMobile) && (onAddToQueue || addToQueue) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (onAddToQueue) {
                                        onAddToQueue(song)
                                    } else {
                                        addToQueue(song)
                                    }
                                    success(`Added "${song.name}" to queue`, { duration: 2000 })
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
                                    transition: 'box-shadow 80ms ease-out, transform 80ms ease-out, background 0.1s',
                                    position: 'relative',
                                }}
                                onMouseDown={(e) => { e.stopPropagation(); e.currentTarget.style.boxShadow = 'var(--shadow-ske-pressed)'; e.currentTarget.style.transform = 'translateY(1px)' }}
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
                                title="Add to Queue"
                            >
                                {/* Invisible touch expander for better mobile accessibility */}
                                <span style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    left: '-10px',
                                    right: '-10px',
                                    bottom: '-10px',
                                    cursor: 'pointer',
                                }} />
                                <svg width="clamp(14px, 3.5vw, 16px)" height="clamp(14px, 3.5vw, 16px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )
            })}

            <style>{`
                @keyframes pulse {
                    0% { transform: scaleY(0.6); }
                    100% { transform: scaleY(1); }
                }
            `}</style>
        </div>
    )
}
