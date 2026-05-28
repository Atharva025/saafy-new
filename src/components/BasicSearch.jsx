import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { searchSongs } from '@/lib/api'
import { debounce } from '@/lib/security'
import { useTheme } from '@/context/ThemeContext'
import { usePlayer } from '@/context/PlayerContext'

// Rotating placeholder phrases
const placeholders = [
    "Search for songs, artists, albums...",
    "Find the song stuck in your head...",
    "Discover something new today...",
    "What do you want to listen to?",
    "Search music that matches your mood...",
    "Find songs for late-night coding...",
    "Explore music beyond your comfort zone...",
]



// ─── Vibe Name Mapper (Poetic Emotional Trails) ──────────────────────────────
const getEmotionalTrailForSong = (song) => {
    if (!song) return "Late Night Synths"
    
    const title = (song.name || song.title || "").toLowerCase()
    const artist = (song.primaryArtists || song.singers || "").toLowerCase()
    const lang = (song.language || "").toLowerCase()
    
    // Check artist matches
    if (artist.includes("arijit") || artist.includes("jubin") || artist.includes("atif") || artist.includes("shreya")) {
        return "Arijit Romance"
    }
    if (artist.includes("honey") || artist.includes("badshah") || artist.includes("diljit") || artist.includes("raftaar") || artist.includes("king")) {
        return "Party Monster"
    }
    if (artist.includes("sidhu") || artist.includes("dhillon") || artist.includes("aujla") || artist.includes("shubh")) {
        return "Punjabi Beats"
    }
    
    // Check title / keyword / language matches
    if (title.includes("party") || title.includes("dance") || title.includes("club") || title.includes("makhna")) {
        return "Party Monster"
    }
    if (title.includes("sad") || title.includes("judai") || title.includes("lofi") || title.includes("alone") || title.includes("synths") || title.includes("night")) {
        return "Late Night Synths"
    }
    if (title.includes("monsoon") || title.includes("rain") || title.includes("baaris") || title.includes("sawan") || title.includes("acoustics")) {
        return "Monsoon Vibes"
    }
    if (lang === "marathi") {
        return "Marathi Soul"
    }
    if (lang === "punjabi") {
        return "Punjabi Beats"
    }
    
    // Fallbacks
    if (lang === "english") {
        return "Late Night Synths"
    }
    if (lang === "hindi") {
        return "Bollywood Melodies"
    }
    
    return "Late Night Synths"
}

// ─── Relative Time Calculator ───────────────────────────────────────────────
const getRelativeTime = (playedAt) => {
    if (!playedAt) return "Recently"
    const diffMs = Date.now() - playedAt
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return "Yesterday"
    return `${diffDays}d ago`
}

// ─── Trail Row Component (Premium Minimal List Row) ─────────────────────────
function TrailRow({ song, index, vibeTitle, timeString, onPlay, colors, fonts, isDark }) {
    const [hovered, setHovered] = useState(false)
    
    const imageUrl = song.image?.[0]?.link || song.image?.[0]?.url ||
        song.image?.[1]?.link || song.image?.[1]?.url ||
        song.image?.[2]?.link || song.image?.[2]?.url ||
        song.imageUrl || ''

    return (
        <div
            onClick={() => onPlay(song)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                background: hovered ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)') : 'transparent',
                transition: 'background-color 0.2s ease',
                marginBottom: '4px',
                position: 'relative',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                {/* Tiny Album Art */}
                <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: colors.paperDarker,
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                    boxShadow: 'var(--shadow-ske-xs)',
                    flexShrink: 0,
                }}>
                    {imageUrl ? (
                        <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={colors.inkLight}>
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Title and details info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{
                        fontFamily: fonts.primary,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: colors.ink,
                        letterSpacing: '-0.01em',
                    }}>
                        {vibeTitle}
                    </div>
                    <div style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.72rem',
                        color: colors.inkMuted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {song.name} <span style={{ opacity: 0.65 }}>· {song.primaryArtists}</span>
                    </div>
                </div>
            </div>

            {/* Timestamp/Play arrow */}
            <div style={{ marginLeft: '12px', flexShrink: 0 }}>
                {hovered ? (
                    <button
                        className="ske-raised"
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--color-paper-dark)',
                            color: 'var(--color-ink)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-ske-xs)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            padding: 0,
                        }}
                        title="Play"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '1.5px' }}>
                            <path d="M8 5v14l11-7L8 5z" />
                        </svg>
                    </button>
                ) : (
                    <span style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.72rem',
                        color: colors.inkLight,
                    }}>
                        {timeString}
                    </span>
                )}
            </div>
        </div>
    )
}

