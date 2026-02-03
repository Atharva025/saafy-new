import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PlayerProvider, usePlayer } from '@/context/PlayerContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import BasicSearch from '@/components/BasicSearch'
import SongList from '@/components/SongList'
import BasicPlayer from '@/components/BasicPlayer'
import ArtistPage from '@/components/ArtistPage'
import DiscoverSection from '@/components/DiscoverSection'
import { getAllDiscoveryContent, getForYouMix, refreshDiscovery } from '@/lib/discovery'

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
  const { playSong } = usePlayer()

  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [discovery, setDiscovery] = useState({})
  const [forYou, setForYou] = useState({ songs: [], loading: true })
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const [showHistory, setShowHistory] = useState(false)
  const [listeningHistory, setListeningHistory] = useState([])
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
      const [forYouData, allContent] = await Promise.all([
        getForYouMix(10),
        getAllDiscoveryContent(6)
      ])
      setForYou({ songs: forYouData.songs, loading: false })
      setDiscovery(allContent)
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

  const handlePlaySong = (song, queue = null) => {
    playSong(song, queue)
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
      handlePlaySong(randomSong, allSongs)
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
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}>
          {/* Left - Logo + Greeting */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              fontFamily: fonts.display,
              fontSize: '1.4rem',
              fontWeight: 800,
              color: colors.ink,
              letterSpacing: '-0.02em',
            }}>
              SAAFY
            </div>

            <div style={{ width: '1px', height: '28px', background: colors.rule }} />

            <div>
              <div style={{
                fontFamily: fonts.primary,
                fontSize: '0.9rem',
                fontWeight: 600,
                color: colors.ink,
              }}>
                {getGreeting()}
              </div>
              <div style={{
                fontFamily: fonts.mono,
                fontSize: '0.65rem',
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
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <BasicSearch onSelectSong={handlePlaySong} />
          </div>

          {/* Right - Actions */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={iconBtnStyle(isDark)}
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
                style={iconBtnStyle(showHistory)}
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
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 32px 160px 32px',
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
            <SongList songs={searchResults} onPlaySong={handlePlaySong} />
          </section>
        ) : (
          <div>
            {/* For You */}
            <section style={{ marginBottom: '48px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}>
                <h1 style={{
                  fontFamily: fonts.display,
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: colors.ink,
                }}>
                  For You
                </h1>
                <span style={{
                  fontFamily: fonts.mono,
                  fontSize: '0.7rem',
                  color: colors.inkLight,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  Curated Daily
                </span>
              </div>
              <DiscoverSection songs={forYou.songs} loading={forYou.loading} featured onPlaySong={handlePlaySong} />
            </section>

            {/* Hindi */}
            <section style={{ marginBottom: '48px' }}>
              <h2 style={{
                fontFamily: fonts.display,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: colors.ink,
                marginBottom: '20px',
              }}>
                Hindi
              </h2>
              <DiscoverSection songs={discovery.hindi?.songs} loading={loading} onPlaySong={handlePlaySong} />
            </section>

            {/* English */}
            <section style={{ marginBottom: '48px' }}>
              <h2 style={{
                fontFamily: fonts.display,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: colors.ink,
                marginBottom: '20px',
              }}>
                English
              </h2>
              <DiscoverSection songs={discovery.english?.songs} loading={loading} onPlaySong={handlePlaySong} />
            </section>

            {/* Punjabi */}
            <section style={{ marginBottom: '48px' }}>
              <h2 style={{
                fontFamily: fonts.display,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: colors.ink,
                marginBottom: '20px',
              }}>
                Punjabi
              </h2>
              <DiscoverSection songs={discovery.punjabi?.songs} loading={loading} onPlaySong={handlePlaySong} />
            </section>
          </div>
        )}
      </main>

      <BasicPlayer />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PlayerProvider>
          <Router>
            <Routes>
              <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
              <Route path="/artist/:id" element={<ErrorBoundary><ArtistPage /></ErrorBoundary>} />
            </Routes>
          </Router>
        </PlayerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
