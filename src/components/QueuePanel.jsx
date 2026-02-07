import { useState, useRef, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { formatDuration } from '@/lib/utils'
import { X, Music, Play, Trash2, Clock } from 'lucide-react'

export default function QueuePanel({ isOpen, onClose }) {
    const { colors, fonts, isDark } = useTheme()
    const { queue, currentSong, currentIndex, playSong, removeFromQueue } = usePlayer()
    const panelRef = useRef(null)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    // Calculate total duration of all songs in queue (including current song)
    const totalDuration = queue.reduce((total, song) => total + (Number(song.duration) || 0), 0) +
        (currentSong ? (Number(currentSong.duration) || 0) : 0)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop blur overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 149,
                    animation: 'fadeIn 0.3s ease-out',
                }}
                onClick={onClose}
            />

            <div style={{
                position: 'fixed',
                top: isMobile ? 'auto' : '16px',
                right: isMobile ? 0 : '16px',
                left: isMobile ? 0 : 'auto',
                bottom: isMobile ? 0 : '96px',
                width: isMobile ? '100%' : 'min(85vw, 380px)',
                maxWidth: isMobile ? '100%' : '380px',
                maxHeight: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 120px)',
                background: colors.paper,
                borderRadius: isMobile ? '20px 20px 0 0' : '16px',
                borderLeft: isMobile ? 'none' : `1px solid ${colors.rule}`,
                border: isMobile ? `1px solid ${colors.rule}` : `1px solid ${colors.rule}`,
                boxShadow: isDark
                    ? '0 -8px 32px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)'
                    : '0 -8px 32px rgba(26,22,20,0.15), 0 4px 16px rgba(26,22,20,0.08)',
                zIndex: 150,
                display: 'flex',
                flexDirection: 'column',
                animation: isMobile ? 'slideInBottom 0.3s ease-out' : 'slideInRight 0.3s ease-out',
            }}
                ref={panelRef}
            >
                {/* Header */}
                <div style={{
                    padding: 'clamp(16px, 4vw, 20px) clamp(20px, 5vw, 24px)',
                    borderBottom: `1px solid ${colors.rule}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <h2 style={{
                            fontFamily: fonts.display,
                            fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                            fontWeight: 800,
                            color: colors.ink,
                            margin: 0,
                        }}>
                            Queue
                        </h2>
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: 'clamp(0.7rem, 2vw, 0.75rem)',
                            color: colors.inkLight,
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                        }}>
                            <span>{(queue.length + (currentSong ? 1 : 0))} track{(queue.length + (currentSong ? 1 : 0)) !== 1 ? 's' : ''}</span>
                            {(queue.length > 0 || currentSong) && (
                                <>
                                    <span style={{ opacity: 0.5 }}>•</span>
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}>
                                        <Clock size={12} style={{ opacity: 0.7 }} />
                                        {formatDuration(totalDuration)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: colors.paperDark,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.ink,
                            transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.paperDarker}
                        onMouseLeave={(e) => e.currentTarget.style.background = colors.paperDark}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Queue List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'clamp(12px, 3vw, 16px)',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {queue.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: '12px',
                            color: colors.inkLight,
                        }}>
                            <Music size={48} strokeWidth={1.5} />
                            <div style={{
                                fontFamily: fonts.primary,
                                fontSize: '1rem',
                                fontWeight: 600,
                            }}>
                                Queue is empty
                            </div>
                            <div style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                maxWidth: '280px',
                            }}>
                                Add songs to your queue and they'll appear here
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 8px)' }}>
                            {queue.map((song, index) => {
                                const isPlaying = currentSong?.id === song.id
                                // Use highest quality image available - check both .link and .url
                                const imageUrl = song.image?.[0]?.link || song.image?.[0]?.url ||
                                    song.image?.[1]?.link || song.image?.[1]?.url ||
                                    song.image?.[2]?.link || song.image?.[2]?.url ||
                                    song.imageUrl || ''

                                return (
                                    <div
                                        key={`${song.id}-${index}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px',
                                            borderRadius: '10px',
                                            background: isPlaying ? `${colors.accent}15` : 'transparent',
                                            border: `1px solid ${isPlaying ? colors.accent : colors.rule}`,
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isPlaying) {
                                                e.currentTarget.style.background = colors.paperDark
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isPlaying) {
                                                e.currentTarget.style.background = 'transparent'
                                            }
                                        }}
                                    >
                                        {/* Position */}
                                        <div style={{
                                            width: '24px',
                                            fontFamily: fonts.mono,
                                            fontSize: '0.75rem',
                                            color: isPlaying ? colors.accent : colors.inkMuted,
                                            fontWeight: 700,
                                            textAlign: 'center',
                                        }}>
                                            {isPlaying ? (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '2px',
                                                }}>
                                                    <div style={{
                                                        width: '3px',
                                                        height: '12px',
                                                        background: colors.accent,
                                                        borderRadius: '2px',
                                                        animation: 'wave 1s ease-in-out infinite',
                                                    }} />
                                                    <div style={{
                                                        width: '3px',
                                                        height: '12px',
                                                        background: colors.accent,
                                                        borderRadius: '2px',
                                                        animation: 'wave 1s ease-in-out infinite 0.2s',
                                                    }} />
                                                    <div style={{
                                                        width: '3px',
                                                        height: '12px',
                                                        background: colors.accent,
                                                        borderRadius: '2px',
                                                        animation: 'wave 1s ease-in-out infinite 0.4s',
                                                    }} />
                                                </div>
                                            ) : (
                                                index + 1
                                            )}
                                        </div>

                                        {/* Album Art */}
                                        <div
                                            onClick={() => playSong(song)}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                background: colors.paperDark,
                                                position: 'relative',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {imageUrl ? (
                                                <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(0,0,0,0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s',
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                            >
                                                <Play size={18} color="#fff" fill="#fff" />
                                            </div>
                                        </div>

                                        {/* Song Info */}
                                        <div
                                            onClick={() => playSong(song)}
                                            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                        >
                                            <div style={{
                                                fontFamily: fonts.primary,
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                color: isPlaying ? colors.accent : colors.ink,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {song.name}
                                            </div>
                                            <div style={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.75rem',
                                                color: colors.inkMuted,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                marginTop: '2px',
                                            }}>
                                                {song.primaryArtists || 'Unknown Artist'}
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFromQueue(index)
                                            }}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: colors.inkMuted,
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = colors.paperDarker
                                                e.currentTarget.style.color = '#FF6B6B'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.color = colors.inkMuted
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes wave {
          0%, 100% {
            height: 8px;
          }
          50% {
            height: 16px;
          }
        }
      `}</style>
            </div>
        </>
    )
}
