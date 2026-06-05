import { useState, useEffect, useRef } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { PlayerProvider, usePlayer } from '@/context/PlayerContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { ToastProvider, useToast } from '@/context/ToastContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import UserAuthModal from '@/components/UserAuthModal'
import CreatePlaylistModal from '@/components/CreatePlaylistModal'
import SpotifyImportModal from '@/components/SpotifyImportModal'
import { AnimatePresence } from 'framer-motion'
import BasicSearch from '@/components/BasicSearch'
import SongList from '@/components/SongList'
import BasicPlayer from '@/components/BasicPlayer'
import ArtistPage from '@/components/ArtistPage'
import DiscoverSection from '@/components/DiscoverSection'
import QueuePanel from '@/components/QueuePanel'
import SkeletonLoader from '@/components/SkeletonLoader'
import Settings from '@/components/Settings'
import LocalMusicPlayer from '@/components/LocalMusicPlayer'
import { getAllDiscoveryContent, getForYouMix, getAllThemedContent, refreshDiscovery, getFreshSongsForCategory, getMoreSongsForCategory } from '@/lib/discovery'
import { encryptedGetItem, encryptedSetItem } from '@/lib/encryption'
import { validateSong } from '@/lib/security'
import { getSong, searchSongs, getRecommendations } from '@/lib/api'
import { compressImage } from '@/utils/image'
import { Sparkles, TrendingUp, Languages, BookText, Drum, Landmark, PartyPopper, CloudMoon, Heart, Dumbbell, ListMusic, Pencil, Check, Shuffle, Clock, Menu, List, Grid } from 'lucide-react'

