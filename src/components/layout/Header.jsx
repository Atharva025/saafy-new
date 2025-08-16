import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Crown, Play, Music, X, Pause, ListMusic } from 'lucide-react'
import { searchSongs, searchArtists, searchPlaylists } from '@/lib/api'
import { usePlayer } from '@/context/PlayerContext'
import { getOptimizedImageUrl } from '@/lib/utils'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [searchResults, setSearchResults] = useState({ songs: [], artists: [], playlists: [] })
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const { playSong, currentSong, isPlaying, togglePlay, queue } = usePlayer()

  // Update search query when URL params change
  useEffect(() => {
    const query = searchParams.get('q') || ''
    setSearchQuery(query)
  }, [searchParams])

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() && isSearchFocused) {
        performLiveSearch(searchQuery.trim())
      } else {
        setSearchResults({ songs: [], artists: [], playlists: [] })
        setShowResults(false)
      }
    }, 300) // Debounce delay of 300ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery, isSearchFocused])

  // Handle clicks outside search to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false)
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performLiveSearch = async (query) => {
    setLoading(true)
    try {
      const [songsResponse, artistsResponse, playlistsResponse] = await Promise.allSettled([
        searchSongs(query, 0, 5),
        searchArtists(query, 0, 3),
        searchPlaylists(query, 0, 3)
      ])

      const results = {
        songs: songsResponse.status === 'fulfilled' && songsResponse.value.data?.results
          ? songsResponse.value.data.results : [],
        artists: artistsResponse.status === 'fulfilled' && artistsResponse.value.data?.results
          ? artistsResponse.value.data.results : [],
        playlists: playlistsResponse.status === 'fulfilled' && playlistsResponse.value.data?.results
          ? playlistsResponse.value.data.results : []
      }

      setSearchResults(results)
      setShowResults(true)
    } catch (error) {
      console.error('Live search error:', error)
      setSearchResults({ songs: [], artists: [], playlists: [] })
    } finally {
      setLoading(false)
    }
  }

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)

    // Update URL params
    if (value.trim()) {
      setSearchParams({ q: value })
    } else {
      setSearchParams({})
    }
  }

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearchFocused(false)
      setShowResults(false)
      // Navigate to search page if not already there
      if (location.pathname !== '/app/search') {
        navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const handleSongPlay = (song) => {
    playSong(song)
    setIsSearchFocused(false)
    setShowResults(false)
  }

  const handleResultClick = (type, id) => {
    setIsSearchFocused(false)
    setShowResults(false)

    switch (type) {
      case 'artist':
        navigate(`/app/artist/${id}`)
        break
      case 'playlist':
        navigate(`/app/playlist/${id}`)
        break
      default:
        break
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchParams({})
    setSearchResults({ songs: [], artists: [], playlists: [] })
    setShowResults(false)
  }

  const getImageUrl = (imageArray) => {
    if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
      return 'https://via.placeholder.com/50x50/6366f1/ffffff?text=Music'
    }

    const image = imageArray.find(img => img.quality === '150x150') ||
      imageArray.find(img => img.quality === '50x50') ||
      imageArray[1] ||
      imageArray[0]

    return image?.url || image?.link || 'https://via.placeholder.com/50x50/6366f1/ffffff?text=Music'
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background-primary/80 backdrop-blur-strong border-b border-surface-primary/30"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo */}
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow-sm">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-primary rounded-2xl blur opacity-30 animate-pulse-glow"></div>
              </div>
              <span className="text-white text-2xl font-heading font-bold bg-gradient-primary bg-clip-text">
                Saafy
              </span>
            </motion.div>
          </div>

          {/* Center Section - Search Bar with Live Results */}
          <motion.div
            ref={searchRef}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 max-w-2xl mx-8 relative"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 z-10 ${isSearchFocused ? 'text-accent-primary' : 'text-text-tertiary'
                }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="What do you want to listen to?"
                onFocus={() => setIsSearchFocused(true)}
                className={`
                  w-full pl-12 pr-12 py-4 bg-surface-primary/50 border border-surface-secondary/30 
                  rounded-2xl text-text-primary placeholder-text-tertiary transition-all duration-250
                  focus:outline-none focus:bg-surface-primary focus:border-accent-primary/50 focus:shadow-glow-sm
                  ${isSearchFocused ? 'shadow-glow-sm' : ''}
                `}
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary hover:text-text-primary transition-colors duration-200 z-10"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -inset-1 bg-gradient-primary rounded-2xl blur opacity-20"
                />
              )}
            </form>

            {/* Live Search Results Dropdown */}
            <AnimatePresence>
              {showResults && isSearchFocused && (searchResults.songs.length > 0 || searchResults.artists.length > 0 || searchResults.playlists.length > 0 || loading) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-surface-primary/95 backdrop-blur-md border border-surface-secondary/30 rounded-2xl shadow-elevated max-h-96 overflow-y-auto scrollbar-hide z-50"
                >
                  {loading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-text-secondary mt-2">Searching...</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {/* Songs Section */}
                      {searchResults.songs.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-text-primary font-semibold text-sm mb-2 px-3">Songs</h3>
                          {searchResults.songs.map((song) => (
                            <motion.div
                              key={song.id}
                              whileHover={{ scale: 1.02, x: 4 }}
                              onClick={() => handleSongPlay(song)}
                              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-surface-secondary/50 cursor-pointer transition-all duration-200 group"
                            >
                              <div className="relative flex-shrink-0">
                                <img
                                  src={getImageUrl(song.image)}
                                  alt={song.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/50x50/6366f1/ffffff?text=Music'
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-text-primary font-medium text-sm truncate">{song.name}</p>
                                <p className="text-text-secondary text-xs truncate">{song.primaryArtists}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Artists Section */}
                      {searchResults.artists.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-text-primary font-semibold text-sm mb-2 px-3">Artists</h3>
                          {searchResults.artists.map((artist) => (
                            <motion.div
                              key={artist.id}
                              whileHover={{ scale: 1.02, x: 4 }}
                              onClick={() => handleResultClick('artist', artist.id)}
                              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-surface-secondary/50 cursor-pointer transition-all duration-200"
                            >
                              <img
                                src={getImageUrl(artist.image)}
                                alt={artist.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/50x50/6366f1/ffffff?text=Artist'
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-text-primary font-medium text-sm truncate">{artist.name}</p>
                                <p className="text-text-secondary text-xs">Artist</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Playlists Section */}
                      {searchResults.playlists.length > 0 && (
                        <div>
                          <h3 className="text-text-primary font-semibold text-sm mb-2 px-3">Playlists</h3>
                          {searchResults.playlists.map((playlist) => (
                            <motion.div
                              key={playlist.id}
                              whileHover={{ scale: 1.02, x: 4 }}
                              onClick={() => handleResultClick('playlist', playlist.id)}
                              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-surface-secondary/50 cursor-pointer transition-all duration-200"
                            >
                              <img
                                src={getImageUrl(playlist.image)}
                                alt={playlist.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/50x50/6366f1/ffffff?text=Playlist'
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-text-primary font-medium text-sm truncate">{playlist.name}</p>
                                <p className="text-text-secondary text-xs">Playlist</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* View All Results */}
                      {searchQuery.trim() && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            setIsSearchFocused(false)
                            setShowResults(false)
                            navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`)
                          }}
                          className="mt-4 p-3 border-t border-surface-secondary/30 text-center cursor-pointer hover:bg-surface-secondary/30 rounded-b-xl transition-all duration-200"
                        >
                          <p className="text-accent-primary font-medium text-sm">
                            View all results for "{searchQuery}"
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Section - Now Playing Mini & Queue */}
          <div className="flex items-center space-x-3">
            {/* Now Playing Mini */}
            <AnimatePresence>
              {currentSong && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  className="flex items-center space-x-3 bg-surface-primary/50 rounded-xl p-2 border border-surface-secondary/30 backdrop-blur-sm"
                >
                  {/* Song Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={getOptimizedImageUrl(currentSong.image?.[0]?.link || currentSong.image?.[1]?.link || currentSong.image?.[2]?.link, 'small')}
                      alt={currentSong.name}
                      className="w-8 h-8 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/32x32/6366f1/ffffff?text=♪'
                      }}
                    />
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="min-w-0 max-w-32">
                    <p className="text-text-primary text-xs font-medium truncate">
                      {currentSong.name}
                    </p>
                    <p className="text-text-tertiary text-xs truncate">
                      {currentSong.primaryArtists}
                    </p>
                  </div>

                  {/* Play/Pause Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    className="w-7 h-7 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm hover:shadow-glow-sm transition-all duration-200"
                  >
                    {isPlaying ? (
                      <Pause className="w-3 h-3 text-white" />
                    ) : (
                      <Play className="w-3 h-3 text-white ml-0.5" />
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Queue Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative cursor-pointer"
              onClick={() => navigate('/app/queue')}
            >
              <div className="w-10 h-10 bg-surface-primary/50 border border-surface-secondary/30 rounded-xl flex items-center justify-center hover:bg-surface-primary transition-all duration-200">
                <ListMusic className="w-5 h-5 text-text-primary" />
              </div>

              {/* Queue Count Badge */}
              {queue.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs font-semibold">
                    {queue.length > 99 ? '99+' : queue.length}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header