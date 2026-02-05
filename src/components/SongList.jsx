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
            onPlaySong(song, songs)
        } else {
            playSong(song, songs)
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
                const imageUrl = song.image?.[1]?.link || song.image?.[0]?.link || ''

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
                            background: isCurrentSong ? colors.paperDark : (hoveredIndex === index ? colors.paperDark : 'transparent'),
                            borderRadius: 'clamp(6px, 2vw, 8px)',
                            borderLeft: isCurrentSong ? `3px solid ${colors.accent}` : '3px solid transparent',
                            transition: 'all 0.15s',
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
                                borderRadius: 'clamp(4px, 1.5vw, 6px)'
                            }} />
                        ) : (
                            <div style={{
                                width: 'clamp(42px, 10vw, 48px)',
                                height: 'clamp(42px, 10vw, 48px)',
                                background: colors.paperDark,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                borderRadius: '6px',
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
                        {hoveredIndex === index && (onAddToQueue || addToQueue) && (
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
                                    width: 'clamp(32px, 8vw, 36px)',
                                    height: 'clamp(32px, 8vw, 36px)',
                                    borderRadius: 'clamp(6px, 2vw, 8px)',
                                    background: colors.paperDarker,
                                    border: `1px solid ${colors.rule}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = colors.accent
                                    e.currentTarget.style.borderColor = colors.accent
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = colors.paperDarker
                                    e.currentTarget.style.borderColor = colors.rule
                                }}
                                title="Add to Queue"
                            >
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
