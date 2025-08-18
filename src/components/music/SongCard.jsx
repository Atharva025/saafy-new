import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Heart, MoreHorizontal, Download, ExternalLink, Music, Headphones } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePlayer } from '@/context/PlayerContext'
import { getOptimizedImageUrl, truncateText, cleanText } from '@/lib/utils'

export default function SongCard({ song, showIndex = false, index, variant = 'default', image }) {
  const { playSong, currentSong, isPlaying, playQueue } = usePlayer()
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isCurrentSong = currentSong?.id === song.id

  // Enhanced image handling with multiple fallbacks
  const getDisplayImage = () => {
    // Use provided image prop first
    if (typeof image === 'string' && image) return image

    // Then try song's image array with preference for higher quality
    if (song.image && Array.isArray(song.image)) {
      // Prefer higher quality images (usually larger indices)
      const validImage = song.image.find(img => img?.link || img?.url) ||
        song.image.find(img => typeof img === 'string' && img)

      if (validImage) {
        return validImage.link || validImage.url || validImage
      }
    }

    // Fallback to other possible image fields
    return song.imageUrl || song.image || null
  }

  const displayImage = getDisplayImage()

  const handlePlay = () => {
    console.log('🎵 SongCard handlePlay called for song:', song.name, 'ID:', song.id)
    console.log('🎵 Song object:', song)
    console.log('🎵 Song download_url:', song.download_url)
    console.log('🎵 Song downloadUrl:', song.downloadUrl)
    console.log('🎵 All song fields:', Object.keys(song))

    // Pass the current song and create a queue starting from this song if we're in a list
    if (variant === 'list' && typeof index === 'number') {
      // This assumes we're in a list context where we want to play from this song onwards
      playSong(song)
    } else {
      playSong(song)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const toggleLike = () => {
    setIsLiked(!isLiked)
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    hover: {
      scale: 1.01,
      y: -2,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  }

  const playButtonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Card className={`
        relative overflow-hidden border cursor-pointer transition-all duration-300
        ${isCurrentSong
          ? 'bg-surface-primary border-accent-primary/30 shadow-glow-sm'
          : 'bg-surface-primary/30 border-surface-secondary/20 hover:bg-surface-primary/50 hover:border-surface-secondary/40'
        }
      `}>
        {/* Premium Gradient Background on Hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-glass"
        />

        <div className="relative p-3 sm:p-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Premium Index/Play Button */}
            <div className="w-8 sm:w-12 flex-shrink-0 flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                {showIndex && !isCurrentSong && !isHovered ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-text-tertiary text-sm sm:text-lg font-mono font-semibold"
                  >
                    {(index + 1).toString().padStart(2, '0')}
                  </motion.span>
                ) : (
                  <motion.div
                    variants={playButtonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handlePlay}
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 shadow-elevated
                        ${isCurrentSong
                          ? 'bg-gradient-primary text-white shadow-glow-md'
                          : 'bg-surface-secondary/50 text-text-primary hover:bg-surface-secondary'
                        }
                      `}
                    >
                      <AnimatePresence mode="wait">
                        {isCurrentSong && isPlaying ? (
                          <motion.div
                            key="pause"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                          >
                            <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="play"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                          >
                            <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Ultra-Premium Song Image */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden bg-surface-secondary/50 flex-shrink-0 shadow-elevated">
                {displayImage && !imageError ? (
                  <img
                    src={getOptimizedImageUrl(displayImage, 'small')}
                    alt={song.name || 'Song cover'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={handleImageError}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-tertiary bg-gradient-to-br from-surface-secondary/30 to-surface-secondary/60">
                    <Music className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                )}
              </div>
              {isCurrentSong && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -inset-0.5 bg-gradient-primary rounded-lg sm:rounded-xl blur opacity-50"
                />
              )}
            </motion.div>

            {/* Song Info with Premium Typography */}
            <div className="flex-1 min-w-0">
              <motion.h3
                className={`
                  font-heading font-semibold text-sm sm:text-base truncate mb-1 transition-colors duration-200
                  ${isCurrentSong
                    ? 'text-accent-primary'
                    : 'text-text-primary group-hover:text-accent-primary'
                  }
                `}
              >
                {cleanText(song.name)}
              </motion.h3>
              <p className="text-text-secondary text-xs sm:text-sm truncate">
                {cleanText(song.primaryArtists)}
              </p>

              {/* Premium Quality Badges - Hidden on very small screens */}
              <div className="hidden xs:flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2">
                {song.download_url && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-gradient-primary/10 border border-accent-primary/20 rounded-md sm:rounded-lg text-xs text-accent-primary font-medium flex items-center space-x-1">
                    <Headphones className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">HQ</span>
                  </span>
                )}
                <span className="px-1.5 sm:px-2 py-0.5 bg-accent-secondary/10 border border-accent-secondary/20 rounded-md sm:rounded-lg text-xs text-accent-secondary font-medium">
                  <span className="hidden sm:inline">320kbps</span>
                  <span className="sm:hidden">HQ</span>
                </span>
                {song.hasLyrics && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-400 font-medium">
                    LYRICS
                  </span>
                )}
              </div>
            </div>

            {/* Album Info - Hidden on tablets and smaller */}
            {song.album?.name && (
              <div className="hidden xl:block flex-1 min-w-0">
                <p className="text-text-secondary text-sm truncate">
                  {cleanText(song.album.name)}
                </p>
                <p className="text-text-tertiary text-xs uppercase tracking-wider">
                  Album
                </p>
              </div>
            )}

            {/* Duration with Premium Styling */}
            <div className="text-text-tertiary text-xs sm:text-sm font-mono flex-shrink-0 min-w-[40px] sm:min-w-[50px] text-right">
              {song.duration ? formatDuration(song.duration) : '--:--'}
            </div>

            {/* Ultra-Premium Action Buttons - Progressive visibility */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
              transition={{ duration: 0.2 }}
              className="hidden sm:flex items-center space-x-1"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleLike}
                className={`
                  w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200
                  ${isLiked
                    ? 'text-accent-danger bg-accent-danger/10'
                    : 'text-text-tertiary hover:text-accent-danger hover:bg-surface-secondary/50'
                  }
                `}
              >
                <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="hidden md:flex w-8 h-8 rounded-xl items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 transition-all duration-200"
              >
                <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.button>
            </motion.div>
          </div>

          {/* Premium Playing Indicator */}
          <AnimatePresence>
            {isCurrentSong && isPlaying && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary rounded-b-lg origin-left"
              >
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-primary rounded-b-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}

function formatDuration(seconds) {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
