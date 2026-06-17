import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { adjustColorForTheme, formatDuration } from '@/lib/utils'
import AudioVisualizer from './AudioVisualizer'
import Tooltip from './Tooltip'
import {
    ChevronDown,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Repeat1,
    Volume2,
    VolumeX,
    Volume1,
    Music2,
    Search,
    X,
    Mic2,
    ListMusic,
    Heart,
    Zap,
    Disc3,
    Radio,
    Trash2,
    Clock,
    GripVertical
} from 'lucide-react'
import { Client, parseLocalLyrics } from 'lrclib-api'

const client = new Client()

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
}

function FaceplateScrew({ top, left, bottom, right }) {
    return (
        <div style={{
            position: 'absolute',
            top, left, bottom, right,
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e0e0e0, #888888)',
            border: '1px solid rgba(0,0,0,0.55)',
            boxShadow: '0 1px 1px rgba(255,255,255,0.15)',
            opacity: 0.45,
            zIndex: 10,
            pointerEvents: 'none'
        }}>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                background: 'rgba(0,0,0,0.65)',
                transform: 'translateY(-50%) rotate(45deg)'
            }} />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// SKEUOMORPHIC RAISED BUTTON
// Physically raised button with highlight top / shadow bottom.
// Inverts (sinks) on press.
// ─────────────────────────────────────────────────────────────
function SkeuoBtn({ onClick, title, active, activeColor, size = 42, children, circle = true, large = false }) {
    const [pressed, setPressed] = useState(false)
    const [hov, setHov] = useState(false)

    const radius = circle ? '50%' : large ? '14px' : '10px'

    const raisedShadow = `
        2px 3px 8px rgba(0,0,0,0.55),
        -1px -1px 4px rgba(255,255,255,0.06),
        inset 0 1px 1px rgba(255,255,255,0.14),
        inset 0 -1px 2px rgba(0,0,0,0.35)
    `
    const pressedShadow = `
        0 1px 2px rgba(0,0,0,0.6),
        inset 2px 3px 8px rgba(0,0,0,0.6),
        inset -1px -1px 3px rgba(255,255,255,0.04)
    `

    const baseBg = active
        ? `linear-gradient(145deg, ${activeColor}cc 0%, ${activeColor}88 100%)`
        : `linear-gradient(155deg,
            rgba(255,255,255,0.14) 0%,
            rgba(255,255,255,0.07) 40%,
            rgba(0,0,0,0.18) 100%
          )`

    const hovBg = active
        ? `linear-gradient(145deg, ${activeColor}ee 0%, ${activeColor}aa 100%)`
        : `linear-gradient(155deg,
            rgba(255,255,255,0.20) 0%,
            rgba(255,255,255,0.10) 40%,
            rgba(0,0,0,0.15) 100%
          )`

    return (
        <button
            onClick={onClick}
            title={title}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => { setHov(false); setPressed(false) }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                minWidth: `${size}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius,
                border: pressed
                    ? '1px solid rgba(0,0,0,0.45)'
                    : '1px solid rgba(255,255,255,0.10)',
                background: pressed ? 'rgba(0,0,0,0.25)' : (hov ? hovBg : baseBg),
                boxShadow: pressed ? pressedShadow : raisedShadow,
                cursor: 'pointer',
                color: active ? '#fff' : (hov ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)'),
                transition: pressed ? 'none' : 'all 0.15s ease',
                transform: pressed ? 'scale(0.94)' : 'scale(1)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                outline: 'none',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Gloss sheen — top half highlight */}
            {!pressed && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '50%',
                    borderRadius: `${radius} ${radius} 0 0`,
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.01) 100%)',
                    pointerEvents: 'none'
                }} />
            )}
            {children}
        </button>
    )
}

// ─────────────────────────────────────────────────────────────
// SKEUOMORPHIC PROGRESS TRACK
// Recessed black track with a polished chrome knob fader cap.
// ─────────────────────────────────────────────────────────────
function SkeuoProgress({ progress, duration, seekTo, accentColor }) {
    const trackRef = useRef(null)
    const [dragging, setDragging] = useState(false)
    const [hov, setHov] = useState(false)
    const pct = Math.max(0, Math.min(1, progress / (duration || 1)))

    const seek = useCallback((e) => {
        if (!trackRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        seekTo(x * (duration || 0))
    }, [duration, seekTo])

    const onMove = useCallback((e) => { if (dragging) seek(e) }, [dragging, seek])
    const onUp = useCallback(() => setDragging(false), [])

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
        }
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [dragging, onMove, onUp])

    return (
        <div style={{ width: '100%', userSelect: 'none' }}>
            <div
                ref={trackRef}
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                onMouseDown={(e) => { setDragging(true); seek(e) }}
                style={{
                    width: '100%',
                    height: '20px',
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {/* Recessed track slot */}
                <div 
                    style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        position: 'relative',
                        background: '#0a0807',
                        border: '1px solid rgba(0,0,0,0.5)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.06)',
                    }}
                >
                    {/* Fill */}
                    <div 
                        style={{
                            position: 'absolute',
                            left: 0, top: 0, bottom: 0,
                            width: `${pct * 100}%`,
                            borderRadius: '3px',
                            background: `linear-gradient(90deg, ${accentColor}dd, ${accentColor})`,
                            boxShadow: `0 0 6px ${accentColor}aa`,
                            transition: dragging ? 'none' : 'width 0.1s linear',
                        }} 
                    />
                    
                    {/* Thumb: Polished Chrome Dial Knob */}
                    <div 
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: `${pct * 100}%`,
                            transform: hov || dragging ? 'translate(-50%, -50%) scale(1.15)' : 'translate(-50%, -50%) scale(1)',
                            width: '15px',
                            height: '15px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ffffff 0%, #b8b8b8 45%, #8c8c8c 100%)',
                            border: '1px solid rgba(0,0,0,0.65)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.4)',
                            transition: 'transform 150ms ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }} 
                    >
                        <div style={{
                            width: '3px',
                            height: '3px',
                            borderRadius: '50%',
                            background: '#151413',
                            border: '0.5px solid rgba(255,255,255,0.2)'
                        }} />
                    </div>
                </div>
            </div>

            {/* Time stamps */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '2px',
                fontSize: '11px',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: '600'
            }}>
                <span>{fmt(progress)}</span>
                <span>-{fmt(duration - progress)}</span>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// SKEUOMORPHIC VOLUME KNOB (horizontal fader)
// ─────────────────────────────────────────────────────────────
function SkeuoVolume({ volume, setVolume, accentColor }) {
    const trackRef = useRef(null)
    const [dragging, setDragging] = useState(false)
    const [hov, setHov] = useState(false)

    const seek = useCallback((e) => {
        if (!trackRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        setVolume(x)
    }, [setVolume])

    const onMove = useCallback((e) => { if (dragging) seek(e) }, [dragging, seek])
    const onUp = useCallback(() => setDragging(false), [])

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
        }
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [dragging, onMove, onUp])

    const vol = Math.max(0, Math.min(1, volume))

    return (
        <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', userSelect: 'none' }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
        >
            <button
                onClick={() => setVolume(vol > 0 ? 0 : 0.75)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.45)', padding: 0, flexShrink: 0,
                    display: 'flex', alignItems: 'center', transition: 'color 0.15s'
                }}
            >
                {vol === 0 ? <VolumeX size={15} /> : vol < 0.4 ? <Volume1 size={15} /> : <Volume2 size={15} />}
            </button>

            <div
                ref={trackRef}
                onMouseDown={(e) => { setDragging(true); seek(e) }}
                style={{
                    flex: 1,
                    height: '16px',
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {/* Recessed track slot */}
                <div 
                    style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        position: 'relative',
                        background: '#0a0807',
                        border: '1px solid rgba(0,0,0,0.5)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.06)',
                    }}
                >
                    {/* Fill */}
                    <div 
                        style={{
                            position: 'absolute',
                            left: 0, top: 0, bottom: 0,
                            width: `${vol * 100}%`,
                            borderRadius: '3px',
                            background: `linear-gradient(90deg, ${accentColor}dd, ${accentColor})`,
                            boxShadow: `0 0 6px ${accentColor}aa`,
                            transition: dragging ? 'none' : 'width 0.08s linear'
                        }} 
                    />
                    
                    {/* Thumb: Polished Chrome Dial Knob */}
                    <div 
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: `${vol * 100}%`,
                            transform: hov || dragging ? 'translate(-50%, -50%) scale(1.15)' : 'translate(-50%, -50%) scale(1)',
                            width: '15px',
                            height: '15px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ffffff 0%, #b8b8b8 45%, #8c8c8c 100%)',
                            border: '1px solid rgba(0,0,0,0.65)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.4)',
                            transition: 'transform 150ms ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                        }} 
                    >
                        <div style={{
                            width: '3px',
                            height: '3px',
                            borderRadius: '50%',
                            background: '#151413',
                            border: '0.5px solid rgba(255,255,255,0.2)'
                        }} />
                    </div>
                </div>
            </div>

            <Volume2 size={14} color="rgba(255,255,255,0.4)" />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// GLASSY PANEL — base glass container
// ─────────────────────────────────────────────────────────────
function GlassPanel({ children, style = {}, screws = false }) {
    return (
        <div style={{
            position: 'relative',
            background: 'rgba(18,14,12,0.55)',
            backdropFilter: 'blur(32px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderTop: '1px solid rgba(255,255,255,0.14)',
            boxShadow: `
                0 32px 80px rgba(0,0,0,0.55),
                0 0 0 0.5px rgba(255,255,255,0.05),
                inset 0 1px 0 rgba(255,255,255,0.08)
            `,
            ...style
        }}>
            {screws && (
                <>
                    <FaceplateScrew top="8px" left="8px" />
                    <FaceplateScrew top="8px" right="8px" />
                    <FaceplateScrew bottom="8px" left="8px" />
                    <FaceplateScrew bottom="8px" right="8px" />
                </>
            )}
            {children}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// LYRICS PANEL
// ─────────────────────────────────────────────────────────────
function LyricsPanel({
    parsedLyrics, activeLyricIndex, isSynced, isLoadingLyrics,
    lyricsError, accentColor, accentRgba,
    lyricsContainerRef, activeLyricRef,
    showManualSearch, setShowManualSearch,
    manualSearchQuery, setManualSearchQuery,
    handleManualSearch, seekTo, isMobile
}) {
    return (
        <GlassPanel screws={true} style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mic2 size={14} color={accentColor} />
                    <span style={{
                        fontSize: '11px', fontWeight: '800',
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.55)'
                    }}>
                        Lyrics
                    </span>
                    {isSynced && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '3px',
                            background: `${accentColor}22`,
                            border: `1px solid ${accentColor}44`,
                            borderRadius: '999px', padding: '2px 7px'
                        }}>
                            <Zap size={9} color={accentColor} />
                            <span style={{ fontSize: '9px', fontWeight: '800', color: accentColor, letterSpacing: '0.06em' }}>LIVE</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowManualSearch(s => !s)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 10px', borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.09)',
                        background: showManualSearch ? `${accentColor}22` : 'rgba(255,255,255,0.04)',
                        color: showManualSearch ? accentColor : 'rgba(255,255,255,0.4)',
                        fontSize: '11px', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.05)'
                    }}
                >
                    {showManualSearch ? <X size={11} /> : <Search size={11} />}
                    {showManualSearch ? 'Close' : 'Search'}
                </button>
            </div>

            {/* Manual Search */}
            <AnimatePresence>
                {showManualSearch && (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleManualSearch}
                        style={{ overflow: 'hidden', flexShrink: 0 }}
                    >
                        <div style={{
                            display: 'flex', gap: '8px',
                            padding: '12px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                            <input
                                type="text"
                                value={manualSearchQuery}
                                onChange={e => setManualSearchQuery(e.target.value)}
                                placeholder="Song name…"
                                autoFocus
                                style={{
                                    flex: 1, padding: '9px 14px', borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.35)',
                                    color: '#fff', fontSize: '13px', outline: 'none',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                                }}
                            />
                            <button type="submit" style={{
                                padding: '9px 16px', borderRadius: '10px',
                                border: 'none', background: accentColor,
                                color: '#fff', fontSize: '12px', fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: `0 4px 12px ${accentColor}55, inset 0 1px 1px rgba(255,255,255,0.2)`
                            }}>Go</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Lyrics scroll area */}
            <div
                ref={lyricsContainerRef}
                style={{
                    flex: 1, overflowY: 'auto', padding: isMobile ? '20px 16px' : '28px 24px',
                    scrollbarWidth: 'none',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 82%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 82%, transparent 100%)'
                }}
            >
                {isLoadingLyrics ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                        <Disc3 size={36} color={`${accentColor}88`} className="vinyl-spin" />
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Fetching lyrics…</span>
                    </div>
                ) : lyricsError ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '20px' }}>
                        <Mic2 size={34} color="rgba(255,255,255,0.1)" />
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0, lineHeight: 1.7, maxWidth: '220px' }}>{lyricsError}</p>
                        {!showManualSearch && (
                            <button onClick={() => setShowManualSearch(true)} style={{
                                padding: '8px 16px', borderRadius: '8px',
                                border: `1px solid ${accentColor}55`,
                                background: `${accentColor}18`, color: accentColor,
                                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                letterSpacing: '0.04em'
                            }}>Search Manually</button>
                        )}
                    </div>
                ) : parsedLyrics.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {parsedLyrics.map((lyric, i) => {
                            const isActive = i === activeLyricIndex
                            const isPast = i < activeLyricIndex
                            return (
                                <div
                                    key={i}
                                    ref={isActive ? activeLyricRef : null}
                                    onClick={() => isSynced && seekTo(lyric.time)}
                                    style={{
                                        fontSize: isActive ? 'clamp(1.1rem, 2.2vw, 1.45rem)' : 'clamp(0.9rem, 1.7vw, 1.1rem)',
                                        fontWeight: isActive ? '800' : '600',
                                        lineHeight: 1.35,
                                        letterSpacing: isActive ? '-0.02em' : '-0.005em',
                                        color: isActive ? '#fff' : isPast ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.35)',
                                        cursor: isSynced ? 'pointer' : 'default',
                                        padding: '8px 0',
                                        transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                                        textShadow: isActive ? `0 0 32px ${accentColor}66` : 'none'
                                    }}
                                >
                                    {lyric.text}
                                </div>
                            )
                        })}
                        <div style={{ height: '80px' }} />
                    </div>
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '13px' }}>
                        No lyrics loaded.
                    </div>
                )}
            </div>
        </GlassPanel>
    )
}

// ─────────────────────────────────────────────────────────────
// IMMERSIVE QUEUE PANEL
// ─────────────────────────────────────────────────────────────
function ImmersiveQueuePanel({
    queue, currentSong, playSong, removeFromQueue, reorderQueue, clearQueue,
    accentColor, accentRgba, fonts, isMobile
}) {
    const [draggedIndex, setDraggedIndex] = useState(null)
    const [dragOverIndex, setDragOverIndex] = useState(null)

    // Calculate total duration of all songs in queue
    const totalDuration = queue.reduce((total, song) => total + (Number(song.duration) || 0), 0) +
        (currentSong ? (Number(currentSong.duration) || 0) : 0)

    const handleDragStart = (e, index) => {
        setDraggedIndex(index)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', index)
        if (e.currentTarget) e.currentTarget.style.opacity = '0.4'
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()
        if (draggedIndex === index) return
        setDragOverIndex(index)
    }

    const handleDragEnd = (e) => {
        setDraggedIndex(null)
        setDragOverIndex(null)
        if (e.currentTarget) e.currentTarget.style.opacity = '1'
    }

    const handleDrop = (e, index) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return
        reorderQueue(draggedIndex, index)
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    return (
        <GlassPanel screws={true} style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '12px 14px' : '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ListMusic size={14} color={accentColor} style={{ flexShrink: 0 }} />
                        <span style={{
                            fontSize: '11px', fontWeight: '800',
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.55)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            Up Next
                        </span>
                    </div>
                    <div style={{
                        fontSize: '9px',
                        color: 'rgba(255,255,255,0.3)',
                        marginTop: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                    }}>
                        <span>{(queue.length + (currentSong ? 1 : 0))} track{(queue.length + (currentSong ? 1 : 0)) !== 1 ? 's' : ''}</span>
                        {(queue.length > 0 || currentSong) && (
                            <>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Clock size={9} style={{ opacity: 0.7 }} />
                                    {formatDuration(totalDuration)}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {queue.length > 0 && (
                    <button
                        onClick={clearQueue}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '5px 10px', borderRadius: '8px',
                            border: '1px solid rgba(255,75,75,0.15)',
                            background: 'rgba(255,75,75,0.04)',
                            color: 'rgba(255,107,107,0.8)',
                            fontSize: '11px', fontWeight: '600',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,75,75,0.12)'
                            e.currentTarget.style.color = '#FF6B6B'
                            e.currentTarget.style.borderColor = 'rgba(255,75,75,0.25)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,75,75,0.04)'
                            e.currentTarget.style.color = 'rgba(255,107,107,0.8)'
                            e.currentTarget.style.borderColor = 'rgba(255,75,75,0.15)'
                        }}
                    >
                        <Trash2 size={11} />
                        Clear Queue
                    </button>
                )}
            </div>

            {/* List Body */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: isMobile ? '12px 14px' : '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '12px' : '16px',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
            }}>
                {/* Now Playing Header Card */}
                {currentSong && (
                    <div style={{ width: '100%', minWidth: 0 }}>
                        <div style={{
                            fontSize: '9px',
                            color: accentColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '6px',
                            fontWeight: 800,
                        }}>Now Playing</div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            background: accentRgba(0.06),
                            border: `1px solid ${accentRgba(0.22)}`,
                            boxShadow: `inset 1px 2px 4px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.1)`,
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            {/* Album Art */}
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                            }}>
                                <img 
                                    src={currentSong.image?.[2]?.link || currentSong.image?.[1]?.link || currentSong.image?.[0]?.link || ''} 
                                    alt="" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            </div>
                            
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: isMobile ? '0.86rem' : '0.82rem',
                                    color: '#fff',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>{currentSong.name || currentSong.title}</div>
                                <div style={{
                                    fontSize: isMobile ? '0.70rem' : '0.66rem',
                                    color: 'rgba(255,255,255,0.4)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginTop: '1px',
                                }}>{currentSong.primaryArtists || 'Unknown Artist'}</div>
                            </div>

                            {/* Active bouncing bars */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '10px', marginRight: '4px', flexShrink: 0 }}>
                                {[0.5, 1, 0.4, 0.75].map((h, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: '2px',
                                            height: `${h * 100}%`,
                                            background: accentColor,
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

                {/* Queue Tracks */}
                <div style={{ width: '100%', minWidth: 0 }}>
                    <div style={{
                        fontSize: '9px',
                        color: 'rgba(255,255,255,0.35)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '6px',
                        fontWeight: 800,
                    }}>Next Up</div>

                    {queue.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '36px 12px',
                            gap: '10px',
                            color: 'rgba(255,255,255,0.25)',
                            background: 'rgba(255,255,255,0.015)',
                            borderRadius: '12px',
                            border: `1px dashed rgba(255,255,255,0.08)`,
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Music2 size={30} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: 'rgba(255,255,255,0.45)'
                            }}>
                                No upcoming songs
                            </div>
                            <div style={{
                                fontSize: '0.66rem',
                                textAlign: 'center',
                                maxWidth: '240px',
                                lineHeight: 1.4,
                                opacity: 0.8,
                            }}>
                                Add songs from discovery or search results to build your list.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                            {queue.map((song, index) => {
                                const imageUrl = song.image?.[2]?.link || song.image?.[2]?.url ||
                                    song.image?.[1]?.link || song.image?.[1]?.url ||
                                    song.image?.[0]?.link || song.image?.[0]?.url ||
                                    song.imageUrl || ''
                                
                                const isBeingDragged = index === draggedIndex
                                const isDragTarget = index === dragOverIndex

                                return (
                                    <div
                                        key={`${song.id}-${index}`}
                                        draggable={!isMobile ? "true" : "false"}
                                        onDragStart={(e) => !isMobile && handleDragStart(e, index)}
                                        onDragOver={(e) => !isMobile && handleDragOver(e, index)}
                                        onDragEnd={!isMobile && handleDragEnd}
                                        onDrop={(e) => !isMobile && handleDrop(e, index)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 10px',
                                            borderRadius: '10px',
                                            border: isBeingDragged
                                                ? `1.5px dashed ${accentColor}`
                                                : isDragTarget
                                                    ? `1.5px solid ${accentColor}`
                                                    : `1px solid transparent`,
                                            background: isBeingDragged
                                                ? 'rgba(255,255,255,0.02)'
                                                : isDragTarget
                                                    ? 'rgba(255,255,255,0.05)'
                                                    : 'transparent',
                                            opacity: isBeingDragged ? 0.5 : 1,
                                            transform: isDragTarget ? 'scale(1.01)' : 'scale(1)',
                                            transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                                            cursor: !isMobile ? 'grab' : 'default',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isMobile && draggedIndex === null) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                                                e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.05)`
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isMobile && draggedIndex === null) {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.boxShadow = 'none'
                                            }
                                        }}
                                    >
                                        {/* Drag handle - Desktop only to save space and avoid scroll blocking on touch screen */}
                                        {!isMobile && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'rgba(255,255,255,0.3)',
                                                cursor: 'grab',
                                                opacity: 0.6,
                                                transition: 'opacity 0.15s',
                                                flexShrink: 0
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                                            >
                                                <GripVertical size={14} />
                                            </div>
                                        )}

                                        {/* Album Art */}
                                        <div
                                            onClick={() => playSong(song)}
                                            style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '6px',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                background: 'rgba(255,255,255,0.03)',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                boxShadow: `0 1px 3px rgba(0,0,0,0.3)`,
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
                                                    <Music2 size={14} color="rgba(255,255,255,0.2)" />
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
                                                <Play size={12} color="#fff" fill="#fff" />
                                            </div>
                                        </div>

                                        {/* Song Info */}
                                        <div
                                            onClick={() => playSong(song)}
                                            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                        >
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: isMobile ? '0.86rem' : '0.82rem',
                                                color: '#fff',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>{song.name}</div>
                                            <div style={{
                                                fontSize: isMobile ? '0.70rem' : '0.66rem',
                                                color: 'rgba(255,255,255,0.4)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                marginTop: '1px',
                                            }}>{song.primaryArtists || 'Unknown Artist'}</div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFromQueue(index)
                                            }}
                                            style={{
                                                width: isMobile ? '30px' : '26px',
                                                height: isMobile ? '30px' : '26px',
                                                borderRadius: '6px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: `1px solid rgba(255,255,255,0.06)`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'rgba(255,255,255,0.35)',
                                                transition: 'all 0.15s',
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,75,75,0.12)'
                                                e.currentTarget.style.color = '#FF6B6B'
                                                e.currentTarget.style.borderColor = 'rgba(255,75,75,0.25)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                                e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                                            }}
                                        >
                                            <Trash2 size={isMobile ? 13 : 12} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </GlassPanel>
    )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ImmersivePlayer({ isOpen, onClose }) {
    const { fonts } = useTheme()
    const {
        currentSong, isPlaying, progress, duration, volume,
        togglePlay, handleNext, handlePrevious, seekTo, setVolume,
        shuffleMode, repeatMode, toggleShuffle, toggleRepeat, dominantColor,
        queue, playSong, removeFromQueue, reorderQueue, clearQueue
    } = usePlayer()

    const [tab, setTab] = useState('lyrics')
    const [isMobile, setIsMobile] = useState(false)
    const [liked, setLiked] = useState(false)

    const lyricsContainerRef = useRef(null)
    const activeLyricRef = useRef(null)

    const [parsedLyrics, setParsedLyrics] = useState([])
    const [isSynced, setIsSynced] = useState(false)
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false)
    const [lyricsError, setLyricsError] = useState('')
    const [manualSearchQuery, setManualSearchQuery] = useState('')
    const [showManualSearch, setShowManualSearch] = useState(false)

    // Responsive
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 820)
        h(); window.addEventListener('resize', h)
        return () => window.removeEventListener('resize', h)
    }, [])

    // Reset tab when screen size shifts
    useEffect(() => {
        if (isMobile) {
            setTab('player')
        } else {
            setTab('lyrics')
        }
    }, [isMobile])

    // Lyrics fetch
    useEffect(() => {
        if (!isOpen || !currentSong) return
        fetchLyrics()
        // eslint-disable-next-line
    }, [isOpen, currentSong])

    const cleanTrackName = (name) => {
        if (!name) return ''
        return name
            .replace(/\(From\s+[^)]+\)/gi, '') 
            .replace(/\(with\s+[^)]+\)/gi, '') 
            .replace(/\[From\s+[^\]]+\]/gi, '') 
            .replace(/\(feat\.\s+[^)]+\)/gi, '') 
            .replace(/\[feat\.\s+[^\]]+\]/gi, '') 
            .replace(/\(ft\.\s+[^)]+\)/gi, '') 
            .replace(/\[ft\.\s+[^\]]+\]/gi, '') 
            .replace(/\(Lofi[^\)]*\)/gi, '')
            .replace(/\[Lofi[^\]]*\]/gi, '')
            .replace(/\(Remix[^\)]*\)/gi, '')
            .replace(/\[Remix[^\]]*\]/gi, '')
            .replace(/\(Acoustic[^\)]*\)/gi, '')
            .replace(/\(Live[^\)]*\)/gi, '')
            .replace(/\(Reprise[^\)]*\)/gi, '')
            .replace(/\s+-\s+From\s+.*$/gi, '') 
            .replace(/\s+-\s+Single$/gi, '') 
            .trim()
    }

    const getFirstArtist = (artistStr) => {
        if (!artistStr) return ''
        const parts = artistStr.split(/[,;&]|\band\b/i)
        return parts[0] ? parts[0].trim() : ''
    }

    const fetchLyrics = async (customQuery) => {
        setIsLoadingLyrics(true)
        setLyricsError('')
        setParsedLyrics([])
        setShowManualSearch(false)

        const rawSongName = currentSong.name || currentSong.title || ''
        const dur = parseFloat(currentSong.duration) || 0

        const queryStr = customQuery ? customQuery : rawSongName

        if (!queryStr && !customQuery) {
            setLyricsError('Song title is missing. Try a manual search.')
            setIsLoadingLyrics(false)
            return
        }

        if (customQuery) {
            setManualSearchQuery(customQuery)
        } else {
            setManualSearchQuery(rawSongName)
        }

        try {
            let results = []
            if (customQuery) {
                if (import.meta.env.DEV) {
                    console.log("Searching lyrics with custom query:", queryStr)
                }
                results = await client.searchLyrics({ query: queryStr })
            } else {
                const cleanedName = cleanTrackName(rawSongName)
                const fullArtists = currentSong.primaryArtists || ''
                if (import.meta.env.DEV) {
                    console.log("Searching lyrics with cleaned name:", cleanedName, "by", fullArtists)
                }
                
                const searchParams = {
                    track_name: cleanedName,
                    artist_name: fullArtists
                }
                if (dur > 0) {
                    searchParams.duration = Math.round(dur * 1000)
                }

                results = await client.searchLyrics(searchParams)

                // Fallback 1: Search with first artist name only
                if ((!results || results.length === 0) && fullArtists) {
                    const firstArtist = getFirstArtist(fullArtists)
                    if (firstArtist && firstArtist !== fullArtists) {
                        const fallbackParams = {
                            track_name: cleanedName,
                            artist_name: firstArtist
                        }
                        if (dur > 0) {
                            fallbackParams.duration = Math.round(dur * 1000)
                        }
                        if (import.meta.env.DEV) {
                            console.log("Fallback 1: Searching with first artist name:", cleanedName, "by", firstArtist)
                        }
                        results = await client.searchLyrics(fallbackParams)
                    }
                }

                // Fallback 2: Search with cleaned track name alone (as a generic search query)
                if (!results || results.length === 0) {
                    if (import.meta.env.DEV) {
                        console.log("Fallback 2: Searching by cleaned query alone:", cleanedName)
                    }
                    results = await client.searchLyrics({ query: cleanedName })
                }
            }

            if (results && results.length > 0) {
                // Find the first result that has synced or plain lyrics and is NOT instrumental
                let bestMatch = results.find(r => !r.instrumental && (r.syncedLyrics || r.plainLyrics))
                if (!bestMatch) {
                    // Fall back to first match with lyrics
                    bestMatch = results.find(r => r.syncedLyrics || r.plainLyrics)
                }
                if (!bestMatch) {
                    // Fall back to first result
                    bestMatch = results[0]
                }
                
                parseLyrics(bestMatch)
                return
            }

            setLyricsError('No lyrics found for this song.')
        } catch (e) {
            if (import.meta.env.DEV) {
                console.error('Lyrics search failed:', e)
            }
            setLyricsError('No lyrics found. Try a manual search.')
        } finally {
            setIsLoadingLyrics(false)
        }
    }

    const parseLyrics = (data) => {
        if (!data) return
        
        if (data.instrumental) {
            setLyricsError('Instrumental track - no lyrics required.')
            return
        }

        if (data.syncedLyrics) {
            const parsedResult = parseLocalLyrics(data.syncedLyrics)
            if (parsedResult && parsedResult.synced) {
                const parsed = parsedResult.synced.map(line => ({
                    time: line.startTime,
                    text: line.text || '·  ·  ·'
                }))
                setParsedLyrics(parsed)
                setIsSynced(true)
            } else {
                setLyricsError('No synced lyrics found.')
            }
        } else if (data.plainLyrics) {
            const parsedResult = parseLocalLyrics(data.plainLyrics)
            if (parsedResult && parsedResult.unsynced) {
                const parsed = parsedResult.unsynced.map((line, i) => ({
                    time: i * 4,
                    text: line.text || '·  ·  ·'
                }))
                setParsedLyrics(parsed)
                setIsSynced(false)
            } else {
                setLyricsError('No plain lyrics found.')
            }
        } else {
            setLyricsError('No lyrics found for this song.')
        }
    }

    const handleManualSearch = (e) => {
        e.preventDefault()
        if (!manualSearchQuery.trim()) return
        fetchLyrics(manualSearchQuery.trim())
    }

    // Active lyric
    const activeLyricIndex = (() => {
        if (!isSynced || !parsedLyrics.length) return -1
        let idx = -1
        for (let i = 0; i < parsedLyrics.length; i++) {
            if (progress >= parsedLyrics[i].time) idx = i; else break
        }
        return idx
    })()

    useEffect(() => {
        if (activeLyricRef.current && lyricsContainerRef.current) {
            const c = lyricsContainerRef.current
            const l = activeLyricRef.current
            c.scrollTo({ top: l.offsetTop - c.clientHeight / 2 + l.clientHeight / 2, behavior: 'smooth' })
        }
    }, [activeLyricIndex])

    // Accent color
    const accentColor = dominantColor
        ? (adjustColorForTheme(dominantColor, true)?.rgb || '#E07356')
        : '#E07356'

    const accentRgba = (a) => dominantColor
        ? (adjustColorForTheme(dominantColor, true)?.rgba(a) || `rgba(224,115,86,${a})`)
        : `rgba(224,115,86,${a})`

    // Artwork
    const getArtworkUrl = () => {
        if (!currentSong) return ''
        let url = ''
        if (Array.isArray(currentSong.image) && currentSong.image.length) {
            const last = currentSong.image[currentSong.image.length - 1]
            url = typeof last === 'string' ? last : (last.link || last.url || '')
        } else {
            url = currentSong.imageUrl || currentSong.image || ''
        }
        if (url && !url.includes('500x500')) url = url.replace('150x150', '500x500').replace('50x50', '500x500')
        return url
    }
    const imageUrl = getArtworkUrl()

    const songTitle = currentSong?.name || currentSong?.title || 'Unknown Song'
    const songArtist = currentSong?.primaryArtists || 'Unknown Artist'

    if (!isOpen || !currentSong) return null

    return (
        <AnimatePresence>
            <motion.div
                key="immersive-player"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    overflow: 'hidden',
                    fontFamily: fonts?.primary || "'Inter', sans-serif",
                    color: '#fff'
                }}
            >
                {/* ═══════════════════════════════════════════
                    BACKDROP LAYER
                ═══════════════════════════════════════════ */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    {/* Album art base fill */}
                    {imageUrl && (
                        <img src={imageUrl} alt="" style={{
                            position: 'absolute', inset: '-15%',
                            width: '130%', height: '130%',
                            objectFit: 'cover',
                            filter: 'blur(60px) saturate(2.2) brightness(0.5)',
                            transform: 'scale(1.05)',
                        }} />
                    )}
                    {/* Primary dark vignette */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: imageUrl
                            ? 'linear-gradient(160deg, rgba(6,5,4,0.70) 0%, rgba(6,5,4,0.80) 50%, rgba(6,5,4,0.95) 100%)'
                            : 'linear-gradient(135deg, #100a08 0%, #08060a 100%)'
                    }} />
                    {/* Accent color bloom — top left */}
                    <div style={{
                        position: 'absolute', top: '-12%', left: '-8%',
                        width: '65vw', height: '65vh', borderRadius: '50%',
                        background: accentRgba(0.12),
                        filter: 'blur(100px)',
                        animation: 'morphA 24s infinite alternate ease-in-out',
                        pointerEvents: 'none'
                    }} />
                    {/* Secondary bloom — bottom right */}
                    <div style={{
                        position: 'absolute', bottom: '-14%', right: '-8%',
                        width: '55vw', height: '55vh', borderRadius: '50%',
                        background: accentRgba(0.08),
                        filter: 'blur(120px)',
                        animation: 'morphB 30s infinite alternate ease-in-out',
                        pointerEvents: 'none'
                    }} />
                    {/* Noise texture overlay for depth */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                        opacity: 0.028,
                        pointerEvents: 'none'
                    }} />
                </div>

                {/* ═══════════════════════════════════════════
                    HEADER BAR
                ═══════════════════════════════════════════ */}
                <div style={{
                    position: 'relative', zIndex: 10,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                }}>
                    {/* Chevron down — skeuomorphic */}
                    <SkeuoBtn onClick={onClose} title="Minimize" size={38}>
                        <ChevronDown size={18} strokeWidth={2.5} />
                    </SkeuoBtn>

                    {/* Center tab switcher */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px',
                        borderRadius: '14px',
                        background: 'rgba(0,0,0,0.38)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.55), 0 1px 1px rgba(255,255,255,0.06)'
                    }}>
                        {[
                            ...(isMobile ? [{ id: 'player', icon: <Music2 size={12} />, label: 'Player' }] : []),
                            { id: 'lyrics', icon: <Mic2 size={12} />, label: 'Lyrics' },
                            { id: 'queue', icon: <ListMusic size={12} />, label: isMobile ? 'Queue' : 'Up Next' }
                        ].map(({ id, icon, label }) => (
                            <button key={id} onClick={() => setTab(id)} style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: isMobile ? '6px 10px' : '6px 14px', borderRadius: '10px',
                                border: tab === id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                background: tab === id
                                    ? `linear-gradient(145deg, ${accentColor}cc, ${accentColor}99)`
                                    : 'transparent',
                                boxShadow: tab === id
                                    ? `0 2px 8px ${accentColor}44, inset 0 1px 1px rgba(255,255,255,0.18)`
                                    : 'none',
                                color: tab === id ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: isMobile ? '11px' : '12px', fontWeight: '700',
                                letterSpacing: '0.03em', cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}>
                                {icon} {label}
                            </button>
                        ))}
                    </div>

                    {/* Right spacer or Radio mode indicator */}
                    {isMobile ? (
                        <div style={{ width: '38px' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)' }}>
                            <Radio size={15} />
                        </div>
                    )}
                </div>

                {/* ═══════════════════════════════════════════
                    MAIN BODY
                ═══════════════════════════════════════════ */}
                <div style={{
                    position: 'relative', zIndex: 5,
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)',
                    gap: '20px',
                    height: 'calc(100vh - 76px)',
                    padding: isMobile ? '8px 16px 20px' : '8px 28px 24px',
                    boxSizing: 'border-box',
                    alignItems: 'center'
                }}>

                    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        LEFT COLUMN: ARTWORK + CONTROLS
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {(!isMobile || tab === 'player') && (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            height: '100%', gap: 'clamp(8px, 2.5vh, 18px)',
                            paddingBottom: '12px',
                            paddingRight: isMobile ? 0 : '12px',
                            width: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box'
                        }}>

                        {/* ── Artwork + Vinyl ── */}
                        <div style={{
                            position: 'relative',
                            width: 'min(33vh, 280px)',
                            height: 'min(33vh, 280px)',
                            flexShrink: 0
                        }}>
                            {/* Ambient glow */}
                            {imageUrl && (
                                <div style={{
                                    position: 'absolute', inset: '-20px',
                                    borderRadius: '24px',
                                    background: accentRgba(0.22),
                                    filter: 'blur(32px)', zIndex: 0
                                }} />
                            )}

                            {/* Vinyl disc */}
                            <div style={{
                                position: 'absolute', top: '6%', left: '6%',
                                width: '88%', height: '88%', zIndex: 1,
                                transform: isPlaying 
                                    ? (isMobile ? 'translateX(28%)' : 'translateX(46%)') 
                                    : 'translateX(0)',
                                transition: 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)',
                                pointerEvents: 'none'
                            }}>
                                <div
                                    className={isPlaying ? 'vinyl-spin' : ''}
                                    style={{
                                        width: '100%', height: '100%', borderRadius: '50%',
                                        background: 'radial-gradient(circle at 50% 50%, #1a1a1a 30%, #111 38%, #0d0d0d 46%, #181818 58%, #0b0b0b 72%, #1c1c1c 100%)',
                                        boxShadow: '0 8px 36px rgba(0,0,0,0.65), inset 0 0 24px rgba(0,0,0,0.8)',
                                        position: 'relative', overflow: 'hidden', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {/* Groove rings */}
                                    {[8, 16, 24, 34, 44, 56, 70].map(r => (
                                        <div key={r} style={{ position: 'absolute', inset: `${r}px`, border: '1px solid rgba(255,255,255,0.016)', borderRadius: '50%' }} />
                                    ))}
                                    {/* Sheen */}
                                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(130deg, rgba(255,255,255,0.08) 0%, transparent 55%)', zIndex: 2 }} />
                                    {/* Center label */}
                                    <div style={{ width: '33%', height: '33%', borderRadius: '50%', overflow: 'hidden', position: 'relative', zIndex: 3, border: '2.5px solid #181818', boxShadow: '0 0 0 2px rgba(255,255,255,0.04)' }}>
                                        {imageUrl ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: accentColor }} />}
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: 'rgba(8,6,6,0.95)', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Album Art — skeuomorphic frame */}
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 2,
                                borderRadius: '18px', overflow: 'hidden',
                                /* Deep embossed frame */
                                boxShadow: `
                                    0 32px 80px rgba(0,0,0,0.65),
                                    0 8px 24px rgba(0,0,0,0.4),
                                    0 0 0 1px rgba(255,255,255,0.1),
                                    0 0 0 4px rgba(0,0,0,0.5),
                                    0 0 0 5px rgba(255,255,255,0.05),
                                    inset 0 0 0 1px rgba(255,255,255,0.08)
                                `
                            }}>
                                {imageUrl
                                    ? <img src={imageUrl} alt={songTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    : (
                                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Music2 size={64} color="rgba(255,255,255,0.15)" />
                                        </div>
                                    )}
                                {/* Gloss overlay on artwork */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(155deg, rgba(255,255,255,0.07) 0%, transparent 45%, rgba(0,0,0,0.12) 100%)',
                                    pointerEvents: 'none'
                                }} />
                            </div>
                        </div>

                        {/* ── Song Info ── */}
                        <div style={{ textAlign: 'center', width: '100%', maxWidth: '320px', padding: '0 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '5px' }}>
                                <h2 style={{
                                    fontSize: 'clamp(1.25rem, 3vh, 1.65rem)',
                                    fontWeight: '800',
                                    margin: 0, letterSpacing: '-0.025em', color: '#fff',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    maxWidth: 'calc(100% - 44px)',
                                    textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {songTitle.length > 20 ? (
                                        <Tooltip text={songTitle}>
                                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {songTitle}
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        songTitle
                                    )}
                                </h2>
                                <button
                                    onClick={() => setLiked(p => !p)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: '4px', flexShrink: 0, display: 'flex', transition: 'transform 0.2s'
                                    }}
                                    title={liked ? 'Unlike' : 'Like'}
                                >
                                    <Heart
                                        size={17}
                                        fill={liked ? accentColor : 'none'}
                                        color={liked ? accentColor : 'rgba(255,255,255,0.38)'}
                                        strokeWidth={2}
                                    />
                                </button>
                            </div>
                            <p style={{
                                fontSize: 'clamp(0.82rem, 1.8vh, 0.95rem)',
                                margin: 0, fontWeight: '500',
                                color: 'rgba(255,255,255,0.45)',
                                letterSpacing: '0.01em',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                width: '100%'
                            }}>
                                {songArtist.length > 28 ? (
                                    <Tooltip text={songArtist}>
                                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {songArtist}
                                        </span>
                                    </Tooltip>
                                ) : (
                                    songArtist
                                )}
                            </p>
                            {(() => {
                                const albumName = typeof currentSong.album === 'object'
                                    ? (currentSong.album?.name || '')
                                    : (currentSong.album || '')
                                return albumName && (
                                    <p style={{
                                        fontSize: 'clamp(0.72rem, 1.5vh, 0.82rem)',
                                        margin: '3px 0 0',
                                        fontWeight: '500',
                                        color: 'rgba(255,255,255,0.24)',
                                        fontStyle: 'italic',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        Album: {albumName}
                                    </p>
                                )
                            })()}
                        </div>

                        {/* ── Visualizer ── */}
                        {!isMobile && (
                            <div style={{
                                width: '85%', maxWidth: '280px', height: 'clamp(20px, 2.5vh, 28px)',
                                opacity: isPlaying ? 0.65 : 0,
                                transition: 'opacity 0.6s ease'
                            }}>
                                <AudioVisualizer />
                            </div>
                        )}

                        {/* ── Controls Panel ── */}
                        <GlassPanel screws={true} style={{
                            borderRadius: '22px',
                            padding: '16px 20px',
                            width: '100%', maxWidth: '360px',
                            display: 'flex', flexDirection: 'column', gap: '14px',
                            boxSizing: 'border-box'
                        }}>
                            {/* Progress */}
                            <SkeuoProgress
                                progress={progress}
                                duration={duration}
                                seekTo={seekTo}
                                accentColor={accentColor}
                            />

                            {/* Transport Row (Recessed Shelf) */}
                            <div style={{
                                width: '100%',
                                padding: '4px 8px',
                                borderRadius: '16px',
                                background: 'rgba(0,0,0,0.22)',
                                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.65), 0 1px 1px rgba(255,255,255,0.06)',
                                border: '1px solid rgba(0,0,0,0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxSizing: 'border-box',
                                position: 'relative'
                            }}>
                                {/* Shuffle */}
                                <button
                                    onClick={toggleShuffle}
                                    className={`icon-btn ske-spring-btn ${shuffleMode ? 'active' : ''}`}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: shuffleMode ? '#fff' : 'rgba(255,255,255,0.45)',
                                    }}
                                    title={shuffleMode ? "Shuffle: On" : "Shuffle: Off"}
                                >
                                    <Shuffle size={16} />
                                    {shuffleMode && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '3px',
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: accentColor,
                                            boxShadow: `0 0 6px 1px ${accentColor}`,
                                            animation: 'pulseGlow 1.5s infinite alternate',
                                        }} />
                                    )}
                                </button>

                                {/* Previous */}
                                <button
                                    onClick={handlePrevious}
                                    disabled={!currentSong}
                                    className="icon-btn ske-spring-btn"
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.75)',
                                    }}
                                    title="Previous"
                                >
                                    <SkipBack size={18} fill="currentColor" color="currentColor" />
                                </button>

                                {/* Play / Pause dedicated circular recessed well */}
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.35)',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 1px rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(0,0,0,0.45)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <button
                                        onClick={togglePlay}
                                        disabled={!currentSong}
                                        className="ske-raised ske-spring-btn"
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: isPlaying ? accentColor : 'rgba(255,255,255,0.08)',
                                            color: isPlaying ? '#120e0c' : '#fff',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: currentSong ? 'pointer' : 'default',
                                            boxShadow: isPlaying 
                                                ? `0 3px 10px ${accentColor}55, inset 0 1px 1px rgba(255,255,255,0.25)` 
                                                : '0 3px 8px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.12)',
                                            transition: 'all 0.15s ease',
                                            outline: 'none'
                                        }}
                                        title={isPlaying ? "Pause" : "Play"}
                                    >
                                        {isPlaying ? (
                                            <Pause size={18} fill="currentColor" color="currentColor" />
                                        ) : (
                                            <Play size={18} fill="currentColor" color="currentColor" style={{ marginLeft: '1.5px' }} />
                                        )}
                                    </button>
                                </div>

                                {/* Next */}
                                <button
                                    onClick={handleNext}
                                    disabled={!currentSong}
                                    className="icon-btn ske-spring-btn"
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.75)',
                                    }}
                                    title="Next"
                                >
                                    <SkipForward size={18} fill="currentColor" color="currentColor" />
                                </button>

                                {/* Repeat */}
                                <button
                                    onClick={toggleRepeat}
                                    className={`icon-btn ske-spring-btn ${repeatMode !== 'none' ? 'active' : ''}`}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: repeatMode !== 'none' ? '#fff' : 'rgba(255,255,255,0.45)',
                                    }}
                                    title={`Repeat: ${repeatMode}`}
                                >
                                    {repeatMode === 'one' ? (
                                        <Repeat1 size={16} />
                                    ) : (
                                        <Repeat size={16} />
                                    )}
                                    {repeatMode !== 'none' && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '3px',
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: accentColor,
                                            boxShadow: `0 0 6px 1px ${accentColor}`,
                                            animation: 'pulseGlow 1.5s infinite alternate',
                                        }} />
                                    )}
                                </button>
                            </div>

                            {/* Volume */}
                            <SkeuoVolume volume={volume} setVolume={setVolume} accentColor={accentColor} />
                        </GlassPanel>
                    </div>
                )}

                    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        RIGHT COLUMN: LYRICS / QUEUE
                    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {(!isMobile || tab === 'lyrics' || tab === 'queue') && (
                        <div style={{
                            height: isMobile ? '100%' : 'calc(100% - 8px)', minHeight: 0,
                            display: 'flex', flexDirection: 'column',
                            paddingLeft: isMobile ? 0 : '8px',
                            width: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box'
                        }}>
                            {tab === 'lyrics' ? (
                                <LyricsPanel
                                    parsedLyrics={parsedLyrics}
                                    activeLyricIndex={activeLyricIndex}
                                    isSynced={isSynced}
                                    isLoadingLyrics={isLoadingLyrics}
                                    lyricsError={lyricsError}
                                    accentColor={accentColor}
                                    accentRgba={accentRgba}
                                    lyricsContainerRef={lyricsContainerRef}
                                    activeLyricRef={activeLyricRef}
                                    showManualSearch={showManualSearch}
                                    setShowManualSearch={setShowManualSearch}
                                    manualSearchQuery={manualSearchQuery}
                                    setManualSearchQuery={setManualSearchQuery}
                                    handleManualSearch={handleManualSearch}
                                    seekTo={seekTo}
                                    isMobile={isMobile}
                                />
                            ) : (
                                <ImmersiveQueuePanel
                                    queue={queue}
                                    currentSong={currentSong}
                                    playSong={playSong}
                                    removeFromQueue={removeFromQueue}
                                    reorderQueue={reorderQueue}
                                    clearQueue={clearQueue}
                                    accentColor={accentColor}
                                    accentRgba={accentRgba}
                                    fonts={fonts}
                                    isMobile={isMobile}
                                />
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