export default function BasicSearch({ onSelectSong, setSearchResults, setIsSearching, featuredSongs = [], listeningHistory = [] }) {
    const { colors, fonts, isDark } = useTheme()
    const { addToQueue } = usePlayer()

    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [isFocused, setIsFocused] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [addedSongs, setAddedSongs] = useState({})
    const inputRef = useRef(null)
    const containerRef = useRef(null)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

    const handleAddToQueue = (song) => {
        addToQueue(song)
        setAddedSongs(prev => ({ ...prev, [song.id]: true }))
        setTimeout(() => {
            setAddedSongs(prev => ({ ...prev, [song.id]: false }))
        }, 2000)
    }

    useEffect(() => {
        const handleKeyDownGlobal = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDownGlobal)
        return () => window.removeEventListener('keydown', handleKeyDownGlobal)
    }, [])

    useEffect(() => {
        if (query) return
        const interval = setInterval(() => {
            setIsAnimating(true)
            setTimeout(() => {
                setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
                setIsAnimating(false)
            }, 400)
        }, 4000)
        return () => clearInterval(interval)
    }, [query])

    const debouncedSearch = useRef(
        debounce(async (searchQuery) => {
            if (searchQuery.length < 2) {
                setSuggestions([])
                return
            }
            setLoading(true)
            try {
                const response = await searchSongs(searchQuery, 0, 8)
                if (response.success && response.data?.results) {
                    setSuggestions(response.data.results)
                    setShowSuggestions(true)
                }
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setLoading(false)
            }
        }, 300)
    ).current

    useEffect(() => {
        debouncedSearch(query)
    }, [query])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false)
                setIsExpanded(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleInputChange = (e) => {
        setQuery(e.target.value)
        setSelectedIndex(-1)
    }

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((prev) => Math.max(prev - 1, -1))
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault()
            handleSelectSong(suggestions[selectedIndex])
        } else if (e.key === 'Escape') {
            setShowSuggestions(false)
        }
    }

    const handleSelectSong = (song) => {
        onSelectSong?.(song)
        setQuery('')
        setSuggestions([])
        setShowSuggestions(false)
        setIsExpanded(false)
    }

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!query.trim()) return
        setLoading(true)
        try {
            const response = await searchSongs(query, 0, 20)
            if (response.success && response.data?.results) {
                setSearchResults?.(response.data.results)
                setIsSearching?.(true)
                setShowSuggestions(false)
                setIsExpanded(false)
                inputRef.current?.blur()
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Backdrop blur overlay - only show when focused */}
            {isFocused && typeof document !== 'undefined' && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        zIndex: 49,
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                    onClick={() => {
                        setIsExpanded(false)
                        setShowSuggestions(false)
                        setIsFocused(false)
                    }}
                />,
                document.body
            )}

            {isExpanded && (
                <div style={{
                    width: '100%',
                    maxWidth: '480px',
                    height: '44px',
                    flexShrink: 0,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                }} />
            )}

            <div
                ref={containerRef}
                style={{
                    position: isExpanded ? 'fixed' : 'relative',
                    top: isExpanded ? '90px' : 'auto',
                    left: isExpanded ? '50%' : 'auto',
                    transform: isExpanded ? 'translate(-50%, 0)' : 'scale(1)',
                    transformOrigin: 'center center',
                    width: isExpanded ? (isMobile ? '90%' : 'min(680px, 80vw)') : '100%',
                    maxWidth: isExpanded ? 'none' : '480px',
                    zIndex: isExpanded ? 55 : 'auto',
                    transition: 'transform 0.3s cubic-bezier(0.2, 0, 0, 1), width 0.3s cubic-bezier(0.2, 0, 0, 1), max-width 0.3s cubic-bezier(0.2, 0, 0, 1)',
                }}
            >
                <form onSubmit={handleSearch}>
                    <div
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        style={{
                            position: 'relative',
                            background: colors.paperDark,
                            backgroundImage: 'var(--background-image-ske-recessed)',
                            borderRadius: isExpanded ? '28px' : '22px',
                            border: isFocused
                                ? `1.5px solid ${colors.accent}`
                                : isHovered
                                    ? `1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`
                                    : `1px solid var(--color-border)`,
                            boxShadow: isFocused
                                ? `var(--shadow-ske-focus)`
                                : isHovered
                                    ? `inset 1px 2px 6px var(--ske-inner-shadow), 0 2px 8px ${colors.accent}12`
                                    : isExpanded
                                        ? `inset 2px 3px 10px var(--ske-shadow), inset -1px -1px 5px var(--ske-highlight), 0 12px 36px var(--ske-shadow)`
                                        : `inset 1px 2px 6px var(--ske-inner-shadow), inset -1px -1px 3px var(--ske-inner-highlight)`,
                            transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            height: isExpanded ? '56px' : '44px',
                            gap: '12px',
                            transition: 'height 0.3s ease',
                        }}>
                            <svg
                                width={isExpanded ? "20" : "18"}
                                height={isExpanded ? "20" : "18"}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={isFocused ? colors.accent : (isHovered ? colors.ink : colors.inkMuted)}
                                strokeWidth="2.5"
                                style={{ flexShrink: 0, transition: 'all 0.3s', transform: isFocused ? 'scale(1.08)' : 'scale(1)' }}
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>

                            <div style={{ flex: 1, position: 'relative', height: '24px' }}>
                                {!query && (
                                    <div
                                        key={placeholderIndex}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            top: 0,
                                            bottom: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontFamily: fonts.primary,
                                            fontSize: isExpanded ? '0.95rem' : '0.875rem',
                                            color: colors.inkMuted,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            pointerEvents: 'none',
                                            opacity: isAnimating ? 0 : 1,
                                            transform: isAnimating ? 'translateY(-8px)' : 'translateY(0)',
                                            transition: 'opacity 0.3s ease, transform 0.3s ease, font-size 0.3s ease',
                                        }}
                                    >
                                        {placeholders[placeholderIndex]}
                                    </div>
                                )}

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => {
                                        setIsFocused(true)
                                        setIsExpanded(true)
                                        if (suggestions.length > 0) setShowSuggestions(true)
                                    }}
                                    onBlur={() => setIsFocused(false)}
                                    autoComplete="off"
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '100%',
                                        height: '100%',
                                        padding: 0,
                                        fontSize: isExpanded ? '0.95rem' : '0.875rem',
                                        fontFamily: fonts.primary,
                                        background: 'transparent',
                                        color: colors.ink,
                                        border: 'none',
                                        outline: 'none',
                                        transition: 'font-size 0.3s ease',
                                    }}
                                />
                            </div>

                            {loading ? (
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: `2px solid ${colors.paperDarker}`,
                                    borderTopColor: colors.accent,
                                    borderRadius: '50%',
                                    animation: 'spin 0.6s linear infinite',
                                    flexShrink: 0,
                                }} />
                            ) : query ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery('')
                                        setSuggestions([])
                                        inputRef.current?.focus()
                                    }}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        background: colors.paperDarker,
                                        border: 'none',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: colors.inkMuted,
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            ) : isExpanded ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsExpanded(false)
                                        setShowSuggestions(false)
                                        setIsFocused(false)
                                    }}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: colors.inkMuted,
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            ) : (
                                !isFocused && !isMobile && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        padding: '3px 7px',
                                        borderRadius: '6px',
                                        background: 'var(--color-paper-dark)',
                                        backgroundImage: 'var(--background-image-ske-button)',
                                        border: '1px solid var(--color-border)',
                                        fontFamily: fonts.mono,
                                        fontSize: '0.62rem',
                                        fontWeight: 700,
                                        color: colors.inkMuted,
                                        userSelect: 'none',
                                        boxShadow: 'var(--shadow-ske-xs)',
                                        pointerEvents: 'none',
                                    }}>
                                        <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>Ctrl</span>
                                        <span>K</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </form>

                {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        left: 0,
                        right: 0,
                        background: 'var(--color-overlay-deep)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        borderRadius: 'clamp(14px, 3vw, 18px)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-ske-lg)',
                        overflow: 'hidden',
                        zIndex: 100,
                        animation: 'dropIn 0.15s cubic-bezier(0.25,0.46,0.45,0.94)',
                    }}>
                        <div style={{
                            maxHeight: '280px',
                            overflowY: 'auto',
                            padding: '6px',
                        }}>
                            {suggestions.map((song, index) => {
                                // Use highest quality image available - check both .link and .url
                                const imageUrl = song.image?.[2]?.link || song.image?.[2]?.url ||
                                    song.image?.[1]?.link || song.image?.[1]?.url ||
                                    song.image?.[0]?.link || song.image?.[0]?.url ||
                                    song.imageUrl || ''
                                const isSelected = index === selectedIndex

                                return (
                                    <div
                                        key={song.id}
                                        onClick={() => handleSelectSong(song)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: isExpanded ? '10px 12px' : '8px 10px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: isSelected ? colors.paperDark : 'transparent',
                                            transform: isSelected ? 'translateX(4px)' : 'translateX(0)',
                                            transition: 'background 0.2s, transform 0.25s var(--ease-spring)',
                                        }}
                                    >
                                        <div style={{
                                            width: isExpanded ? '44px' : '36px',
                                            height: isExpanded ? '44px' : '36px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            background: colors.paperDark,
                                            /* Art thumbnail raised */
                                            boxShadow: `1px 2px 4px var(--ske-shadow), -1px -1px 3px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight)`,
                                        }}>
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
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.inkLight}>
                                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontFamily: fonts.primary,
                                                fontWeight: 500,
                                                fontSize: isExpanded ? '0.875rem' : '0.8rem',
                                                color: colors.ink,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {song.name}
                                            </div>
                                            <div style={{
                                                fontFamily: fonts.mono,
                                                fontSize: isExpanded ? '0.75rem' : '0.65rem',
                                                color: colors.inkMuted,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                marginTop: '1px',
                                            }}>
                                                {song.primaryArtists}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
                                            {/* Add to Queue Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleAddToQueue(song)
                                                }}
                                                className="icon-btn"
                                                style={{
                                                    width: isExpanded ? '30px' : '26px',
                                                    height: isExpanded ? '30px' : '26px',
                                                    borderRadius: '8px',
                                                    background: addedSongs[song.id] ? 'rgba(16, 185, 129, 0.95)' : colors.paperDarker,
                                                    backgroundImage: addedSongs[song.id] ? 'none' : 'var(--background-image-ske-button)',
                                                    border: addedSongs[song.id] ? '1px solid rgba(16, 185, 129, 0.7)' : `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)'}`,
                                                    color: addedSongs[song.id] ? '#ffffff' : colors.inkMuted,
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: 'var(--shadow-ske-xs)',
                                                    transition: 'all 0.15s ease',
                                                    flexShrink: 0,
                                                }}
                                                title="Add to Queue"
                                            >
                                                {addedSongs[song.id] ? (
                                                    <svg width={isExpanded ? 14 : 12} height={isExpanded ? 14 : 12} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <svg width={isExpanded ? 14 : 12} height={isExpanded ? 14 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                )}
                                            </button>

                                            {/* Play Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSelectSong(song)
                                                }}
                                                className="ske-raised"
                                                style={{
                                                    width: isExpanded ? '30px' : '26px',
                                                    height: isExpanded ? '30px' : '26px',
                                                    borderRadius: '50%',
                                                    background: isSelected ? 'var(--color-accent)' : 'var(--color-paper-dark)',
                                                    color: isSelected ? '#ffffff' : 'var(--color-ink)',
                                                    border: '1px solid var(--color-border)',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: 'var(--shadow-ske-xs)',
                                                    transition: 'all 0.15s ease',
                                                    flexShrink: 0,
                                                }}
                                                title="Play Now"
                                            >
                                                <svg width={isExpanded ? 14 : 12} height={isExpanded ? 14 : 12} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '1px' }}>
                                                    <path d="M8 5v14l11-7L8 5z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {isExpanded && !query && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        left: 0,
                        right: 0,
                        background: 'var(--color-overlay-deep)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        borderRadius: 'clamp(14px, 3vw, 18px)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-ske-lg)',
                        overflow: 'hidden',
                        zIndex: 100,
                        padding: '20px',
                        animation: 'dropIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}>
                        <div style={{
                            fontFamily: fonts.primary,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            color: colors.inkLight,
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            paddingLeft: '4px'
                        }}>
                            <span>You were exploring...</span>
                            
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {(() => {
                                const defaultFallbacks = [
                                    {
                                        id: 'fallback_1',
                                        name: 'Late Night Drive',
                                        primaryArtists: 'Kavinsky',
                                        image: [{ link: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&h=150&fit=crop' }],
                                        playedAt: Date.now() - 3600000 * 2 // 2 hours ago
                                    },
                                    {
                                        id: 'fallback_2',
                                        name: 'Tum Hi Ho',
                                        primaryArtists: 'Arijit Singh',
                                        image: [{ link: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=150&h=150&fit=crop' }],
                                        playedAt: Date.now() - 3600000 * 5 // 5 hours ago
                                    },
                                    {
                                        id: 'fallback_3',
                                        name: 'Elevated',
                                        primaryArtists: 'Shubh',
                                        image: [{ link: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop' }],
                                        playedAt: Date.now() - 3600000 * 8 // 8 hours ago
                                    },
                                    {
                                        id: 'fallback_4',
                                        name: 'Baarishein',
                                        primaryArtists: 'Anuv Jain',
                                        image: [{ link: 'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=150&h=150&fit=crop' }],
                                        playedAt: Date.now() - 3600000 * 24 // 1 day ago
                                    }
                                ]
                                const items = (listeningHistory && listeningHistory.length > 0)
                                    ? listeningHistory.slice(0, 4)
                                    : defaultFallbacks

                                return items.map((song, index) => {
                                    const vibeTitle = getEmotionalTrailForSong(song)
                                    const timeString = getRelativeTime(song.playedAt)
                                    return (
                                        <TrailRow
                                            key={song.id || index}
                                            song={song}
                                            index={index}
                                            vibeTitle={vibeTitle}
                                            timeString={timeString}
                                            onPlay={handleSelectSong}
                                            colors={colors}
                                            fonts={fonts}
                                            isDark={isDark}
                                        />
                                    )
                                })
                            })()}
                        </div>
                    </div>
                )}

                <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes subtleBounce {
          from { transform: scaleY(0.35); opacity: 0.6; }
          to   { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
            </div>
        </>
    )
}
