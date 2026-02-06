import { useState, useEffect, useRef } from 'react'
import { searchSongs } from '@/lib/api'
import { debounce } from '@/lib/security'
import { useTheme } from '@/context/ThemeContext'

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

export default function BasicSearch({ onSelectSong }) {
    const { colors, fonts, isDark } = useTheme()

    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [isFocused, setIsFocused] = useState(false)
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const inputRef = useRef(null)
    const containerRef = useRef(null)

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
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSelectSong(suggestions[selectedIndex])
        } else if (suggestions.length > 0) {
            handleSelectSong(suggestions[0])
        }
    }

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
            <form onSubmit={handleSearch}>
                <div
                    style={{
                        position: 'relative',
                        background: colors.paperDark,
                        borderRadius: '12px',
                        border: `2px solid ${isFocused ? colors.accent : 'transparent'}`,
                        boxShadow: isFocused ? `0 0 0 4px ${isDark ? 'rgba(224,115,86,0.15)' : 'rgba(196,92,62,0.1)'}` : 'none',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        height: '44px',
                        gap: '12px',
                    }}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={isFocused ? colors.ink : colors.inkMuted}
                            strokeWidth="2.5"
                            style={{ flexShrink: 0, transition: 'stroke 0.2s' }}
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
                                        fontSize: '0.875rem',
                                        color: colors.inkMuted,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        pointerEvents: 'none',
                                        opacity: isAnimating ? 0 : 1,
                                        transform: isAnimating ? 'translateY(-8px)' : 'translateY(0)',
                                        transition: 'opacity 0.3s ease, transform 0.3s ease',
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
                                    fontSize: '0.875rem',
                                    fontFamily: fonts.primary,
                                    background: 'transparent',
                                    color: colors.ink,
                                    border: 'none',
                                    outline: 'none',
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
                        ) : null}
                    </div>
                </div>
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: colors.paper,
                    borderRadius: '12px',
                    border: `1px solid ${colors.rule}`,
                    boxShadow: isDark
                        ? '0 16px 48px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3)'
                        : '0 16px 48px rgba(26,22,20,0.12), 0 8px 20px rgba(26,22,20,0.06)',
                    overflow: 'hidden',
                    zIndex: 100,
                    animation: 'dropIn 0.15s ease',
                }}>
                    <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px' }}>
                        {suggestions.map((song, index) => {
                            // Use highest quality image available - check both .link and .url
                            const imageUrl = song.image?.[0]?.link || song.image?.[0]?.url ||
                                song.image?.[1]?.link || song.image?.[1]?.url ||
                                song.image?.[2]?.link || song.image?.[2]?.url ||
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
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: isSelected ? colors.paperDark : 'transparent',
                                        transition: 'background 0.1s',
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        background: colors.paperDark,
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
                                            fontSize: '0.8rem',
                                            color: colors.ink,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {song.name}
                                        </div>
                                        <div style={{
                                            fontFamily: fonts.mono,
                                            fontSize: '0.65rem',
                                            color: colors.inkMuted,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            marginTop: '1px',
                                        }}>
                                            {song.primaryArtists}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.accent}>
                                            <path d="M8 5v14l11-7L8 5z" />
                                        </svg>
                                    )}
                                </div>
                            )
                        })}
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
      `}</style>
        </div>
    )
}
