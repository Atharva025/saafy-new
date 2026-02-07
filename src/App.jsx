import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PlayerProvider, usePlayer } from '@/context/PlayerContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import BasicSearch from '@/components/BasicSearch'
import SongList from '@/components/SongList'
import BasicPlayer from '@/components/BasicPlayer'
import ArtistPage from '@/components/ArtistPage'
import DiscoverSection from '@/components/DiscoverSection'
import QueuePanel from '@/components/QueuePanel'
import SkeletonLoader from '@/components/SkeletonLoader'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import { getAllDiscoveryContent, getForYouMix, getAllThemedContent, refreshDiscovery } from '@/lib/discovery'

// Local Storage Keys
const HISTORY_KEY = 'saafy_listening_history'

// Helper to get/set listening history
const getListeningHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

const addToListeningHistory = (song) => {
  if (!song) return
  const history = getListeningHistory()
  const filtered = history.filter(s => s.id !== song.id)
  const updated = [song, ...filtered].slice(0, 10)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

function HomePage() {
  const { isDark, colors, fonts, toggleTheme } = useTheme()
  const { playSong, addToQueue, queue, recommendations, recommendationsLoading, currentSong } = usePlayer()

  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [discovery, setDiscovery] = useState({})
  const [themed, setThemed] = useState({})
  const [forYou, setForYou] = useState({ songs: [], loading: true })
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const [showHistory, setShowHistory] = useState(false)
  const [listeningHistory, setListeningHistory] = useState([])
  const [showQueue, setShowQueue] = useState(false)
  const historyRef = useRef(null)

  useEffect(() => {
    loadDiscoveryContent()
    setListeningHistory(getListeningHistory())
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadDiscoveryContent = async () => {
    setLoading(true)
    try {
      const [forYouData, allContent, themedContent] = await Promise.all([
        getForYouMix(12),
        getAllDiscoveryContent(10),
        getAllThemedContent(10)
      ])
      setForYou({ songs: forYouData.songs, loading: false })
      setDiscovery(allContent)
      setThemed(themedContent)
    } catch (error) { }
    finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    refreshDiscovery()
    loadDiscoveryContent()
  }

  const handleClearSearch = () => {
    setSearchResults([])
    setIsSearching(false)
  }

  const handlePlaySong = (song) => {
    playSong(song)
    addToListeningHistory(song)
    setListeningHistory(getListeningHistory())
  }

  const handleShuffleAll = () => {
    const allSongs = [
      ...(forYou.songs || []),
      ...(discovery.hindi?.songs || []),
      ...(discovery.english?.songs || []),
      ...(discovery.punjabi?.songs || []),
    ]
    if (allSongs.length > 0) {
      const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)]
      handlePlaySong(randomSong)
    }
  }

  const handleHistorySongClick = (song) => {
    handlePlaySong(song)
    setShowHistory(false)
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    if (hour < 21) return 'Good evening'
    return 'Late night vibes'
  }

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }

  const iconBtnStyle = (isActive = false) => ({
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: isActive ? colors.paperDarker : colors.paperDark,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive ? colors.accent : colors.inkMuted,
    transition: 'all 0.15s ease',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.paper,
      transition: 'background 0.3s ease',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: colors.paper,
        borderBottom: `1px solid ${colors.rule}`,
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}>
        <div className="header-container" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 32px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(12px, 3vw, 24px)',
          flexWrap: 'wrap',
        }}>
          {/* Left - Logo + Greeting */}
          <div className="header-left" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 20px)' }}>
            <div style={{
              fontFamily: fonts.display,
              fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
              fontWeight: 800,
              color: colors.ink,
              letterSpacing: '-0.02em',
            }}>
              SAAFY
            </div>

            <div className="header-divider" style={{ width: '1px', height: '28px', background: colors.rule }} />

            <div className="header-greeting">
              <div style={{
                fontFamily: fonts.primary,
                fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                fontWeight: 600,
                color: colors.ink,
              }}>
                {getGreeting()}
              </div>
              <div style={{
                fontFamily: fonts.mono,
                fontSize: 'clamp(0.6rem, 1.5vw, 0.65rem)',
                color: colors.inkLight,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '1px',
              }}>
                {formatDate()}
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="header-search" style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            <BasicSearch onSelectSong={handlePlaySong} />
          </div>

          {/* Right - Actions */}
          <div className="header-actions" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)' }}>
            {/* Queue Button */}
            <button
              onClick={() => setShowQueue(!showQueue)}
              style={{
                ...iconBtnStyle(showQueue),
                position: 'relative',
                width: 'clamp(36px, 8vw, 40px)',
                height: 'clamp(36px, 8vw, 40px)',
              }}
              title="Queue"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              {queue.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '10px',
                  background: colors.accent,
                  color: colors.paper,
                  fontSize: '0.65rem',
                  fontFamily: fonts.mono,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {queue.length}
                </div>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                ...iconBtnStyle(isDark),
                width: 'clamp(36px, 8vw, 40px)',
                height: 'clamp(36px, 8vw, 40px)',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Listening History */}
            <div ref={historyRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setListeningHistory(getListeningHistory())
                  setShowHistory(!showHistory)
                }}
                style={{
                  ...iconBtnStyle(showHistory),
                  width: 'clamp(36px, 8vw, 40px)',
                  height: 'clamp(36px, 8vw, 40px)',
                }}
                title="Recently Played"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </button>

              {showHistory && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '280px',
                  background: colors.paper,
                  borderRadius: '12px',
                  border: `1px solid ${colors.rule}`,
                  boxShadow: isDark
                    ? '0 16px 48px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3)'
                    : '0 16px 48px rgba(26,22,20,0.12), 0 8px 20px rgba(26,22,20,0.06)',
                  overflow: 'hidden',
                  zIndex: 100,
                }}>
                  <div style={{
                    padding: '12px 14px',
                    borderBottom: `1px solid ${colors.rule}`,
                  }}>
                    <div style={{
                      fontFamily: fonts.mono,
                      fontSize: '0.7rem',
                      color: colors.inkMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Recently Played
                    </div>
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px' }}>
                    {listeningHistory.length === 0 ? (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        fontFamily: fonts.primary,
                        fontSize: '0.8rem',
                        color: colors.inkLight,
                      }}>
                        No history yet
                      </div>
                    ) : (
                      listeningHistory.map((song) => {
                        const imageUrl = song.image?.[0]?.link || song.image?.[1]?.link || ''
                        return (
                          <div
                            key={song.id}
                            onClick={() => handleHistorySongClick(song)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = colors.paperDark}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{
                              width: '32px',
                              height: '32px',
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
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill={colors.inkLight}>
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontFamily: fonts.primary,
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                color: colors.ink,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {song.name}
                              </div>
                              <div style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.6rem',
                                color: colors.inkMuted,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {song.primaryArtists}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shuffle All */}
            <button
              onClick={handleShuffleAll}
              style={{
                ...iconBtnStyle(),
                background: colors.accent,
                color: isDark ? colors.paper : '#fff',
              }}
              title="Shuffle All - Play Random"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="16" cy="16" r="1.5" />
                <circle cx="16" cy="8" r="1.5" />
                <circle cx="8" cy="16" r="1.5" />
              </svg>
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              style={{
                padding: '10px 14px',
                fontFamily: fonts.mono,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isDark ? colors.ink : colors.paper,
                background: isDark ? colors.paperDarker : colors.ink,
                border: `1px solid ${colors.rule}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 32px)',
        paddingBottom: 'clamp(120px, 25vw, 160px)',
      }}>
        {isSearching ? (
          <section>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                <h2 style={{
                  fontFamily: fonts.display,
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: colors.ink,
                }}>
                  Results
                </h2>
                <span style={{
                  fontFamily: fonts.mono,
                  fontSize: '0.75rem',
                  color: colors.inkLight,
                  textTransform: 'uppercase',
                }}>
                  {searchResults.length} tracks
                </span>
              </div>
              <button
                onClick={handleClearSearch}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: '0.8rem',
                  color: colors.accent,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                ← Back
              </button>
            </div>
            <SongList songs={searchResults} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
          </section>
        ) : (
          <div>
            {/* For You */}
            <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'clamp(12px, 3vw, 16px)',
                marginBottom: 'clamp(16px, 4vw, 20px)',
                flexWrap: 'wrap',
              }}>
                <div>
                  <h1 style={{
                    fontFamily: fonts.display,
                    fontSize: 'clamp(1.6rem, 6vw, 2.4rem)',
                    fontWeight: 800,
                    color: colors.ink,
                    margin: 0,
                  }}>
                    {currentSong && recommendations.length > 0 ? 'Recommended for You' : 'For You'}
                  </h1>
                  <div style={{
                    fontFamily: fonts.mono,
                    fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                    color: colors.inkLight,
                    marginTop: '6px',
                  }}>
                    {currentSong && recommendations.length > 0
                      ? `Based on "${currentSong.name || currentSong.title}"`
                      : 'Curated mix • Fresh discoveries'}
                  </div>
                </div>

                <button
                  onClick={handleShuffleAll}
                  style={{
                    padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                    borderRadius: 'clamp(10px, 2.5vw, 12px)',
                    background: colors.accent,
                    border: 'none',
                    color: colors.paper,
                    cursor: 'pointer',
                    fontFamily: fonts.mono,
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: `0 4px 12px ${colors.accent}30`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 6px 20px ${colors.accent}50`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}30`
                  }}
                >
                  Play All
                </button>
              </div>

              <div style={{
                borderRadius: '20px',
                padding: '16px',
                background: isDark ? colors.paperDark : colors.paper,
                border: `1px solid ${colors.rule}`,
                boxShadow: isDark
                  ? '0 10px 30px rgba(0,0,0,0.3)'
                  : '0 10px 30px rgba(26,22,20,0.08)',
              }}>
                <DiscoverSection
                  songs={currentSong && recommendations.length > 0 ? recommendations : forYou.songs}
                  loading={currentSong && recommendations.length > 0 ? recommendationsLoading : forYou.loading}
                  featured
                  onPlaySong={handlePlaySong}
                  onAddToQueue={addToQueue}
                />
              </div>
            </section>

            {/* Discovery Sections - Show Recommendations OR Default Categories */}
            {currentSong && recommendations.length > 0 ? (
              // RECOMMENDATIONS MODE - Show multiple varied sections
              <>
                {/* Section 1: First batch of recommendations */}
                <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                  <h2 style={{
                    fontFamily: fonts.display,
                    fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 700,
                    color: colors.ink,
                    marginBottom: 'clamp(8px, 2vw, 12px)',
                  }}>
                    Similar to "{currentSong.name || currentSong.title}"
                  </h2>
                  <p style={{
                    fontFamily: fonts.mono,
                    fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                    color: colors.inkLight,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'clamp(16px, 4vw, 20px)',
                  }}>
                    Top Recommendations
                  </p>
                  <DiscoverSection
                    songs={recommendations.slice(0, 8)}
                    loading={recommendationsLoading}
                    onPlaySong={handlePlaySong}
                    onAddToQueue={addToQueue}
                  />
                </section>

                {/* Section 2: More recommendations if available */}
                {recommendations.length > 8 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(8px, 2vw, 12px)',
                    }}>
                      More Like This
                    </h2>
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      You might also like
                    </p>
                    <DiscoverSection
                      songs={recommendations.slice(8, 16)}
                      loading={recommendationsLoading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {/* Add themed content to fill the page when in recommendations mode */}
                {themed.party?.songs && themed.party.songs.length > 0 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(8px, 2vw, 12px)',
                    }}>
                      {themed.party.title}
                    </h2>
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      Keep the energy high
                    </p>
                    <DiscoverSection
                      songs={themed.party.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {themed.chill?.songs && themed.chill.songs.length > 0 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(8px, 2vw, 12px)',
                    }}>
                      {themed.chill.title}
                    </h2>
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      Relax and unwind
                    </p>
                    <DiscoverSection
                      songs={themed.chill.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}
              </>
            ) : (
              // DEFAULT MODE - Show varied content with language and themed categories
              <>
                {/* Trending Now */}
                {themed.trending?.songs && themed.trending.songs.length > 0 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(8px, 2vw, 12px)',
                    }}>
                      {themed.trending.title}
                    </h2>
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      What's hot right now
                    </p>
                    <DiscoverSection
                      songs={themed.trending.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {/* Hindi */}
                <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                  <h2 style={{
                    fontFamily: fonts.display,
                    fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 700,
                    color: colors.ink,
                    marginBottom: 'clamp(16px, 4vw, 20px)',
                  }}>
                    Hindi
                  </h2>
                  <DiscoverSection songs={discovery.hindi?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                </section>

                {/* Party Hits */}
                {themed.party?.songs && themed.party.songs.length > 0 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(8px, 2vw, 12px)',
                    }}>
                      {themed.party.title}
                    </h2>
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      Dance & Celebration
                    </p>
                    <DiscoverSection
                      songs={themed.party.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {/* English */}
                <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                  <h2 style={{
                    fontFamily: fonts.display,
                    fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 700,
                    color: colors.ink,
                    marginBottom: 'clamp(16px, 4vw, 20px)',
                  }}>
                    English
                  </h2>
                  <DiscoverSection songs={discovery.english?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                </section>

                {/* Chill Vibes */}
                {themed.chill?.songs && themed.chill.songs.length > 0 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(8px, 2vw, 12px)',
                    }}>
                      {themed.chill.title}
                    </h2>
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      Relax & Focus
                    </p>
                    <DiscoverSection
                      songs={themed.chill.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {/* Punjabi */}
                <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                  <h2 style={{
                    fontFamily: fonts.display,
                    fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 700,
                    color: colors.ink,
                    marginBottom: 'clamp(16px, 4vw, 20px)',
                  }}>
                    Punjabi
                  </h2>
                  <DiscoverSection songs={discovery.punjabi?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                </section>

                {/* Romantic */}
                {themed.romantic?.songs && themed.romantic.songs.length > 0 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(8px, 2vw, 12px)',
                    }}>
                      {themed.romantic.title}
                    </h2>
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      Love & Romance
                    </p>
                    <DiscoverSection
                      songs={themed.romantic.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {/* Marathi */}
                {discovery.marathi?.songs && discovery.marathi.songs.length > 0 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      Marathi
                    </h2>
                    <DiscoverSection songs={discovery.marathi.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                  </section>
                )}

                {/* Workout Energy */}
                {themed.workout?.songs && themed.workout.songs.length > 0 && (
                  <section style={{ marginBottom: 'clamp(32px, 6vw, 48px)' }}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: 'clamp(8px, 2vw, 12px)',
                    }}>
                      {themed.workout.title}
                    </h2>
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>
                      Power your workout
                    </p>
                    <DiscoverSection
                      songs={themed.workout.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <BasicPlayer />
      <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />
      <KeyboardShortcuts />

      {/* Backdrop blur for history panel */}
      {showHistory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 89,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <PlayerProvider>
            <Router>
              <Routes>
                <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                <Route path="/artist/:id" element={<ErrorBoundary><ArtistPage /></ErrorBoundary>} />
              </Routes>
            </Router>
          </PlayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
