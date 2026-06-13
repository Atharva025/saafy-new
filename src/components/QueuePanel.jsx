import { useState, useRef, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { formatDuration } from '@/lib/utils'
import Tooltip from './Tooltip'
import { X, Music, Play, Trash2, Clock, GripVertical } from 'lucide-react'

export default function QueuePanel({ isOpen, onClose }) {
    const { colors, fonts, isDark } = useTheme()
    const { queue, currentSong, playSong, removeFromQueue, reorderQueue } = usePlayer()
    const panelRef = useRef(null)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    const [draggedIndex, setDraggedIndex] = useState(null)
    const [dragOverIndex, setDragOverIndex] = useState(null)

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

    const handleDragStart = (e, index) => {
        setDraggedIndex(index)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', index)
        
        // Custom drag ghost image style fallback
        if (e.currentTarget) {
            e.currentTarget.style.opacity = '0.4'
        }
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()
        if (draggedIndex === index) return
        setDragOverIndex(index)
    }

    const handleDragEnd = (e) => {
        setDraggedIndex(null)
        setDragOverIndex(null)
        if (e.currentTarget) {
            e.currentTarget.style.opacity = '1'
        }
    }

    const handleDrop = (e, index) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return
        reorderQueue(draggedIndex, index)
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop blur overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 149,
                    animation: 'fadeIn 0.25s ease-out',
                }}
                onClick={onClose}
            />

            <div style={{
                position: 'fixed',
                top: isMobile ? 'auto' : '16px',
                right: isMobile ? 0 : '16px',
                left: isMobile ? 0 : 'auto',
                bottom: isMobile ? 0 : '96px',
                width: isMobile ? '100%' : 'min(90vw, 390px)',
                maxWidth: isMobile ? '100%' : '390px',
                maxHeight: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 120px)',
                background: colors.paper,
                backgroundImage: 'var(--background-image-ske-surface)',
                borderRadius: isMobile ? '24px 24px 0 0' : '18px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)'}`,
                boxShadow: isDark
                    ? `8px 10px 32px var(--ske-shadow), -4px -4px 16px var(--ske-highlight), inset 0 1px 1px var(--ske-inner-highlight), inset 0 -1px 2px var(--ske-inner-shadow), 0 -8px 32px rgba(0,0,0,0.5)`
                    : `6px 8px 24px var(--ske-shadow), -4px -4px 14px var(--ske-highlight), inset 0 1px 1px var(--ske-inner-highlight), inset 0 -1px 2px var(--ske-inner-shadow), 0 -8px 32px rgba(26,22,20,0.15)`,
                zIndex: 150,
                display: 'flex',
                flexDirection: 'column',
                animation: isMobile ? 'slideInBottom 0.28s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
                ref={panelRef}
            >
                {/* Header */}
                <div style={{
                    padding: 'clamp(14px, 3.5vw, 18px) clamp(16px, 4vw, 22px)',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,22,20,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: `0 1px 0 var(--ske-inner-highlight), inset 0 1px 0 var(--ske-highlight)`,
                }}>
                    <div>
                        <h2 style={{
                            fontFamily: fonts.display,
                            fontSize: 'clamp(1.15rem, 3.5vw, 1.35rem)',
                            fontWeight: 800,
                            color: colors.ink,
                            margin: 0,
                            letterSpacing: '-0.02em',
                        }}>
                            Play Queue
                        </h2>
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: 'clamp(0.65rem, 1.8vw, 0.7rem)',
                            color: colors.inkLight,
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
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
                                        <Clock size={11} style={{ opacity: 0.7 }} />
                                        {formatDuration(totalDuration)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="icon-btn"
                        style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Queue List Scrolling Body */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'clamp(12px, 3.5vw, 18px)',
                    WebkitOverflowScrolling: 'touch',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}>
                    {/* Now Playing Header Card */}
                    {currentSong && (
                        <div>
                            <div style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.62rem',
                                color: colors.accent,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginBottom: '6px',
                                fontWeight: 700,
                            }}>Now Playing</div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                background: isDark ? 'rgba(224,115,86,0.06)' : 'rgba(196,92,62,0.04)',
                                border: `1px solid ${isDark ? 'rgba(224,115,86,0.22)' : 'rgba(196,92,62,0.14)'}`,
                                boxShadow: `inset 1px 2px 4px var(--ske-inner-shadow), 0 2px 8px rgba(0,0,0,0.05)`,
                            }}>
                                {/* Album Art */}
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                }}>
                                    <img 
                                        src={currentSong.image?.[2]?.link || currentSong.image?.[1]?.link || currentSong.image?.[0]?.link || ''} 
                                        alt="" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                </div>
                                
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {(currentSong.name || currentSong.title) && (currentSong.name || currentSong.title).length > 20 ? (
                                        <Tooltip text={currentSong.name || currentSong.title}>
                                            <div style={{
                                                fontFamily: fonts.primary,
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                color: colors.ink,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>{currentSong.name || currentSong.title}</div>
                                        </Tooltip>
                                    ) : (
                                        <div style={{
                                            fontFamily: fonts.primary,
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            color: colors.ink,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>{currentSong.name || currentSong.title}</div>
                                    )}
                                    {currentSong.primaryArtists && currentSong.primaryArtists.length > 28 ? (
                                        <Tooltip text={currentSong.primaryArtists}>
                                            <div style={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.68rem',
                                                color: colors.inkMuted,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                marginTop: '1px',
                                            }}>{currentSong.primaryArtists}</div>
                                        </Tooltip>
                                    ) : (
                                        <div style={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.68rem',
                                            color: colors.inkMuted,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            marginTop: '1px',
                                        }}>{currentSong.primaryArtists || 'Unknown Artist'}</div>
                                    )}
                                </div>

                                {/* Active bars */}
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '10px', marginRight: '4px', flexShrink: 0 }}>
                                    {[0.5, 1, 0.4, 0.75].map((h, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: '2px',
                                                height: `${h * 100}%`,
                                                background: colors.accent,
                                                borderRadius: '1px',
                                                animation: `barBounce 0.75s ease-in-out ${i * 0.13}s infinite alternate`,
                                                transformOrigin: 'bottom',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Next Up List */}
                    <div>
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: '0.62rem',
                            color: colors.inkMuted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '6px',
                            fontWeight: 700,
                        }}>Next Up</div>

                        {queue.length === 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '36px 12px',
                                gap: '10px',
                                color: colors.inkLight,
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                                borderRadius: '12px',
                                border: `1px dashed ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                            }}>
                                <Music size={32} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                                <div style={{
                                    fontFamily: fonts.primary,
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                }}>
                                    No upcoming songs
                                </div>
                                <div style={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.68rem',
                                    textAlign: 'center',
                                    maxWidth: '240px',
                                    lineHeight: 1.4,
                                    opacity: 0.8,
                                }}>
                                    Add songs from cards or search results to build your list.
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {queue.map((song, index) => {
                                    // Use highest quality image available
                                    const imageUrl = song.image?.[2]?.link || song.image?.[2]?.url ||
                                        song.image?.[1]?.link || song.image?.[1]?.url ||
                                        song.image?.[0]?.link || song.image?.[0]?.url ||
                                        song.imageUrl || ''
                                    
                                    const isBeingDragged = index === draggedIndex
                                    const isDragTarget = index === dragOverIndex

                                    return (
                                        <div
                                            key={`${song.id}-${index}`}
                                            draggable="true"
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnd={handleDragEnd}
                                            onDrop={(e) => handleDrop(e, index)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 10px',
                                                borderRadius: '10px',
                                                border: isBeingDragged
                                                    ? `1.5px dashed ${colors.accent}`
                                                    : isDragTarget
                                                        ? `1.5px solid ${colors.accent}`
                                                        : `1px solid transparent`,
                                                background: isBeingDragged
                                                    ? (isDark ? 'rgba(224,115,86,0.08)' : 'rgba(196,92,62,0.04)')
                                                    : isDragTarget
                                                        ? colors.paperDarker
                                                        : 'transparent',
                                                opacity: isBeingDragged ? 0.5 : 1,
                                                transform: isDragTarget ? 'scale(1.01)' : 'scale(1)',
                                                transition: 'all 200ms var(--ease-premium)',
                                                cursor: 'grab',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (draggedIndex === null) {
                                                    e.currentTarget.style.background = colors.paperDark
                                                    e.currentTarget.style.boxShadow = `1px 2px 4px var(--ske-shadow), -1px -1px 2px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight)`
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (draggedIndex === null) {
                                                    e.currentTarget.style.background = 'transparent'
                                                    e.currentTarget.style.boxShadow = 'none'
                                                }
                                            }}
                                        >
                                            {/* Drag handle */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: colors.inkLight,
                                                cursor: 'grab',
                                                opacity: 0.6,
                                                transition: 'opacity 0.15s',
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                            >
                                                <GripVertical size={16} />
                                            </div>

                                            {/* Album Art */}
                                            <div
                                                onClick={() => playSong(song)}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    background: colors.paperDark,
                                                    position: 'relative',
                                                    cursor: 'pointer',
                                                    boxShadow: `1px 1px 3px var(--ske-shadow), -0.5px -0.5px 1.5px var(--ske-highlight)`,
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
                                                        <Music size={16} color={colors.inkLight} />
                                                    </div>
                                                )}
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'rgba(0,0,0,0.35)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s',
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                                >
                                                    <Play size={14} color="#fff" fill="#fff" />
                                                </div>
                                            </div>

                                            {/* Song Info */}
                                            <div
                                                onClick={() => playSong(song)}
                                                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                            >
                                                {song.name && song.name.length > 20 ? (
                                                    <Tooltip text={song.name}>
                                                        <div style={{
                                                            fontFamily: fonts.primary,
                                                            fontWeight: 600,
                                                            color: colors.ink,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}>{song.name}</div>
                                                    </Tooltip>
                                                ) : (
                                                    <div style={{
                                                        fontFamily: fonts.primary,
                                                        fontWeight: 600,
                                                        color: colors.ink,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}>{song.name}</div>
                                                )}
                                                {song.primaryArtists && song.primaryArtists.length > 28 ? (
                                                    <Tooltip text={song.primaryArtists}>
                                                        <div style={{
                                                            fontFamily: fonts.mono,
                                                            fontSize: '0.68rem',
                                                            color: colors.inkMuted,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            marginTop: '1px',
                                                        }}>{song.primaryArtists}</div>
                                                    </Tooltip>
                                                ) : (
                                                    <div style={{
                                                        fontFamily: fonts.mono,
                                                        fontSize: '0.68rem',
                                                        color: colors.inkMuted,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        marginTop: '1px',
                                                    }}>{song.primaryArtists || 'Unknown Artist'}</div>
                                                )}
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeFromQueue(index)
                                                }}
                                                className="bottom-sheet-btn"
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '6px',
                                                    background: colors.paperDark,
                                                    backgroundImage: 'var(--background-image-ske-button)',
                                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)'}`,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: colors.inkMuted,
                                                    boxShadow: 'var(--shadow-ske-xs)',
                                                    transition: 'box-shadow 80ms ease-out, transform 80ms ease-out, background 0.1s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,75,75,0.12)'
                                                    e.currentTarget.style.color = '#FF6B6B'
                                                    e.currentTarget.style.borderColor = 'rgba(255,75,75,0.25)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = colors.paperDark
                                                    e.currentTarget.style.color = colors.inkMuted
                                                    e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)'
                                                }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideInBottom {
                        from { transform: translateY(100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes barBounce {
                        from { transform: scaleY(0.35); opacity: 0.7; }
                        to   { transform: scaleY(1);    opacity: 1; }
                    }
                `}</style>
            </div>
        </>
    )
}
