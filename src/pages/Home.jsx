import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SongCard from '@/components/music/SongCard'
import AlbumCard from '@/components/music/AlbumCard'
import ArtistCard from '@/components/music/ArtistCard'
import PlaylistCard from '@/components/music/PlaylistCard'
import NewReleases from '@/components/music/NewReleases'
import RenderingSongs from '@/components/music/RenderingSongs'
import { getTrendingSongs, getFeaturedPlaylists, getPopularIndianArtists } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Music,
  Crown,
  Headphones,
  Radio,
  Play,
  Clock,
  Heart
} from 'lucide-react'

export default function Home() {
  const [trendingSongs, setTrendingSongs] = useState([])
  const [featuredPlaylists, setFeaturedPlaylists] = useState([])
  const [popularArtists, setPopularArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(null)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [showArtistSongs, setShowArtistSongs] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Fetching home page data...')
        const [songsData, playlistsData, artistsData] = await Promise.allSettled([
          getTrendingSongs(),
          getFeaturedPlaylists(),
          getPopularIndianArtists()
        ])

        if (songsData.status === 'fulfilled') {
          const songs = songsData.value.data?.results || []
          console.log('Trending songs loaded:', songs.length, songs)
          console.log('First song details:', songs[0])
          setTrendingSongs(songs)
        } else {
          console.error('Failed to fetch trending songs:', songsData.reason)
        }

        if (playlistsData.status === 'fulfilled') {
          const playlists = playlistsData.value.data?.results || []
          console.log('Featured playlists loaded:', playlists.length, playlists)
          setFeaturedPlaylists(playlists)
        } else {
          console.error('Failed to fetch featured playlists:', playlistsData.reason)
        }
        if (artistsData.status === 'fulfilled') {
          setPopularArtists(artistsData.value.data?.results || [])
        }
      } catch (error) {
        console.error('Error fetching home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleArtistClick = (artist) => {
    setSelectedArtist(artist)
    setShowArtistSongs(true)
  }

  const handleBackToHome = () => {
    setShowArtistSongs(false)
    setSelectedArtist(null)
  }

  // If showing artist songs, render the RenderingSongs component
  if (showArtistSongs && selectedArtist) {
    return <RenderingSongs artist={selectedArtist} onBack={handleBackToHome} />
  }

  const SectionHeader = ({ title, icon: Icon, onViewAll, gradient = 'gradient-primary', delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-center justify-between mb-8"
    >
      <div className="flex items-center space-x-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`w-12 h-12 bg-${gradient} rounded-2xl flex items-center justify-center shadow-glow-md`}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
        <h2 className="text-3xl font-heading font-bold text-text-primary">{title}</h2>
      </div>
      {onViewAll && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onViewAll}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors duration-200 group"
        >
          <span className="font-medium">View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </motion.button>
      )}
    </motion.div>
  )

  const QuickActionCard = ({ icon: Icon, title, description, gradient, onClick, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative overflow-hidden bg-surface-primary/50 backdrop-blur-md border border-surface-secondary/30 rounded-2xl p-6 cursor-pointer hover:shadow-elevated transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10">
        <div className={`w-14 h-14 bg-${gradient} rounded-2xl flex items-center justify-center mb-4 shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-primary rounded-full blur opacity-20"></div>
      <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-secondary rounded-full blur opacity-15"></div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto pt-24 pb-32">
        <div className="max-w-7xl mx-auto p-6">
          <div className="space-y-12">
            {/* Premium Loading Skeletons */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-surface-primary rounded-2xl animate-pulse"></div>
                  <div className="h-8 bg-surface-primary rounded-xl w-64 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="bg-surface-primary/50 rounded-2xl h-20 animate-pulse"></div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pt-24 pb-32 scrollbar-hide">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="relative overflow-hidden bg-gradient-glass backdrop-blur-md border border-surface-primary/30 rounded-3xl p-8">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary rounded-full blur-3xl opacity-10 animate-float"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-secondary rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10">
              <h1 className="text-5xl font-heading font-bold text-text-primary mb-4 leading-tight">
                Welcome back to <span className="text-white font-bold">Saafy</span>
              </h1>
              <p className="text-xl text-text-secondary mb-8 leading-relaxed max-w-2xl">
                Discover new music, revisit old favorites, and enjoy your listening experience.
              </p>


            </div>
          </div>
        </motion.section>

        {/* Quick Actions Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-16"
        >
          <SectionHeader
            title="Quick Actions"
            icon={Sparkles}
            gradient="gradient-secondary"
            delay={0.3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              icon={Music}
              title="Daily Mix"
              description="Your personal mix updated daily with your favorite vibes"
              gradient="gradient-primary"
              onClick={() => navigate('/daily-mix')}
              delay={0.4}
            />

            <QuickActionCard
              icon={Sparkles}
              title="Discover Weekly"
              description="New music discoveries picked just for your taste"
              gradient="gradient-secondary"
              onClick={() => navigate('/discover')}
              delay={0.5}
            />

            <QuickActionCard
              icon={Radio}
              title="Radio Stations"
              description="Enjoy curated radio based on your mood and genre"
              gradient="gradient-primary"
              onClick={() => navigate('/radio')}
              delay={0.6}
            />

            <QuickActionCard
              icon={Clock}
              title="Recently Played"
              description="Continue where you left off with recent tracks"
              gradient="gradient-secondary"
              onClick={() => navigate('/recent')}
              delay={0.7}
            />
          </div>
        </motion.section>

        {/* Hero New Releases */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-16"
        >
          <SectionHeader
            title="New Releases"
            icon={TrendingUp}
            gradient="gradient-primary"
            delay={0.5}
          />
          <NewReleases />
        </motion.section>

        {/* Trending Songs */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mb-16"
        >
          <SectionHeader
            title="Trending Now"
            icon={TrendingUp}
            gradient="gradient-secondary"
            onViewAll={() => navigate('/app')}
            delay={0.7}
          />

          <motion.div
            className="space-y-2"
            onMouseEnter={() => setActiveSection('trending')}
            onMouseLeave={() => setActiveSection(null)}
          >
            {trendingSongs.length > 0 ? (
              trendingSongs.slice(0, 8).map((song, index) => {
                // Get the best quality image URL
                const getImageUrl = (imageArray) => {
                  if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
                    return 'https://via.placeholder.com/150x150/6366f1/ffffff?text=Music'
                  }

                  const highQualityImage = imageArray.find(img => img.quality === '500x500') ||
                    imageArray.find(img => img.quality === '150x150') ||
                    imageArray[imageArray.length - 1] ||
                    imageArray[0]

                  return highQualityImage?.url || highQualityImage?.link || 'https://via.placeholder.com/150x150/6366f1/ffffff?text=Music'
                }

                return (
                  <motion.div
                    key={song.id || `trending-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05, duration: 0.5 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    className="transform transition-all duration-200"
                  >
                    <SongCard
                      song={song}
                      showIndex={true}
                      index={index}
                      image={getImageUrl(song.image)}
                    />
                  </motion.div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
                  {loading ? 'Loading Trending Songs...' : 'No Trending Songs'}
                </h3>
                <p className="text-text-tertiary">
                  {loading ? 'Fetching the latest hits for you' : 'Check back later for trending music'}
                </p>
              </div>
            )}
          </motion.div>
        </motion.section>



        {/* Popular Artists */}
        {popularArtists.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mb-16"
          >
            <SectionHeader
              title="Popular Indian Artists"
              icon={Users}
              gradient="gradient-secondary"
              onViewAll={() => navigate('/search')}
              delay={1.1}
            />

            <div className="flex overflow-x-auto space-x-6 pb-6 scrollbar-hide">
              {popularArtists.slice(0, 10).map((artist, index) => (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + index * 0.05, duration: 0.5 }}
                  whileHover={{ scale: 1.1, y: -8 }}
                  className="flex-shrink-0 w-48"
                >
                  <ArtistCard
                    artist={artist}
                    onClick={handleArtistClick}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