function HomePage() {
  const { isDark, colors, fonts, toggleTheme } = useTheme()
  const { 
    playSong, addToQueue, queue, recommendations, recommendationsLoading, currentSong, dominantColor,
    playlists, playlistsLoading, loadPlaylists, createPlaylist, updatePlaylist, deletePlaylist, removeSongFromPlaylist, clearQueue,
    isPlaying, listeningHistory, loadListeningHistory, importSpotifyPlaylist
  } = usePlayer()
  const toast = useToast()
  
  const [currentUser, setCurrentUser] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef(null)

  // Playlist states
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistSongs, setPlaylistSongs] = useState([])
  const [playlistSongsLoading, setPlaylistSongsLoading] = useState(false)
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('')
  const [playlistViewMode, setPlaylistViewMode] = useState('list') // 'list' | 'card'
  const [searchExpanded, setSearchExpanded] = useState(false)

  // Playlist inline editing states
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingNameValue, setEditingNameValue] = useState('')

  // Spotify playlist import states
  const [isImportingSpotify, setIsImportingSpotify] = useState(false)

  // Playlist handlers
  const loadPlaylistSongs = async (playlist) => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      setPlaylistSongs([])
      return
    }

    setPlaylistSongsLoading(true)
    try {
      // Map the MongoDB playlist songs directly to formatted state instantly
      const formattedSongs = playlist.songs.map(song => ({
        id: song.id,
        name: song.name,
        title: song.name,
        primaryArtists: song.primaryArtists,
        // Normalize image format so other components like player and queue can read it
        image: Array.isArray(song.image) 
          ? song.image 
          : [{ link: song.image }, { link: song.image }, { link: song.image }],
        duration: song.duration,
        album: typeof song.album === 'object' && song.album !== null
          ? song.album
          : { name: song.album || '' },
        downloadUrl: song.downloadUrl || []
      }))

      setPlaylistSongs(formattedSongs)
    } catch (err) {
      console.error("Error loading playlist songs:", err)
      toast.error("Failed to load playlist songs")
    } finally {
      setPlaylistSongsLoading(false)
    }
  }

  const handlePlaylistClick = async (playlist) => {
    setSelectedPlaylist(playlist)
    setPlaylistSearchQuery('')
    await loadPlaylistSongs(playlist)
  }

  const handleRemoveSong = async (songId) => {
    if (!currentUser || !selectedPlaylist) return
    const userId = currentUser.id || currentUser._id
    const playlistId = selectedPlaylist._id
    const success = await removeSongFromPlaylist(userId, playlistId, songId)
    if (success) {
      toast.success("Song removed from playlist")
      
      const updatedPlaylist = {
        ...selectedPlaylist,
        songs: selectedPlaylist.songs.filter(s => s.id !== songId)
      }
      setSelectedPlaylist(updatedPlaylist)
      setPlaylistSongs(prev => prev.filter(s => s.id !== songId))
    } else {
      toast.error("Failed to remove song")
    }
  }

  const handleUpdatePlaylistImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !currentUser || !selectedPlaylist) return
    
    try {
      const compressed = await compressImage(file)
      const userId = currentUser.id || currentUser._id
      const updatedPlaylist = await updatePlaylist(userId, selectedPlaylist._id, selectedPlaylist.name, compressed)
      if (updatedPlaylist) {
        toast.success("Playlist cover updated successfully!")
        setSelectedPlaylist(updatedPlaylist)
      } else {
        toast.error("Failed to update playlist cover")
      }
    } catch (err) {
      console.error("Failed to compress image:", err)
      toast.error("Failed to process cover image")
    }
  }

  const handleSavePlaylistName = async () => {
    if (!editingNameValue.trim() || !currentUser || !selectedPlaylist) {
      setIsEditingName(false)
      return
    }
    if (editingNameValue.trim() === selectedPlaylist.name) {
      setIsEditingName(false)
      return
    }

    try {
      const userId = currentUser.id || currentUser._id
      const updatedPlaylist = await updatePlaylist(userId, selectedPlaylist._id, editingNameValue.trim(), selectedPlaylist.image)
      if (updatedPlaylist) {
        toast.success("Playlist name updated successfully!")
        setSelectedPlaylist(updatedPlaylist)
      } else {
        toast.error("Failed to update playlist name")
      }
    } catch (err) {
      console.error("Failed to update playlist name:", err)
      toast.error("Failed to update playlist name")
    } finally {
      setIsEditingName(false)
    }
  }

  const handleShufflePlayPlaylist = () => {
    if (playlistSongs.length > 0) {
      const shuffledSongs = [...playlistSongs]
      for (let i = shuffledSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledSongs[i], shuffledSongs[j]] = [shuffledSongs[j], shuffledSongs[i]];
      }
      handlePlaySong(shuffledSongs[0], shuffledSongs)
      clearQueue()
      shuffledSongs.slice(1).forEach(song => addToQueue(song))
      toast.success(`Shuffling and playing playlist: ${selectedPlaylist.name}`)
    }
  }

  const formatDuration = (secs) => {
    if (!secs) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const getPlaylistSongImage = (song) => {
    if (!song) return '/placeholder.png'
    const isImageString = (val) => typeof val === 'string' && val.startsWith('http')
    
    if (isImageString(song.imageUrl)) {
      return song.imageUrl
    }
    if (isImageString(song.image)) {
      return song.image
    }
    if (Array.isArray(song.image) && song.image.length > 0) {
      for (let i = song.image.length - 1; i >= 0; i--) {
        const item = song.image[i]
        if (item) {
          if (typeof item === 'string' && item.startsWith('http')) {
            return item
          }
          if (typeof item === 'object') {
            if (typeof item.link === 'string' && item.link.startsWith('http')) {
              return item.link
            }
            if (typeof item.url === 'string' && item.url.startsWith('http')) {
              return item.url
            }
          }
        }
      }
    }
    if (typeof song.image === 'object' && song.image !== null) {
      if (typeof song.image.link === 'string' && song.image.link.startsWith('http')) {
        return song.image.link
      }
      if (typeof song.image.url === 'string' && song.image.url.startsWith('http')) {
        return song.image.url
      }
    }
    return '/placeholder.png'
  }


  const handleDeletePlaylist = async (playlistId) => {
    if (!currentUser) return
    if (!window.confirm("Are you sure you want to delete this playlist?")) return
    
    const userId = currentUser.id || currentUser._id
    const success = await deletePlaylist(userId, playlistId)
    if (success) {
      toast.success("Playlist deleted")
      setSelectedPlaylist(null)
    } else {
      toast.error("Failed to delete playlist")
    }
  }

  const handlePlayPlaylist = () => {
    if (playlistSongs.length > 0) {
      handlePlaySong(playlistSongs[0], playlistSongs)
      clearQueue()
      playlistSongs.slice(1).forEach(song => addToQueue(song))
      toast.success(`Playing playlist: ${selectedPlaylist.name}`)
    }
  }

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    loadPlaylists(user.id || user._id)
    const userId = user.id || user._id
    loadListeningHistory(userId)
    loadDiscoveryContent(user)
  }


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
  const [activeCategory, setActiveCategory] = useState('section-for-you')
  const [categoryContent, setCategoryContent] = useState({ songs: [], loading: false, loadingMore: false, title: '', query: '', page: 0, hasMore: true })
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
    const savedUser = encryptedGetItem('saafy_user', null)
    let activeUser = null
    if (savedUser) {
      setCurrentUser(savedUser)
      loadPlaylists(savedUser.id || savedUser._id)
      activeUser = savedUser
    }
    
    loadDiscoveryContent(activeUser)
    
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
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])



  const loadDiscoveryContent = async (user = currentUser) => {
    setLoading(true)
    setForYou(prev => ({ ...prev, loading: true }))
    try {
      const [allContent, themedContent] = await Promise.all([
        getAllDiscoveryContent(10),
        getAllThemedContent(10)
      ])
      setDiscovery(allContent)
      setThemed(themedContent)

      // Fetch user specific recommendations if there is history
      const userId = user ? (user.id || user._id) : 'guest'
      const key = `listening_history_${userId}`
      const history = encryptedGetItem(key, [])

      if (history.length > 0) {
        // Fetch recommendations for each recently played song
        const recommendationPromises = history.map(async (historySong) => {
          try {
            const res = await getRecommendations(historySong.id, 10)
            if (res.success && res.recommendations && res.recommendations.length > 0) {
              // Find the first recommended song that we can successfully fetch details for
              for (const rec of res.recommendations) {
                try {
                  const songRes = await getSong(rec.song_id)
                  if (songRes.success && songRes.data) {
                    return songRes.data
                  }
                } catch (err) {
                  console.warn(`Failed to fetch song details for recommendation ${rec.song_id}:`, err)
                }
              }
            }
          } catch (err) {
            console.error(`Failed to get recommendations for song ${historySong.id}:`, err)
          }
          return null
        })

        const recommendedSongs = (await Promise.all(recommendationPromises)).filter(Boolean)

        // De-duplicate recommended songs
        const seenIds = new Set()
        const uniqueRecommended = []
        for (const song of recommendedSongs) {
          if (!seenIds.has(song.id)) {
            seenIds.add(song.id)
            uniqueRecommended.push(song)
          }
        }

        // Pad with default For You mix if we have less than 12 recommendations
        if (uniqueRecommended.length < 12) {
          try {
            const defaultMix = await getForYouMix(12)
            if (defaultMix && defaultMix.songs) {
              for (const song of defaultMix.songs) {
                if (!seenIds.has(song.id)) {
                  seenIds.add(song.id)
                  uniqueRecommended.push(song)
                }
                if (uniqueRecommended.length >= 12) break
              }
            }
          } catch (e) {
            console.warn("Failed to fetch default mix for padding:", e)
          }
        }

        setForYou({ songs: uniqueRecommended.slice(0, 12), loading: false })
      } else {
        // Fallback to default For You mix
        const forYouData = await getForYouMix(12)
        setForYou({ songs: forYouData.songs || [], loading: false })
      }
    } catch (error) {
      console.error("Error loading discovery content:", error)
      try {
        const forYouData = await getForYouMix(12)
        setForYou({ songs: forYouData.songs || [], loading: false })
      } catch (fallbackError) {
        setForYou({ songs: [], loading: false })
      }
    } finally {
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

  const handlePlaySong = (song, context = null) => {
    playSong(song, context)
  }

  const loadCategorySongs = async (id, forceRefresh = false) => {
    if (id === 'section-for-you' || id === 'section-playlists') {
      setActiveCategory(id)
      setSelectedPlaylist(null)
      return
    }

    const cleanKey = id.replace('section-', '')
    
    // Check if we already have loaded content and are not force-refreshing
    if (!forceRefresh && activeCategory === id && categoryContent.songs.length > 0) {
      return
    }

    setActiveCategory(id)
    setCategoryContent(prev => ({ ...prev, loading: true, hasMore: true }))

    try {
      const result = await getFreshSongsForCategory(cleanKey, 16)
      if (result.success) {
        setCategoryContent({
          songs: result.songs,
          loading: false,
          loadingMore: false,
          title: result.title,
          query: result.query,
          page: result.page,
          hasMore: result.songs.length >= 8
        })
      } else {
        setCategoryContent({
          songs: [],
          loading: false,
          loadingMore: false,
          title: cleanKey.toUpperCase(),
          query: '',
          page: 0,
          hasMore: false
        })
      }
    } catch (error) {
      setCategoryContent({
        songs: [],
        loading: false,
        loadingMore: false,
        title: cleanKey.toUpperCase(),
        query: '',
        page: 0,
        hasMore: false
      })
    }
  }

  const handleCategoryClick = (id, forceRefresh = false) => {
    const isAlreadyActive = activeCategory === id
    loadCategorySongs(id, forceRefresh || isAlreadyActive)
  }

  const handleLoadMoreSongs = async () => {
    if (categoryContent.loadingMore || !categoryContent.hasMore) return

    const cleanKey = activeCategory.replace('section-', '')
    const nextPage = categoryContent.page + 1

    setCategoryContent(prev => ({ ...prev, loadingMore: true }))

    try {
      const result = await getMoreSongsForCategory(cleanKey, categoryContent.query, nextPage, 16)
      if (result.success && result.songs.length > 0) {
        // Filter out any songs that are already in the list
        const existingIds = new Set(categoryContent.songs.map(s => s.id))
        const newUniqueSongs = result.songs.filter(s => !existingIds.has(s.id))

        if (newUniqueSongs.length > 0) {
          setCategoryContent(prev => ({
            ...prev,
            songs: [...prev.songs, ...newUniqueSongs],
            page: nextPage,
            loadingMore: false,
            hasMore: result.songs.length >= 8
          }))
        } else {
          // If all fetched songs were duplicates, let's stop loading more to avoid endless loading loop
          setCategoryContent(prev => ({
            ...prev,
            loadingMore: false,
            hasMore: false
          }))
        }
      } else {
        setCategoryContent(prev => ({
          ...prev,
          loadingMore: false,
          hasMore: false
        }))
      }
    } catch (error) {
      setCategoryContent(prev => ({
        ...prev,
        loadingMore: false,
        hasMore: false
      }))
    }
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
    borderRadius: '11px',
    background: isActive
      ? (isDark ? 'rgba(224, 115, 86, 0.22)' : 'rgba(196, 92, 62, 0.12)')
      : 'var(--color-paper-dark)',
    backgroundImage: isActive ? 'none' : 'var(--background-image-ske-button)',
    border: isActive
      ? `1.5px solid ${colors.accent}`
      : `1px solid var(--color-border)`,
    boxShadow: isActive ? 'var(--shadow-ske-inset-sm)' : 'var(--shadow-ske-xs)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive ? colors.accent : colors.ink,
    transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
  })

  const renderHeading = (index, title, subtitle) => (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '12px',
      marginBottom: isMobile ? '12px' : 'clamp(14px, 3.5vw, 22px)',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
      paddingBottom: '8px',
    }}>
      <span style={{
        fontFamily: fonts.mono,
        fontSize: '0.72rem',
        fontWeight: 600,
        color: colors.accent,
        letterSpacing: '0.1em',
        opacity: 0.8,
      }}>
        {index}
      </span>
      <h2 style={{
        fontFamily: fonts.display,
        fontSize: isMobile ? 'clamp(1.15rem, 5.5vw, 1.35rem)' : 'clamp(1.3rem, 3.5vw, 1.55rem)',
        fontWeight: 800,
        color: colors.ink,
        margin: 0,
        letterSpacing: '-0.02em',
      }}>
        {title}
      </h2>
      {!isMobile && subtitle && (
        <span style={{
          fontFamily: fonts.mono,
          fontSize: '0.65rem',
          color: colors.inkLight,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginLeft: 'auto',
        }}>
          {subtitle}
        </span>
      )}
    </div>
  )

  const filteredPlaylistSongs = playlistSongs.filter(song => {
    const query = playlistSearchQuery.toLowerCase().trim()
    if (!query) return true
    const nameMatch = (song.name || song.title || '').toLowerCase().includes(query)
    const artistMatch = (song.primaryArtists || '').toLowerCase().includes(query)
    const albumMatch = (typeof song.album === 'string' ? song.album : song.album?.name || '').toLowerCase().includes(query)
    return nameMatch || artistMatch || albumMatch
  })

  return (
    <div style={{



      minHeight: '100vh',
      background: colors.paper,
      transition: 'background 0.3s ease',
    }}>
      {/* Background Ambient Glow Orbs - dynamic matching Spotify/Apple Music */}
      <div 
        className="glow-orb glow-orb-1" 
        style={{ 
          opacity: isDark ? 0.35 : 0.45,
          background: dominantColor ? dominantColor.rgba(isDark ? 0.16 : 0.10) : 'var(--color-accent-subtle)',
        }} 
      />
      <div 
        className="glow-orb glow-orb-2" 
        style={{ 
          opacity: isDark ? 0.25 : 0.35,
          background: dominantColor ? dominantColor.rgba(isDark ? 0.12 : 0.08) : 'rgba(224, 115, 86, 0.08)',
        }} 
      />

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: searchExpanded ? 1001 : 50,
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
        transition: searchExpanded ? 'none' : 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* ─── DESKTOP HEADER ROW ─────────────────────────────────────── */}
        {!isMobile && (
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
            <div className="header-left" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                fontFamily: fonts.display,
                fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
                fontWeight: 800,
                color: colors.ink,
                letterSpacing: '-0.03em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${colors.accent}30, var(--shadow-ske-xs)`,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                SAAFY
              </div>

              <div className="header-divider" style={{
                width: '1.5px',
                height: '24px',
                background: isDark
                  ? 'linear-gradient(to bottom, rgba(255,255,255,0.01), rgba(255,255,255,0.12), rgba(255,255,255,0.01))'
                  : 'linear-gradient(to bottom, rgba(0,0,0,0.01), rgba(0,0,0,0.08), rgba(0,0,0,0.01))'
              }} />

              <div className="header-greeting" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontFamily: fonts.primary,
                  fontSize: 'clamp(0.72rem, 1.8vw, 0.85rem)',
                  fontWeight: 650,
                  color: colors.ink,
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}>
                  {getGreeting()}
                </div>
                <div style={{
                  fontFamily: fonts.mono,
                  fontSize: 'clamp(0.58rem, 1.3vw, 0.6rem)',
                  color: colors.inkLight,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: '1px',
                  opacity: 0.85,
                }}>
                  {formatDate()}
                </div>
              </div>
            </div>

            {/* Center - Search (Desktop only) */}
            <div className="header-search" style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0, position: 'relative' }}>
              <BasicSearch 
                onSelectSong={handlePlaySong} 
                setSearchResults={setSearchResults} 
                setIsSearching={setIsSearching} 
                featuredSongs={forYou.songs} 
                listeningHistory={listeningHistory} 
                onExpandChange={setSearchExpanded}
              />
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
              <ListMusic size={18} />
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
                  const userId = currentUser ? (currentUser.id || currentUser._id) : 'guest'
                  loadListeningHistory(userId)
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
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#e07356' : '#c45c3e'} 100%)`,
                color: '#ffffff',
                border: `1px solid ${colors.accent}b0`,
                boxShadow: 'var(--shadow-ske-xs), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
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
              style={{
                ...iconBtnStyle(),
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
              title="Refresh Content"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>

            {/* User Profile / Auth */}
            <div ref={userDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  if (currentUser) {
                    setShowUserDropdown(!showUserDropdown)
                  } else {
                    setShowAuthModal(true)
                  }
                }}
                style={{
                  ...iconBtnStyle(showUserDropdown),
                  width: 'clamp(36px, 8vw, 40px)',
                  height: 'clamp(36px, 8vw, 40px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  overflow: 'hidden',
                }}
                title={currentUser ? `Account: ${currentUser.username}` : "Sign In"}
              >
                {currentUser ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    fontFamily: fonts.mono,
                    textTransform: 'uppercase',
                  }}>
                    {currentUser.username.substring(0, 2)}
                  </div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>

              {currentUser && showUserDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '240px',
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
                    padding: '14px',
                    borderBottom: `1px solid ${colors.rule}`,
                  }}>
                    <div style={{
                      fontFamily: fonts.primary,
                      fontSize: '0.85rem',
                      fontWeight: 650,
                      color: colors.ink,
                    }}>
                      {currentUser.username}
                    </div>
                    <div style={{
                      fontFamily: fonts.primary,
                      fontSize: '0.72rem',
                      color: colors.inkLight,
                      wordBreak: 'break-all',
                      marginTop: '2px',
                    }}>
                      {currentUser.email}
                    </div>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <button
                      onClick={() => {
                        encryptedSetItem('saafy_user', null)
                        setCurrentUser(null)
                        loadPlaylists(null)
                        setSelectedPlaylist(null)
                        setShowUserDropdown(false)
                        loadListeningHistory('guest')
                        loadDiscoveryContent(null)
                        toast.info('Signed out successfully')
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#EF4444',
                        fontFamily: fonts.primary,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* ─── MOBILE HEADER (single-row layout) ───────────────────────────── */}
        {isMobile && (
          <div className="mobile-header-wrapper" style={{
            padding: '10px 16px 10px 16px',
          }}>
            {/* Row 1: Profile + Search + Menu */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              height: '42px',
              position: 'relative',
            }}>
              {!searchExpanded && (
                <div style={{ position: 'relative', flexShrink: 0 }} ref={userDropdownRef}>
                  <button
                    onClick={() => {
                      if (currentUser) {
                        setShowUserDropdown(!showUserDropdown)
                      } else {
                        setShowAuthModal(true)
                      }
                    }}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      overflow: 'hidden',
                      border: currentUser
                        ? `1.5px solid ${colors.accent}60`
                        : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                      background: currentUser
                        ? `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`
                        : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                      cursor: 'pointer',
                      boxShadow: currentUser ? `0 2px 8px ${colors.accent}30` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    title={currentUser ? `Account: ${currentUser.username}` : "Sign In"}
                  >
                    {currentUser ? (
                      <span style={{
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        fontFamily: fonts.mono,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}>
                        {currentUser.username.substring(0, 2)}
                      </span>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.inkMuted} strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </button>

                  {currentUser && showUserDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '200px',
                      background: isDark ? 'rgba(28,24,22,0.96)' : 'rgba(252,249,244,0.97)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      borderRadius: '14px',
                      border: `1px solid ${colors.rule}`,
                      boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      zIndex: 300,
                    }}>
                      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.rule}` }}>
                        <div style={{ fontFamily: fonts.primary, fontSize: '0.82rem', fontWeight: 650, color: colors.ink }}>
                          {currentUser.username}
                        </div>
                        <div style={{ fontFamily: fonts.primary, fontSize: '0.68rem', color: colors.inkLight, wordBreak: 'break-all', marginTop: '2px' }}>
                          {currentUser.email}
                        </div>
                      </div>
                      <div style={{ padding: '6px' }}>
                        <button
                          onClick={() => {
                            encryptedSetItem('saafy_user', null)
                            setCurrentUser(null)
                            loadPlaylists(null)
                            setSelectedPlaylist(null)
                            setShowUserDropdown(false)
                            loadListeningHistory('guest')
                            loadDiscoveryContent(null)
                            toast.info('Signed out successfully')
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            color: '#EF4444',
                            fontFamily: fonts.primary,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{
                flex: 1,
                minWidth: 0,
                transition: 'all 0.3s ease',
              }}>
                <BasicSearch 
                  onSelectSong={handlePlaySong} 
                  setSearchResults={setSearchResults} 
                  setIsSearching={setIsSearching} 
                  featuredSongs={forYou.songs} 
                  listeningHistory={listeningHistory} 
                  onExpandChange={setSearchExpanded}
                />
              </div>

              {!searchExpanded && (
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="mobile-more-btn"
                  style={{
                    flexShrink: 0,
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: showMobileMenu
                      ? `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`
                      : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
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
                  <Menu size={17} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick scroll navigation category tab ribbon */}
        {!isSearching && !searchExpanded && (
          <nav className="category-nav-ribbon">
            {[
              { id: 'section-for-you', label: 'For You', icon: Sparkles },
              { id: 'section-playlists', label: 'My Playlists', icon: ListMusic, condition: currentUser !== null },
              { id: 'section-trending', label: 'Trending', icon: TrendingUp, condition: themed.trending?.songs && themed.trending.songs.length > 0 },
              { id: 'section-hindi', label: 'Hindi', icon: Languages },
              { id: 'section-english', label: 'English', icon: BookText },
              { id: 'section-punjabi', label: 'Punjabi', icon: Drum },
              { id: 'section-marathi', label: 'Marathi', icon: Landmark, condition: discovery.marathi?.songs && discovery.marathi.songs.length > 0 },
              { id: 'section-party', label: 'Party', icon: PartyPopper, condition: themed.party?.songs && themed.party.songs.length > 0 },
              { id: 'section-chill', label: 'Chill', icon: CloudMoon, condition: themed.chill?.songs && themed.chill.songs.length > 0 },
              { id: 'section-romantic', label: 'Romantic', icon: Heart, condition: themed.romantic?.songs && themed.romantic.songs.length > 0 },
              { id: 'section-workout', label: 'Workout', icon: Dumbbell, condition: themed.workout?.songs && themed.workout.songs.length > 0 },
            ].map((item) => {
              if (item.condition === false) return null;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`mobile-nav-tab ${activeCategory === item.id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
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
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* Sign In / Register (Mobile Menu) */}
              {!currentUser && (
                <button
                  onClick={() => { setShowAuthModal(true); setShowMobileMenu(false) }}
                  className="bottom-sheet-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#e07356' : '#c45c3e'} 100%)`,
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ffffff',
                    textAlign: 'left',
                    boxShadow: `0 4px 14px ${colors.accent}20`,
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontFamily: fonts.primary, fontWeight: 700, fontSize: '0.9rem' }}>Sign In / Register</div>
                    <div style={{ fontFamily: fonts.mono, fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Access your custom playlists</div>
                  </div>
                </button>
              )}

              {/* Profile Card & Sign Out (Mobile Menu) */}
              {currentUser && (
                <div style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '14px',
                  border: `1px solid ${colors.rule}`,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textTransform: 'uppercase',
                    }}>
                      {currentUser.username.substring(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontFamily: fonts.primary, fontWeight: 650, fontSize: '0.85rem', color: colors.ink }}>
                        {currentUser.username}
                      </div>
                      <div style={{ fontFamily: fonts.primary, fontSize: '0.7rem', color: colors.inkLight, wordBreak: 'break-all' }}>
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      encryptedSetItem('saafy_user', null)
                      setCurrentUser(null)
                      loadPlaylists(null)
                      setSelectedPlaylist(null)
                      setShowMobileMenu(false)
                      loadListeningHistory('guest')
                      loadDiscoveryContent(null)
                      toast.info('Signed out successfully')
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1px solid rgba(239, 68, 68, 0.2)`,
                      background: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)',
                      color: '#EF4444',
                      fontFamily: fonts.primary,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}

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
                  <ListMusic size={16} strokeWidth={2} color={colors.ink} />
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
                  const userId = currentUser ? (currentUser.id || currentUser._id) : 'guest'
                  setListeningHistory(getListeningHistory(userId))
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
                  const imageUrl = song.image?.[0]?.link || song.image?.[0]?.url ||
                    song.image?.[1]?.link || song.image?.[1]?.url ||
                    song.image?.[2]?.link || song.image?.[2]?.url || ''
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
      {/* Category ribbon is now inside header */}

      <main className="main-content" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(12px, 3.5vw, 32px)',
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
            ) : activeCategory === 'section-playlists' ? (
              <section style={{ position: 'relative', animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                {/* Soft ambient background glow */}
                <div style={{
                  position: 'absolute',
                  top: '120px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '85%',
                  height: '420px',
                  background: dominantColor 
                    ? `radial-gradient(circle, ${dominantColor.rgba(isDark ? 0.08 : 0.05)} 0%, transparent 70%)` 
                    : `radial-gradient(circle, ${colors.accent}0a 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  zIndex: 0,
                }} />

                {selectedPlaylist === null ? (
                  // Playlists List View
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '32px',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                        <h2 style={{
                          fontFamily: fonts.display,
                          fontSize: '2rem',
                          fontWeight: 800,
                          color: colors.ink,
                          letterSpacing: '-0.03em',
                          margin: 0,
                        }}>
                          My Playlists
                        </h2>
                        <span style={{
                          fontFamily: fonts.mono,
                          fontSize: '0.75rem',
                          color: colors.inkLight,
                          textTransform: 'uppercase',
                        }}>
                          {playlists.length} playlists
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            setIsImportingSpotify(false)
                            setIsCreatingPlaylist(!isCreatingPlaylist)
                          }}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: 'none',
                            background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#e07356' : '#c45c3e'} 100%)`,
                            color: '#fff',
                            fontFamily: fonts.primary,
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: `0 4px 14px ${colors.accent}20`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Create Playlist
                        </button>

                        {currentUser && (
                          <button
                            onClick={() => {
                              setIsCreatingPlaylist(false)
                              setIsImportingSpotify(!isImportingSpotify)
                            }}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '10px',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}`,
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                              color: colors.ink,
                              fontFamily: fonts.primary,
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)'}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#1DB954' }}>
                              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.893-1.026-.33.076-.662-.133-.738-.463-.077-.33.133-.662.463-.738 3.856-.88 7.15-.5 9.818 1.137.295.18.387.563.207.857zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.075-1.183-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.66-1.11 8.23-.57 11.345 1.342.367.227.487.708.26 1.076zm.105-2.81c-3.26-1.937-8.643-2.12-11.758-1.173-.5.15-1.02-.133-1.173-.633-.15-.5.133-1.02.633-1.173 3.616-1.1 9.54-.892 13.29 1.336.45.268.6.845.33 1.296-.268.45-.846.6-1.296.33z"/>
                            </svg>
                            Import Spotify
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Playlist Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '24px',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      {playlists.length === 0 ? (
                        <div style={{
                          gridColumn: '1 / -1',
                          textAlign: 'center',
                          padding: '64px 24px',
                          background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                          border: `1px dashed ${colors.rule}`,
                          borderRadius: '16px',
                          fontFamily: fonts.primary,
                          color: colors.inkLight,
                          fontSize: '0.9rem',
                        }}>
                          You don't have any playlists yet. Click "Create Playlist" to make your first one!
                        </div>
                      ) : (
                        playlists.map((playlist) => {
                          const hasSongs = playlist.songs && playlist.songs.length > 0
                          const coverImage = playlist.image || (hasSongs ? getPlaylistSongImage(playlist.songs[0]) : '')
                          return (
                            <div
                              key={playlist._id}
                              onClick={() => handlePlaylistClick(playlist)}
                              style={{
                                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.8)',
                                border: `1px solid ${colors.rule}`,
                                borderRadius: '18px',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: 'var(--shadow-ske-xs)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)'
                                e.currentTarget.style.boxShadow = 'var(--shadow-ske-sm)'
                                e.currentTarget.style.borderColor = colors.accent + '60'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'var(--shadow-ske-xs)'
                                e.currentTarget.style.borderColor = colors.rule
                              }}
                            >
                              {/* Playlist Cover art image */}
                              <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: `linear-gradient(135deg, ${colors.accent}20 0%, ${isDark ? '#e0735630' : '#c45c3e30'} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '14px',
                                boxShadow: 'var(--shadow-ske-inset-sm)',
                              }}>
                                {coverImage ? (
                                  <img src={coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="1.5" style={{ opacity: 0.6 }}>
                                    <path d="M9 18H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
                                    <path d="M13 18H21" />
                                    <path d="M17 14V22" />
                                    <path d="M6 6H14" />
                                    <path d="M6 10H10" />
                                  </svg>
                                )}
                              </div>
                              
                              <div style={{
                                fontFamily: fonts.primary,
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: colors.ink,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: '4px',
                              }}>{playlist.name}</div>
                              
                              <div style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.72rem',
                                color: colors.inkLight,
                              }}>{playlist.songs?.length || 0} tracks</div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  // Playlist Detail View
                  <div>
                    {/* Back Button */}
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.8rem',
                        color: colors.accent,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: 0,
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      ← Back to Playlists
                    </button>

                    {/* Playlist Detail Header */}
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'center' : 'flex-end',
                      gap: '24px',
                      marginBottom: '40px',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      {/* Large Cover Art */}
                      <div 
                        onClick={() => document.getElementById('update-playlist-image-input')?.click()}
                        style={{
                          width: '160px',
                          height: '160px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          background: `linear-gradient(135deg, ${colors.accent}20 0%, ${isDark ? '#e0735630' : '#c45c3e30'} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-ske-sm)',
                          flexShrink: 0,
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          const overlay = e.currentTarget.querySelector('.cover-edit-overlay');
                          if (overlay) overlay.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          const overlay = e.currentTarget.querySelector('.cover-edit-overlay');
                          if (overlay) overlay.style.opacity = '0';
                        }}
                        title="Click to update playlist cover"
                      >
                        {selectedPlaylist.image || (selectedPlaylist.songs && selectedPlaylist.songs.length > 0) ? (
                          <img src={selectedPlaylist.image || getPlaylistSongImage(selectedPlaylist.songs[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="1.5">
                            <path d="M9 18H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
                            <path d="M13 18H21" />
                            <path d="M17 14V22" />
                            <path d="M6 6H14" />
                            <path d="M6 10H10" />
                          </svg>
                        )}
                        {/* Edit Overlay */}
                        <div 
                          className="cover-edit-overlay"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            pointerEvents: 'none',
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                        <input 
                          type="file" 
                          id="update-playlist-image-input" 
                          accept="image/*" 
                          onChange={handleUpdatePlaylistImage} 
                          style={{ display: 'none' }} 
                        />
                      </div>

                      {/* Metadata & Actions */}
                      <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
                        <span style={{
                          fontFamily: fonts.mono,
                          fontSize: '0.68rem',
                          color: colors.accent,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontWeight: 700,
                        }}>
                          Playlist
                        </span>
                        
                        {isEditingName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 10px 0' }}>
                            <input
                              type="text"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onBlur={handleSavePlaylistName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePlaylistName()
                                if (e.key === 'Escape') {
                                  setIsEditingName(false)
                                  setEditingNameValue(selectedPlaylist.name)
                                }
                              }}
                              style={{
                                fontFamily: fonts.display,
                                fontSize: '2rem',
                                fontWeight: 800,
                                color: colors.ink,
                                background: 'transparent',
                                border: 'none',
                                borderBottom: `2px solid ${colors.accent}`,
                                outline: 'none',
                                padding: '0',
                                width: '100%',
                                maxWidth: '300px',
                              }}
                              autoFocus
                            />
                            <button 
                              onClick={handleSavePlaylistName} 
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                cursor: 'pointer', 
                                color: colors.accent,
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                              }}
                            >
                              <Check size={20} />
                            </button>
                          </div>
                        ) : (
                          <h1 
                            onClick={() => {
                              setIsEditingName(true)
                              setEditingNameValue(selectedPlaylist.name)
                            }}
                            style={{
                              fontFamily: fonts.display,
                              fontSize: '2.5rem',
                              fontWeight: 800,
                              color: colors.ink,
                              letterSpacing: '-0.03em',
                              margin: '4px 0 10px 0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                            title="Click to edit playlist name"
                            onMouseEnter={(e) => {
                              const icon = e.currentTarget.querySelector('.pencil-icon')
                              if (icon) icon.style.opacity = '1'
                            }}
                            onMouseLeave={(e) => {
                              const icon = e.currentTarget.querySelector('.pencil-icon')
                              if (icon) icon.style.opacity = '0'
                            }}
                          >
                            {selectedPlaylist.name}
                            <Pencil 
                              className="pencil-icon" 
                              size={18} 
                              style={{ 
                                opacity: 0, 
                                transition: 'opacity 0.2s ease', 
                                color: colors.accent 
                              }} 
                            />
                          </h1>
                        )}

                        <div style={{
                          fontFamily: fonts.primary,
                          fontSize: '0.85rem',
                          color: colors.inkLight,
                          marginBottom: '20px',
                        }}>
                          Created by <strong style={{ color: colors.ink }}>{currentUser.username}</strong> • {selectedPlaylist.songs?.length || 0} tracks
                        </div>

                        {/* Actions */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isMobile ? 'center' : 'flex-start',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}>
                          <button
                            onClick={handlePlayPlaylist}
                            disabled={playlistSongs.length === 0 || playlistSongsLoading}
                            style={{
                              padding: '12px 24px',
                              borderRadius: '12px',
                              border: 'none',
                              background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#e07356' : '#c45c3e'} 100%)`,
                              color: '#fff',
                              fontFamily: fonts.primary,
                              fontSize: '0.9rem',
                              fontWeight: 650,
                              cursor: 'pointer',
                              boxShadow: `0 4px 16px ${colors.accent}30`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s',
                              opacity: (playlistSongs.length === 0 || playlistSongsLoading) ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => { if (playlistSongs.length > 0) e.currentTarget.style.filter = 'brightness(1.05)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            Play Playlist
                          </button>

                          <button
                            onClick={handleShufflePlayPlaylist}
                            disabled={playlistSongs.length === 0 || playlistSongsLoading}
                            style={{
                              padding: '12px 24px',
                              borderRadius: '12px',
                              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'}`,
                              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                              color: colors.ink,
                              fontFamily: fonts.primary,
                              fontSize: '0.9rem',
                              fontWeight: 650,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s',
                              opacity: (playlistSongs.length === 0 || playlistSongsLoading) ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => { if (playlistSongs.length > 0) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                            onMouseLeave={(e) => { if (playlistSongs.length > 0) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)' }}
                          >
                            <Shuffle size={14} />
                            Shuffle Play
                          </button>

                          <button
                            onClick={() => handleDeletePlaylist(selectedPlaylist._id)}
                            style={{
                              padding: '12px',
                              borderRadius: '12px',
                              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
                              background: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)',
                              color: '#EF4444',
                              fontFamily: fonts.primary,
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#EF4444'
                              e.currentTarget.style.color = '#fff'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)'
                              e.currentTarget.style.color = '#EF4444'
                            }}
                            title="Delete Playlist"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Playlist Songs List */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      {playlistSongsLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[1, 2, 3].map((n) => (
                            <div 
                              key={n} 
                              style={{
                                height: '70px',
                                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                                borderRadius: '12px',
                                animation: 'pulse 1.5s infinite ease-in-out'
                              }} 
                            />
                          ))}
                        </div>
                      ) : playlistSongs.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '64px 24px',
                          background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                          border: `1px dashed ${colors.rule}`,
                          borderRadius: '16px',
                          fontFamily: fonts.primary,
                          color: colors.inkLight,
                          fontSize: '0.9rem',
                        }}>
                          No tracks in this playlist yet. Browse songs and click the "+" icon to add them here!
                        </div>
                      ) : (
                        <div>
                          {/* Search & Header Row */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px',
                            gap: '16px',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <h3 style={{
                                fontFamily: fonts.display,
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: colors.ink,
                                margin: 0,
                              }}>
                                Tracks
                              </h3>
                              
                              {/* View Mode Switcher */}
                              <div style={{
                                display: 'flex',
                                background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                borderRadius: '8px',
                                padding: '2px',
                                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                                gap: '2px',
                              }}>
                                <button
                                  onClick={() => setPlaylistViewMode('list')}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: playlistViewMode === 'list' 
                                      ? (isDark ? 'rgba(224, 115, 86, 0.18)' : 'rgba(196, 92, 62, 0.12)') 
                                      : 'transparent',
                                    color: playlistViewMode === 'list' ? colors.accent : colors.inkMuted,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                  }}
                                  title="List View"
                                >
                                  <List size={15} strokeWidth={2.2} />
                                </button>
                                <button
                                  onClick={() => setPlaylistViewMode('card')}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: playlistViewMode === 'card' 
                                      ? (isDark ? 'rgba(224, 115, 86, 0.18)' : 'rgba(196, 92, 62, 0.12)') 
                                      : 'transparent',
                                    color: playlistViewMode === 'card' ? colors.accent : colors.inkMuted,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                  }}
                                  title="Card View"
                                >
                                  <Grid size={15} strokeWidth={2.2} />
                                </button>
                              </div>
                            </div>
                            
                            {/* Search Input Container */}
                            <div style={{
                              position: 'relative',
                              width: isMobile ? '100%' : '260px',
                              display: 'flex',
                              alignItems: 'center',
                            }}>
                              <span style={{
                                position: 'absolute',
                                left: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                color: colors.inkLight,
                                pointerEvents: 'none',
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.7 }}>
                                  <circle cx="11" cy="11" r="8" />
                                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                              </span>
                              <input
                                type="text"
                                placeholder="Search within playlist..."
                                value={playlistSearchQuery}
                                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 36px 8px 34px',
                                  borderRadius: '10px',
                                  fontSize: '0.85rem',
                                  fontFamily: fonts.primary,
                                  color: colors.ink,
                                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                                  outline: 'none',
                                  transition: 'all 0.2s ease',
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = colors.accent;
                                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.9)';
                                  e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}15`;
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
                                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              />
                              {playlistSearchQuery && (
                                <button
                                  onClick={() => setPlaylistSearchQuery('')}
                                  style={{
                                    position: 'absolute',
                                    right: '10px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: colors.inkLight,
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                                  onMouseLeave={(e) => e.currentTarget.style.color = colors.inkLight}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {playlistViewMode === 'list' ? (
                            <>
                              {/* Table Headers */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 16px',
                                borderBottom: `1px solid ${colors.rule}`,
                                color: colors.inkLight,
                                fontFamily: fonts.mono,
                                fontSize: '0.72rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '12px',
                              }}>
                                <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>#</div>
                                <div style={{ flex: 2, minWidth: 0, paddingLeft: '16px' }}>Title</div>
                                <div style={{ flex: 1.5, minWidth: 0, display: isMobile ? 'none' : 'block', paddingLeft: '16px' }}>Album</div>
                                <div style={{ width: '80px', textAlign: 'right', paddingRight: '24px', flexShrink: 0, display: isMobile ? 'none' : 'block' }}>
                                  <Clock size={13} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                                </div>
                                <div style={{ width: '120px', textAlign: 'right', flexShrink: 0 }}>Actions</div>
                              </div>

                              {/* Song Rows */}
                              {filteredPlaylistSongs.length === 0 ? (
                                <div style={{
                                  textAlign: 'center',
                                  padding: '48px 24px',
                                  background: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.005)',
                                  border: `1px dashed ${colors.rule}`,
                                  borderRadius: '12px',
                                  fontFamily: fonts.primary,
                                  color: colors.inkLight,
                                  fontSize: '0.88rem',
                                  marginTop: '8px',
                                }}>
                                  No matching tracks found for "{playlistSearchQuery}"
                                </div>
                              ) : (
                                filteredPlaylistSongs.map((song, index) => {
                                  const isCurrentSong = currentSong?.id === song.id
                                  const imageUrl = getPlaylistSongImage(song)

                                  return (
                                    <div
                                    key={song.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: '10px 16px',
                                      borderRadius: '12px',
                                      background: isCurrentSong 
                                        ? (isDark ? 'rgba(224, 115, 86, 0.08)' : 'rgba(196, 92, 62, 0.05)') 
                                        : 'transparent',
                                      border: `1px solid ${isCurrentSong ? colors.accent + '25' : 'transparent'}`,
                                      marginBottom: '6px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onClick={() => handlePlaySong(song, playlistSongs)}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = isCurrentSong 
                                        ? (isDark ? 'rgba(224, 115, 86, 0.12)' : 'rgba(196, 92, 62, 0.08)') 
                                        : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')
                                      if (!isCurrentSong) e.currentTarget.style.borderColor = colors.border
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = isCurrentSong 
                                        ? (isDark ? 'rgba(224, 115, 86, 0.08)' : 'rgba(196, 92, 62, 0.05)') 
                                        : 'transparent'
                                      e.currentTarget.style.borderColor = isCurrentSong ? colors.accent + '25' : 'transparent'
                                    }}
                                  >
                                    {/* Index / Pulse Animation */}
                                    <div style={{
                                      width: '32px',
                                      color: isCurrentSong ? colors.accent : colors.inkLight,
                                      fontFamily: fonts.mono,
                                      fontSize: '0.85rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}>
                                      {isCurrentSong && isPlaying ? (
                                        <div style={{ display: 'flex', gap: '2.5px', alignItems: 'flex-end', height: '14px' }}>
                                          {[0.6, 1, 0.45].map((h, i) => (
                                            <div
                                              key={i}
                                              style={{
                                                width: '2px',
                                                height: `${h * 100}%`,
                                                background: colors.accent,
                                                borderRadius: '1px',
                                                animation: `pulse 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                                                transformOrigin: 'bottom',
                                              }}
                                            />
                                          ))}
                                        </div>
                                      ) : (
                                        <span>{String(index + 1).padStart(2, '0')}</span>
                                      )}
                                    </div>

                                    {/* Title (Art + Name + Artist) */}
                                    <div style={{
                                      flex: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '16px',
                                      minWidth: 0,
                                      paddingLeft: '16px',
                                    }}>
                                      <img
                                        src={imageUrl || '/placeholder.png'}
                                        alt=""
                                        style={{
                                          width: '40px',
                                          height: '40px',
                                          borderRadius: '8px',
                                          objectFit: 'cover',
                                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                          flexShrink: 0,
                                        }}
                                      />
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{
                                          fontFamily: fonts.primary,
                                          fontWeight: 600,
                                          fontSize: '0.9rem',
                                          color: isCurrentSong ? colors.accent : colors.ink,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}>
                                          {song.name || song.title}
                                        </div>
                                        <div style={{
                                          fontFamily: fonts.primary,
                                          fontSize: '0.75rem',
                                          color: colors.inkLight,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          marginTop: '2px',
                                        }}>
                                          {song.primaryArtists || 'Unknown Artist'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Album Column */}
                                    <div style={{
                                      flex: 1.5,
                                      minWidth: 0,
                                      display: isMobile ? 'none' : 'block',
                                      paddingLeft: '16px',
                                      fontFamily: fonts.primary,
                                      fontSize: '0.85rem',
                                      color: colors.inkMuted,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}>
                                      {song.album?.name || song.album || 'Single'}
                                    </div>

                                    {/* Duration Column */}
                                    <div style={{
                                      width: '80px',
                                      textAlign: 'right',
                                      paddingRight: '24px',
                                      flexShrink: 0,
                                      display: isMobile ? 'none' : 'block',
                                      fontFamily: fonts.mono,
                                      fontSize: '0.82rem',
                                      color: colors.inkMuted,
                                    }}>
                                      {formatDuration(song.duration)}
                                    </div>

                                    {/* Actions Column */}
                                    <div 
                                      style={{
                                        width: '120px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        gap: '10px',
                                        flexShrink: 0,
                                      }}
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => handlePlaySong(song, playlistSongs)}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: colors.inkMuted,
                                          cursor: 'pointer',
                                          padding: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                                        onMouseLeave={(e) => e.currentTarget.style.color = colors.inkMuted}
                                        title="Play"
                                      >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      </button>

                                      <button
                                        onClick={() => {
                                          addToQueue(song)
                                          toast.success("Added to Queue")
                                        }}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: colors.inkMuted,
                                          cursor: 'pointer',
                                          padding: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                                        onMouseLeave={(e) => e.currentTarget.style.color = colors.inkMuted}
                                        title="Add to Queue"
                                      >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <line x1="12" y1="5" x2="12" y2="19" />
                                          <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                      </button>

                                      <button
                                        onClick={() => handleRemoveSong(song.id)}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: 'rgba(239, 68, 68, 0.65)',
                                          cursor: 'pointer',
                                          padding: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.65)'}
                                        title="Remove from Playlist"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <polyline points="3 6 5 6 21 6" />
                                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                          <line x1="10" y1="11" x2="10" y2="17" />
                                          <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </>
                        ) : (
                          /* Card View Grid */
                          filteredPlaylistSongs.length === 0 ? (
                            <div style={{
                              textAlign: 'center',
                              padding: '48px 24px',
                              background: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.005)',
                              border: `1px dashed ${colors.rule}`,
                              borderRadius: '12px',
                              fontFamily: fonts.primary,
                              color: colors.inkLight,
                              fontSize: '0.88rem',
                              marginTop: '8px',
                            }}>
                              No matching tracks found for "{playlistSearchQuery}"
                            </div>
                          ) : (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                              gap: '20px',
                              marginTop: '8px',
                            }}>
                              {filteredPlaylistSongs.map((song, index) => {
                                const isCurrentSong = currentSong?.id === song.id
                                const imageUrl = getPlaylistSongImage(song)
                                return (
                                  <PlaylistSongCard
                                    key={song.id}
                                    song={song}
                                    index={index}
                                    imageUrl={imageUrl}
                                    isCurrentSong={isCurrentSong}
                                    isPlaying={isPlaying}
                                    colors={colors}
                                    fonts={fonts}
                                    isDark={isDark}
                                    handlePlaySong={handlePlaySong}
                                    playlistSongs={playlistSongs}
                                    addToQueue={addToQueue}
                                    handleRemoveSong={handleRemoveSong}
                                    toast={toast}
                                  />
                                )
                              })}
                            </div>
                          )
                        )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            ) : activeCategory !== 'section-for-you' ? (
              <section style={{ position: 'relative', animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                <style>{`
                  @keyframes badgePulse {
                    0% { box-shadow: 0 0 0 0 ${colors.accent}40; }
                    70% { box-shadow: 0 0 0 8px ${colors.accent}00; }
                    100% { box-shadow: 0 0 0 0 ${colors.accent}00; }
                  }
                  .refresh-btn:hover svg {
                    transform: rotate(180deg);
                  }
                  .load-more-btn:hover svg {
                    transform: translateY(3px);
                  }
                  .load-more-btn:active, .refresh-btn:active {
                    transform: scale(0.97) !important;
                  }
                `}</style>

                {/* Soft ambient background glow matching page theme */}
                <div style={{
                  position: 'absolute',
                  top: '120px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '85%',
                  height: '420px',
                  background: dominantColor 
                    ? `radial-gradient(circle, ${dominantColor.rgba(isDark ? 0.08 : 0.05)} 0%, transparent 70%)` 
                    : `radial-gradient(circle, ${colors.accent}0a 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  zIndex: 0,
                  transition: 'background 0.8s ease',
                }} />


                {/* Category Premium Header Banner with Enhanced Glassmorphism */}
                <div style={{
                  background: isDark ? 'rgba(15, 15, 15, 0.45)' : 'rgba(255, 255, 255, 0.45)',
                  backdropFilter: 'blur(30px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                  borderRadius: '24px',
                  padding: isMobile ? '24px 20px' : '32px 40px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  borderLeft: `5px solid ${colors.accent}`,
                  boxShadow: `0 16px 40px rgba(0, 0, 0, ${isDark ? 0.22 : 0.05}), inset 0 1px 0 var(--ske-highlight)`,
                  marginBottom: '32px',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  zIndex: 1,
                }}>
                  {/* Subtle banner inner lighting glow */}
                  <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '300px',
                    height: '300px',
                    background: `radial-gradient(circle, ${colors.accent}10 0%, transparent 70%)`,
                    pointerEvents: 'none',
                    zIndex: -1,
                  }} />

                  <div style={{ zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span 
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: colors.accent,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          background: isDark ? 'rgba(224,115,86,0.15)' : 'rgba(196,92,62,0.1)',
                          padding: '5px 12px',
                          borderRadius: '12px',
                          border: `1px solid ${colors.accent}35`,
                          boxShadow: `0 0 12px ${colors.accent}20`,
                          animation: 'badgePulse 2s infinite',
                        }}
                      >
                        Category Mix
                      </span>
                    </div>
                    <h1 style={{
                      fontFamily: fonts.display,
                      fontSize: isMobile ? '1.8rem' : '2.5rem',
                      fontWeight: 800,
                      color: colors.ink,
                      margin: 0,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}>
                      {categoryContent.title || 'Loading category...'}
                    </h1>
                    {categoryContent.query && (
                      <p style={{
                        fontFamily: fonts.primary,
                        fontSize: '0.875rem',
                        color: colors.inkMuted,
                        marginTop: '10px',
                        marginBottom: 0,
                      }}>
                        Featuring curated content matching <span style={{ fontFamily: fonts.mono, color: colors.accent, fontWeight: 600 }}>"{categoryContent.query}"</span> · Refreshed dynamically
                      </p>
                    )}
                  </div>
                  
                  {/* Refresh Button inside banner */}
                  <button
                    onClick={() => handleCategoryClick(activeCategory, true)}
                    className="ske-raised refresh-btn"
                    disabled={categoryContent.loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '14px',
                      background: colors.paperDark,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      fontFamily: fonts.mono,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: colors.ink,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      cursor: categoryContent.loading ? 'default' : 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      zIndex: 2,
                    }}
                  >
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                      style={{ 
                        transition: 'transform 0.4s ease',
                        animation: categoryContent.loading ? 'spin 1s linear infinite' : 'none' 
                      }}
                    >
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    <span>Refresh Mix</span>
                  </button>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {categoryContent.loading ? (
                    /* Custom Skeleton Loader for Category Grid view */
                    <DiscoverSection 
                      songs={[]} 
                      loading={true} 
                      layout="grid" 
                    />
                  ) : categoryContent.songs.length > 0 ? (
                    /* Premium Category Grid Layout & Load More */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <DiscoverSection 
                        songs={categoryContent.songs} 
                        loading={false} 
                        layout="grid" 
                        onPlaySong={handlePlaySong} 
                        onAddToQueue={addToQueue} 
                      />
                      
                      {categoryContent.hasMore && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', position: 'relative', zIndex: 2 }}>
                          <button
                            onClick={handleLoadMoreSongs}
                            disabled={categoryContent.loadingMore}
                            className="ske-raised load-more-btn"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '14px 32px',
                              borderRadius: '16px',
                              background: colors.paperDark,
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                              fontFamily: fonts.mono,
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: colors.ink,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              cursor: categoryContent.loadingMore ? 'default' : 'pointer',
                              boxShadow: 'var(--shadow-ske-sm)',
                              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                          >
                            {categoryContent.loadingMore ? (
                              <>
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2.5"
                                  style={{ animation: 'spin 1s linear infinite' }}
                                >
                                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                </svg>
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2.5"
                                  style={{ transition: 'transform 0.2s ease' }}
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                                <span>Load More Tracks</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '64px 0',
                      fontFamily: fonts.mono,
                      color: colors.inkLight,
                    }}>
                      No songs found for this category
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <div>
                {/* For You */}
                <section id="section-for-you" style={getStaggerStyle(0, isMobile ? '20px' : 'clamp(28px, 6vw, 56px)')}>

                  {/* Curated Greeting for Mobile */}
                  {isMobile && (
                    <div style={{
                      marginBottom: '18px',
                      paddingLeft: '4px',
                      marginTop: '6px',
                    }}>
                      <div style={{
                        fontFamily: fonts.primary,
                        fontSize: 'clamp(1.4rem, 6vw, 1.7rem)',
                        fontWeight: 800,
                        color: colors.ink,
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                      }}>
                        {getGreeting()} 👋
                      </div>
                      <div style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.72rem',
                        color: colors.inkLight,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginTop: '4px',
                      }}>
                        {formatDate()}
                      </div>
                    </div>
                  )}

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

                    </div>

                    {/* Row 2: title */}
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
                    </div>
                  </div>

                  {/* Featured cards container */}
                  <div style={{
                    borderRadius: isMobile ? '14px' : '18px',
                    padding: isMobile ? '10px' : 'clamp(10px, 2.5vw, 16px)',
                    background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                    boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.05)' : 'inset 0 1px 1px rgba(0,0,0,0.02)',
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
                    <section id="section-recommendations" style={getStaggerStyle(1)}>
                      {renderHeading("01", `Similar to "${currentSong.name || currentSong.title}"`, "Top Recommendations")}
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
                        {renderHeading("02", "More Like This", "You might also like")}
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
                      <section id="section-party" style={getStaggerStyle(3)}>
                        {renderHeading("03", themed.party.title, "Get the vibe started")}
                        <DiscoverSection
                          songs={themed.party.songs}
                          loading={loading}
                          onPlaySong={handlePlaySong}
                          onAddToQueue={addToQueue}
                        />
                      </section>
                    )}

                    {themed.chill?.songs && themed.chill.songs.length > 0 && (
                      <section id="section-chill" style={getStaggerStyle(4)}>
                        {renderHeading("04", themed.chill.title, "Relax and unwind")}
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
                      <section id="section-trending" style={getStaggerStyle(1)}>
                        {renderHeading("02", themed.trending.title, "What's hot right now")}
                        <DiscoverSection
                          songs={themed.trending.songs}
                          loading={loading}
                          onPlaySong={handlePlaySong}
                          onAddToQueue={addToQueue}
                        />
                      </section>
                    )}

                    {/* Hindi */}
                    <section id="section-hindi" style={getStaggerStyle(2)}>
                      {renderHeading("03", "Hindi", "Indian top hits")}
                      <DiscoverSection songs={discovery.hindi?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                    </section>

                    {/* Party Hits */}
                    {themed.party?.songs && themed.party.songs.length > 0 && (
                      <section id="section-party" style={getStaggerStyle(3)}>
                        {renderHeading("04", themed.party.title, "Get the vibe started")}
                        <DiscoverSection
                          songs={themed.party.songs}
                          loading={loading}
                          onPlaySong={handlePlaySong}
                          onAddToQueue={addToQueue}
                        />
                      </section>
                    )}

                    {/* English */}
                    <section id="section-english" style={getStaggerStyle(4)}>
                      {renderHeading("05", "English", "International top chart")}
                      <DiscoverSection songs={discovery.english?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                    </section>

                    {/* Chill Vibes */}
                    {themed.chill?.songs && themed.chill.songs.length > 0 && (
                      <section id="section-chill" style={getStaggerStyle(5)}>
                        {renderHeading("06", themed.chill.title, "Relax and unwind")}
                        <DiscoverSection
                          songs={themed.chill.songs}
                          loading={loading}
                          onPlaySong={handlePlaySong}
                          onAddToQueue={addToQueue}
                        />
                      </section>
                    )}

                    {/* Punjabi */}
                    <section id="section-punjabi" style={getStaggerStyle(6)}>
                      {renderHeading("07", "Punjabi", "High energy beats")}
                      <DiscoverSection songs={discovery.punjabi?.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                    </section>

                    {/* Romantic */}
                    {themed.romantic?.songs && themed.romantic.songs.length > 0 && (
                      <section id="section-romantic" style={getStaggerStyle(7)}>
                        {renderHeading("08", themed.romantic.title, "Melodies for your heart")}
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
                      <section id="section-marathi" style={getStaggerStyle(8)}>
                        {renderHeading("09", "Marathi", "Regional favorites")}
                        <DiscoverSection songs={discovery.marathi.songs} loading={loading} onPlaySong={handlePlaySong} onAddToQueue={addToQueue} />
                      </section>
                    )}

                    {/* Workout Energy */}
                    {themed.workout?.songs && themed.workout.songs.length > 0 && (
                      <section id="section-workout" style={getStaggerStyle(9)}>
                        {renderHeading("10", themed.workout.title, "Power up your session")}
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

      <BasicPlayer showQueue={showQueue} setShowQueue={setShowQueue} />
      <QueuePanel isOpen={showQueue} onClose={() => setShowQueue(false)} />


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

      {/* Modals with animate presence */}
      <AnimatePresence>
        {showAuthModal && (
          <UserAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {isCreatingPlaylist && (
          <CreatePlaylistModal
            isOpen={isCreatingPlaylist}
            onClose={() => setIsCreatingPlaylist(false)}
            currentUser={currentUser}
            createPlaylist={createPlaylist}
            onSuccess={(name) => {
              toast.success(`Playlist "${name}" created!`)
              setIsCreatingPlaylist(false)
            }}
          />
        )}
        {isImportingSpotify && (
          <SpotifyImportModal
            isOpen={isImportingSpotify}
            onClose={() => setIsImportingSpotify(false)}
            currentUser={currentUser}
            importSpotifyPlaylist={importSpotifyPlaylist}
            onSuccess={(playlistName) => {
              toast.success(`Spotify playlist "${playlistName}" imported successfully!`)
              setIsImportingSpotify(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── PlaylistSongCard Grid Component ──────────────────────────────────────────
function PlaylistSongCard({ 
  song, 
  index, 
  imageUrl, 
  isCurrentSong, 
  isPlaying, 
  colors, 
  fonts, 
  isDark, 
  handlePlaySong, 
  playlistSongs, 
  addToQueue, 
  handleRemoveSong,
  toast
}) {
  const [hovered, setHovered] = useState(false)
  const [added, setAdded] = useState(false)

  const handleQueueClick = (e) => {
    e.stopPropagation()
    if (added) return
    addToQueue(song)
    setAdded(true)
    toast.success("Added to Queue")
    setTimeout(() => setAdded(false), 2000)
  }

  const handleRemoveClick = (e) => {
    e.stopPropagation()
    handleRemoveSong(song.id)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => handlePlaySong(song, playlistSongs)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        borderRadius: '16px',
        background: hovered 
          ? (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)') 
          : 'transparent',
        border: `1px solid ${isCurrentSong 
          ? colors.accent + '50' 
          : (hovered ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent')}`,
        boxShadow: hovered ? 'var(--shadow-ske-xs)' : 'none',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Artwork Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        borderRadius: '12px',
        overflow: 'hidden',
        background: colors.paperDarker,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: 'var(--shadow-ske-inset-sm)',
        marginBottom: '10px',
      }}>
        <img 
          src={imageUrl || '/placeholder.png'} 
          alt="" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }} 
        />

        {/* Hover / Active Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isCurrentSong && isPlaying 
            ? 'rgba(0, 0, 0, 0.4)' 
            : (hovered ? 'rgba(0, 0, 0, 0.35)' : 'transparent'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: (hovered || isCurrentSong) ? 1 : 0,
          transition: 'all 0.25s ease',
          backdropFilter: hovered ? 'blur(2px)' : 'none',
          WebkitBackdropFilter: hovered ? 'blur(2px)' : 'none',
        }}>
          {/* Centered Play/Pause Button */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isCurrentSong && isPlaying ? colors.accent : 'rgba(255, 255, 255, 0.9)',
            color: isCurrentSong && isPlaying ? '#ffffff' : '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            transform: hovered ? 'scale(1.05)' : 'scale(0.9)',
            transition: 'all 0.2s ease',
          }}>
            {isCurrentSong && isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>

          {/* Action buttons (Queue & Delete) at top corners on hover */}
          {hovered && (
            <div 
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '6px',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Queue Button */}
              <button
                onClick={handleQueueClick}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: added ? 'rgba(16, 185, 129, 0.95)' : 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s ease',
                }}
                title={added ? "Added!" : "Add to Queue"}
              >
                {added ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>

              {/* Remove Button */}
              <button
                onClick={handleRemoveClick}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s ease',
                }}
                title="Remove from playlist"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Container */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: fonts.primary,
          fontWeight: 600,
          fontSize: '0.85rem',
          color: isCurrentSong ? colors.accent : colors.ink,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
        }}>
          {song.name || song.title}
        </div>
        <div style={{
          fontFamily: fonts.primary,
          fontSize: '0.72rem',
          color: colors.inkLight,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          marginTop: '2px',
        }}>
          {song.primaryArtists || 'Unknown Artist'}
        </div>
      </div>
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
