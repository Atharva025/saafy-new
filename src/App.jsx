import { useState, useEffect, useRef } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
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
import Settings from '@/components/Settings'
import LocalMusicPlayer from '@/components/LocalMusicPlayer'
import { getAllDiscoveryContent, getForYouMix, getAllThemedContent, refreshDiscovery } from '@/lib/discovery'
import { encryptedGetItem, encryptedSetItem } from '@/lib/encryption'
import { validateSong } from '@/lib/security'

// Local Storage Keys
const HISTORY_KEY = 'listening_history'

// Helper to get/set listening history (with encryption)
const getListeningHistory = () => {
  try {
    const history = encryptedGetItem(HISTORY_KEY, [])
    return Array.isArray(history) ? history : []
  } catch {
    return []
  }
}

const addToListeningHistory = (song) => {
  if (!song || !validateSong(song)) return
  const history = getListeningHistory()
  const filtered = history.filter(s => s.id !== song.id)
  const updated = [song, ...filtered].slice(0, 10)
  encryptedSetItem(HISTORY_KEY, updated)
}

function HomePage() {
  const { isDark, colors, fonts, toggleTheme } = useTheme()
  const { playSong, addToQueue, queue, recommendations, recommendationsLoading, currentSong } = usePlayer()

  // Computed once per render — consistent with BasicPlayer / BasicSearch patterns
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const isTiny = typeof window !== 'undefined' && window.innerWidth < 390

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
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const historyRef = useRef(null)

  const getStaggerStyle = (index, marginBottom = isMobile ? '20px' : 'clamp(32px, 6vw, 48px)') => ({
    marginBottom,
    animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
    animationDelay: `${0.05 * index}s`,
  })

  useEffect(() => {
    loadDiscoveryContent()
    setListeningHistory(getListeningHistory())
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      clearInterval(timer)
      window.removeEventListener('scroll', handleScroll)
    }
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
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: isActive
      ? (isDark ? 'rgba(224,115,86,0.18)' : 'rgba(196,92,62,0.1)')
      : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
    border: isActive
      ? `1px solid ${colors.accent}40`
      : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive ? colors.accent : colors.inkMuted,
    transition: 'all 0.15s ease',
    backdropFilter: 'blur(4px)',
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
        background: scrolled
          ? (isDark ? 'rgba(26, 22, 20, 0.72)' : 'rgba(250, 247, 242, 0.72)')
          : (isDark ? 'rgba(26, 22, 20, 0.88)' : 'rgba(250, 247, 242, 0.88)'),
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(12px) saturate(140%)',
        borderBottom: `1px solid ${scrolled
          ? (isDark ? 'rgba(224, 115, 86, 0.22)' : 'rgba(196, 92, 62, 0.18)')
          : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}`,
        boxShadow: scrolled
          ? (isDark ? '0 4px 20px rgba(0, 0, 0, 0.45)' : '0 4px 20px rgba(26, 22, 20, 0.08)')
          : 'none',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div className="header-container" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: scrolled
            ? 'clamp(6px, 1.5vw, 9px) clamp(16px, 4vw, 28px)'
            : 'clamp(10px, 2.5vw, 14px) clamp(16px, 4vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(10px, 2.5vw, 20px)',
          flexWrap: 'nowrap',
          transition: 'padding 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Left - Logo + Greeting */}
          <div className="header-left" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              fontFamily: fonts.display,
              fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
              fontWeight: 800,
              color: colors.ink,
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              SAAFY
            </div>

            <div className="header-divider" style={{ width: '1px', height: '22px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

            <div className="header-greeting">
              <div style={{
                fontFamily: fonts.primary,
                fontSize: 'clamp(0.72rem, 1.8vw, 0.85rem)',
                fontWeight: 600,
                color: colors.ink,
                lineHeight: 1.2,
              }}>
                {getGreeting()}
              </div>
              <div style={{
                fontFamily: fonts.mono,
                fontSize: 'clamp(0.58rem, 1.3vw, 0.62rem)',
                color: colors.inkLight,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: '2px',
              }}>
                {formatDate()}
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="header-search" style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            <BasicSearch onSelectSong={handlePlaySong} />
          </div>

          {/* Desktop: Right - Actions (hidden on mobile) */}
          <div className="header-actions" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
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
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                color: '#fff',
                border: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              title="Shuffle All - Play Random"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="header-refresh-btn"
              data-label="Refresh"
              style={{
                padding: '8px 14px',
                fontFamily: fonts.mono,
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: colors.inkMuted,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.ink; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.inkMuted; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span className="header-refresh-label">Refresh</span>
            </button>
          </div>

          {/* Mobile: "More" button — only visible on small screens */}
          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(true)}
              className="mobile-more-btn"
              style={{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: showMobileMenu
                  ? `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`
                  : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
                color: showMobileMenu ? '#fff' : colors.ink,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="More options"
              aria-label="Open controls"
            >
              {/* EQ Fader / Mixer icon — unique to music apps */}
              <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Base line */}
                <line x1="0" y1="15.5" x2="18" y2="15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                {/* Left fader track */}
                <rect x="2" y="7" width="2" height="8" rx="1" fill="currentColor" opacity="0.3" />
                {/* Left fader knob — at 70% height */}
                <rect x="1" y="6" width="4" height="3" rx="1.5" fill="currentColor" />
                {/* Center fader track */}
                <rect x="8" y="1" width="2" height="14" rx="1" fill="currentColor" opacity="0.3" />
                {/* Center fader knob — near top (90%) */}
                <rect x="7" y="0" width="4" height="3" rx="1.5" fill="currentColor" />
                {/* Right fader track */}
                <rect x="14" y="5" width="2" height="10" rx="1" fill="currentColor" opacity="0.3" />
                {/* Right fader knob — at 55% */}
                <rect x="13" y="4" width="4" height="3" rx="1.5" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Actions Bottom Sheet */}
      {isMobile && showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileMenu(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 200,
              animation: 'fadeIn 0.2s ease-out',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 201,
            background: isDark
              ? 'rgba(28, 24, 22, 0.96)'
              : 'rgba(252, 249, 244, 0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px 20px 0 0',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
            padding: '12px 0 calc(env(safe-area-inset-bottom, 0px) + 20px)',
            animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          }}>
            {/* Drag handle */}
            <div style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              margin: '0 auto 16px',
            }} />

            {/* Sheet title */}
            <div style={{
              fontFamily: fonts.mono,
              fontSize: '0.65rem',
              fontWeight: 600,
              color: colors.inkMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              textAlign: 'center',
              marginBottom: '16px',
            }}>Quick Actions</div>

            {/* Action rows */}
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

              {/* Shuffle All — highlighted */}
              <button
                onClick={() => { handleShuffleAll(); setShowMobileMenu(false) }}
                className="bottom-sheet-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${colors.accent}22 0%, ${colors.accent}10 100%)`,
                  border: `1px solid ${colors.accent}30`,
                  cursor: 'pointer',
                  color: colors.accent,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: fonts.primary, fontWeight: 700, fontSize: '0.9rem' }}>Shuffle All</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: '0.65rem', color: colors.inkMuted, marginTop: '2px' }}>Play a random mix</div>
                </div>
              </button>

              {/* Queue */}
              <button
                onClick={() => { setShowQueue(!showQueue); setShowMobileMenu(false) }}
                className="bottom-sheet-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  cursor: 'pointer',
                  color: colors.ink,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: fonts.primary, fontWeight: 600, fontSize: '0.9rem' }}>Queue</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: '0.65rem', color: colors.inkMuted, marginTop: '2px' }}>
                    {queue.length > 0 ? `${queue.length} song${queue.length !== 1 ? 's' : ''} queued` : 'Queue is empty'}
                  </div>
                </div>
                {queue.length > 0 && (
                  <div style={{
                    minWidth: '22px', height: '22px', borderRadius: '11px',
                    background: colors.accent, color: '#fff',
                    fontSize: '0.65rem', fontFamily: fonts.mono, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
                  }}>{queue.length}</div>
                )}
              </button>

              {/* History */}
              <button
                onClick={() => {
                  setListeningHistory(getListeningHistory())
                  setShowHistory(true)
                  setShowMobileMenu(false)
                }}
                className="bottom-sheet-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  cursor: 'pointer',
                  color: colors.ink,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: fonts.primary, fontWeight: 600, fontSize: '0.9rem' }}>Recently Played</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: '0.65rem', color: colors.inkMuted, marginTop: '2px' }}>Your listening history</div>
                </div>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => { toggleTheme(); setShowMobileMenu(false) }}
                className="bottom-sheet-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  cursor: 'pointer',
                  color: colors.ink,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDark ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth="2">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth="2">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: fonts.primary, fontWeight: 600, fontSize: '0.9rem' }}>
                    {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: '0.65rem', color: colors.inkMuted, marginTop: '2px' }}>
                    Currently {isDark ? 'dark' : 'light'}
                  </div>
                </div>
              </button>

              {/* Refresh */}
              <button
                onClick={() => { handleRefresh(); setShowMobileMenu(false) }}
                className="bottom-sheet-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  cursor: 'pointer',
                  color: colors.ink,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: fonts.primary, fontWeight: 600, fontSize: '0.9rem' }}>Refresh Content</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: '0.65rem', color: colors.inkMuted, marginTop: '2px' }}>Load new music</div>
                </div>
              </button>
            </div>
          </div>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
        </>
      )}

      {/* Mobile History Bottom Sheet — rendered outside header-actions so it's always visible */}
      {isMobile && showHistory && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowHistory(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 200,
              animation: 'fadeIn 0.2s ease-out',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            zIndex: 201,
            background: isDark ? 'rgba(28, 24, 22, 0.97)' : 'rgba(252, 249, 244, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px 20px 0 0',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
            padding: '12px 0 calc(env(safe-area-inset-bottom, 0px) + 20px)',
            animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
            maxHeight: '75vh',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Drag handle */}
            <div style={{
              width: '36px', height: '4px', borderRadius: '2px',
              background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              margin: '0 auto 14px', flexShrink: 0,
            }} />

            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 16px 12px',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.inkMuted} strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{ fontFamily: fonts.mono, fontSize: '0.65rem', fontWeight: 600, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recently Played</span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: colors.inkMuted,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable song list */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 12px' }}>
              {listeningHistory.length === 0 ? (
                <div style={{
                  padding: '32px 20px', textAlign: 'center',
                  fontFamily: fonts.primary, fontSize: '0.88rem', color: colors.inkLight,
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.inkLight} strokeWidth="1.5" style={{ marginBottom: '10px', display: 'block', margin: '0 auto 10px' }}>
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  No songs played yet
                </div>
              ) : (
                listeningHistory.map((song, idx) => {
                  const imageUrl = song.image?.[2]?.link || song.image?.[2]?.url ||
                    song.image?.[1]?.link || song.image?.[1]?.url ||
                    song.image?.[0]?.link || song.image?.[0]?.url || ''
                  return (
                    <div
                      key={song.id || idx}
                      onClick={() => { handleHistorySongClick(song); setShowHistory(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 8px', borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease',
                      }}
                      onTouchStart={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                      onTouchEnd={e => setTimeout(() => { if (e.currentTarget) e.currentTarget.style.background = 'transparent' }, 200)}
                    >
                      {/* Album art */}
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '10px',
                        overflow: 'hidden', flexShrink: 0,
                        background: colors.paperDark,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={colors.inkLight}>
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Song info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: fonts.primary, fontWeight: 600, fontSize: '0.875rem',
                          color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{song.name}</div>
                        <div style={{
                          fontFamily: fonts.mono, fontSize: '0.65rem',
                          color: colors.inkMuted, marginTop: '2px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{song.primaryArtists}</div>
                      </div>

                      {/* Play chevron */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.inkLight} strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
      <main className="main-content" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 32px)',
        paddingBottom: 'clamp(120px, 25vw, 160px)',
      }} id="main-content">
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
            <section style={getStaggerStyle(0, isMobile ? '20px' : 'clamp(28px, 6vw, 56px)')}>

              {/* ── Section header ── */}
              <div style={{ marginBottom: isMobile ? '12px' : 'clamp(14px, 3.5vw, 24px)' }}>

                {/* Row 1: pill + compact Play All (mobile) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: isMobile ? '6px' : '8px',
                }}>
                  {/* Badge pill */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: isDark ? 'rgba(224,115,86,0.14)' : 'rgba(196,92,62,0.08)',
                    border: `1px solid ${isDark ? 'rgba(224,115,86,0.25)' : 'rgba(196,92,62,0.15)'}`,
                  }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill={colors.accent}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span style={{
                      fontFamily: fonts.mono,
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: colors.accent,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>Curated for you</span>
                  </div>

                  {/* Compact Play All — mobile only, sits next to pill */}
                  {isMobile && (
                    <button
                      onClick={handleShuffleAll}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: colors.accent,
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontFamily: fonts.mono,
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        boxShadow: `0 3px 12px ${colors.accent}40`,
                        flexShrink: 0,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="16 3 21 3 21 8" />
                        <line x1="4" y1="20" x2="21" y2="3" />
                        <polyline points="21 16 21 21 16 21" />
                        <line x1="15" y1="15" x2="21" y2="21" />
                        <line x1="4" y1="4" x2="9" y2="9" />
                      </svg>
                      Play All
                    </button>
                  )}
                </div>

                {/* Row 2: title + (desktop) Play All */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <div>
                    <h1 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.5rem, 7.5vw, 1.9rem)' : 'clamp(1.5rem, 5vw, 2.2rem)',
                      fontWeight: 800,
                      color: colors.ink,
                      margin: 0,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}>
                      {currentSong && recommendations.length > 0 ? 'Recommended for You' : 'For You'}
                    </h1>
                    <div style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.62rem, 1.8vw, 0.75rem)',
                      color: colors.inkLight,
                      marginTop: '5px',
                    }}>
                      {currentSong && recommendations.length > 0
                        ? `Based on "${currentSong.name || currentSong.title}"`
                        : 'Curated mix · Fresh discoveries'}
                    </div>
                  </div>

                  {/* Large Play All — desktop only */}
                  {!isMobile && (
                    <button
                      onClick={handleShuffleAll}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '11px 20px',
                        borderRadius: '10px',
                        background: colors.accent,
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontFamily: fonts.mono,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        boxShadow: `0 4px 16px ${colors.accent}35`,
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${colors.accent}50` }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 16px ${colors.accent}35` }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 3 21 3 21 8" />
                        <line x1="4" y1="20" x2="21" y2="3" />
                        <polyline points="21 16 21 21 16 21" />
                        <line x1="15" y1="15" x2="21" y2="21" />
                        <line x1="4" y1="4" x2="9" y2="9" />
                      </svg>
                      Play All
                    </button>
                  )}
                </div>
              </div>

              {/* Featured cards container */}
              <div style={{
                borderRadius: isMobile ? '14px' : '18px',
                padding: isMobile ? '10px' : 'clamp(10px, 2.5vw, 16px)',
                background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
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
                <section style={getStaggerStyle(1)}>
                  <h2 className="section-heading" style={{
                    fontFamily: fonts.display,
                    fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 700,
                    color: colors.ink,
                    marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                  }}>
                    Similar to &ldquo;{currentSong.name || currentSong.title}&rdquo;
                  </h2>
                  {!isMobile && (
                    <p style={{
                      fontFamily: fonts.mono,
                      fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                      color: colors.inkLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'clamp(16px, 4vw, 20px)',
                    }}>Top Recommendations</p>
                  )}
                  <DiscoverSection
                    songs={recommendations.slice(0, 8)}
                    loading={recommendationsLoading}
                    onPlaySong={handlePlaySong}
                    onAddToQueue={addToQueue}
                  />
                </section>

                {/* Section 2: More recommendations if available */}
                {recommendations.length > 8 && (
                  <section style={getStaggerStyle(2)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                    }}>
                      More Like This
                    </h2>
                    {!isMobile && (
                      <p style={{
                        fontFamily: fonts.mono,
                        fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                        color: colors.inkLight,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'clamp(16px, 4vw, 20px)',
                      }}>You might also like</p>
                    )}
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
                  <section style={getStaggerStyle(3)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700, color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                    }}>{themed.party.title}</h2>
                    <DiscoverSection
                      songs={themed.party.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {themed.chill?.songs && themed.chill.songs.length > 0 && (
                  <section style={getStaggerStyle(4)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700, color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                    }}>{themed.chill.title}</h2>
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
                  <section style={getStaggerStyle(1)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                    }}>
                      {themed.trending.title}
                    </h2>
                    {!isMobile && (
                      <p style={{
                        fontFamily: fonts.mono,
                        fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)',
                        color: colors.inkLight,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'clamp(16px, 4vw, 20px)',
                      }}>What&apos;s hot right now</p>
                    )}
                    <DiscoverSection
                      songs={themed.trending.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {/* Hindi */}
                <section style={getStaggerStyle(2)}>
                  <h2 style={{
                    fontFamily: fonts.display,
                    fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 700,
                    color: colors.ink,
                    marginBottom: isMobile ? '12px' : 'clamp(16px, 4vw, 20px)',
                  }}>Hindi</h2>
                  <DiscoverSection songs={discovery.hindi?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                </section>

                {/* Party Hits */}
                {themed.party?.songs && themed.party.songs.length > 0 && (
                  <section style={getStaggerStyle(3)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700, color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                    }}>{themed.party.title}</h2>
                    <DiscoverSection
                      songs={themed.party.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {/* English */}
                <section style={getStaggerStyle(4)}>
                  <h2 style={{
                    fontFamily: fonts.display,
                    fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 700,
                    color: colors.ink,
                    marginBottom: isMobile ? '12px' : 'clamp(16px, 4vw, 20px)',
                  }}>English</h2>
                  <DiscoverSection songs={discovery.english?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                </section>

                {/* Chill Vibes */}
                {themed.chill?.songs && themed.chill.songs.length > 0 && (
                  <section style={getStaggerStyle(5)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700, color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                    }}>{themed.chill.title}</h2>
                    <DiscoverSection
                      songs={themed.chill.songs}
                      loading={loading}
                      onPlaySong={handlePlaySong}
                      onAddToQueue={addToQueue}
                    />
                  </section>
                )}

                {/* Punjabi */}
                <section style={getStaggerStyle(6)}>
                  <h2 style={{
                    fontFamily: fonts.display,
                    fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: 700,
                    color: colors.ink,
                    marginBottom: isMobile ? '12px' : 'clamp(16px, 4vw, 20px)',
                  }}>Punjabi</h2>
                  <DiscoverSection songs={discovery.punjabi?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                </section>

                {/* Romantic */}
                {themed.romantic?.songs && themed.romantic.songs.length > 0 && (
                  <section style={getStaggerStyle(7)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700, color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                    }}>{themed.romantic.title}</h2>
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
                  <section style={getStaggerStyle(8)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700,
                      color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(16px, 4vw, 20px)',
                    }}>Marathi</h2>
                    <DiscoverSection songs={discovery.marathi.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                  </section>
                )}

                {/* Workout Energy */}
                {themed.workout?.songs && themed.workout.songs.length > 0 && (
                  <section style={getStaggerStyle(9)}>
                    <h2 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.3rem)' : 'clamp(1.2rem, 4vw, 1.5rem)',
                      fontWeight: 700, color: colors.ink,
                      marginBottom: isMobile ? '12px' : 'clamp(8px, 2vw, 12px)',
                    }}>{themed.workout.title}</h2>
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

      {/* Backdrop for history panel */}
      {showHistory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: '65px', // below header
            background: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 45,
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
                <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
                <Route path="/local-music" element={<ErrorBoundary><LocalMusicPlayer /></ErrorBoundary>} />
              </Routes>
            </Router>
          </PlayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
