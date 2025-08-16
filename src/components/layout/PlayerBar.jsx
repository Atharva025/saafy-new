import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  MoreHorizontal,
  Maximize2,
  Share,
  ListMusic,
  Mic2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '@/context/PlayerContext'
import { formatDuration, getOptimizedImageUrl, truncateText } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function PlayerBar() {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    repeatMode,
    shuffleMode,
    togglePlay,
    skipNext,
    skipPrevious,
    setVolume,
    seekTo,
    toggleRepeat,
    toggleShuffle,
  } = usePlayer()

  const handleProgressChange = (value) => {
    seekTo(value[0])
  }

  const handleVolumeChange = (value) => {
    setVolume(value[0] / 100)
  }

  const toggleLike = () => {
    setIsLiked(!isLiked)
  }

  if (!currentSong) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 h-24 bg-background-primary border-t border-surface-primary px-6 flex items-center justify-center z-40"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center space-x-4 text-text-tertiary"
        >
          <div className="w-16 h-16 bg-surface-primary rounded-2xl flex items-center justify-center">
            <Play className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-heading font-semibold text-text-primary">No song playing</p>
            <p className="text-sm text-text-tertiary">Select a song to start listening</p>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 h-24 bg-background-primary border-t border-surface-primary px-6 z-30"
    >
      <div className="flex items-center justify-between h-full relative z-10">
        {/* Song Info - Ultra Premium Design */}
        <div className="flex items-center space-x-4 flex-1 min-w-0 max-w-sm">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative group cursor-pointer flex-shrink-0"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-primary shadow-elevated">
              <img
                src={getOptimizedImageUrl(currentSong.image?.[2]?.link, 'small')}
                alt={currentSong.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </motion.div>

          <div className="min-w-0 flex-1">
            <motion.h4
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-text-primary font-heading font-semibold text-base truncate mb-1"
            >
              {truncateText(currentSong.name, 35)}
            </motion.h4>
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-text-tertiary text-sm truncate"
            >
              {truncateText(currentSong.primaryArtists, 30)}
            </motion.p>
          </div>

          {/* Song Actions */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleLike}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 group ${isLiked
                ? 'text-accent-danger'
                : 'text-text-tertiary hover:text-accent-danger hover:bg-surface-primary'
                }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>
          </div>
        </div>

        {/* Ultra-Premium Player Controls */}
        <div className="flex flex-col items-center space-y-3 flex-1 max-w-lg">
          {/* Control Buttons */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleShuffle}
              className={`w-8 h-8 rounded-xl hidden sm:flex items-center justify-center transition-all duration-200 ${shuffleMode
                ? "text-accent-primary"
                : "text-text-tertiary hover:text-text-primary"
                }`}
            >
              <Shuffle className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={skipPrevious}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-text-primary hover:bg-surface-primary transition-all duration-200"
            >
              <SkipBack className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              className="w-12 h-12 bg-gradient-primary hover:shadow-glow-md rounded-2xl flex items-center justify-center transition-all duration-200 group"
            >
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Pause className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={skipNext}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-text-primary hover:bg-surface-primary transition-all duration-200"
            >
              <SkipForward className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleRepeat}
              className={`w-8 h-8 rounded-xl hidden sm:flex items-center justify-center transition-all duration-200 relative ${repeatMode !== 'none'
                ? "text-accent-primary"
                : "text-text-tertiary hover:text-text-primary"
                }`}
            >
              <Repeat className="w-4 h-4" />
              {repeatMode === 'one' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-primary rounded-full"></div>
              )}
            </motion.button>
          </div>

          {/* Ultra-Premium Progress Bar */}
          <div className="flex items-center space-x-3 w-full">
            <span className="text-xs text-text-tertiary font-mono min-w-[35px] text-right hidden sm:block">
              {formatDuration(progress)}
            </span>

            <div className="flex-1 relative group">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={1}
                onValueChange={handleProgressChange}
                className="w-full cursor-pointer [&>span:first-child]:h-1 [&>span:first-child]:bg-surface-secondary [&>span:first-child]:rounded-full [&_[role=slider]]:bg-gradient-primary [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-glow-sm [&_[role=slider]]:opacity-0 [&_[role=slider]]:group-hover:opacity-100 [&>span:first-child>span]:bg-gradient-primary [&>span:first-child>span]:h-1 [&>span:first-child>span]:rounded-full hover:[&>span:first-child]:h-1.5 [&>span:first-child]:transition-all [&>span:first-child]:duration-200"
              />
            </div>

            <span className="text-xs text-text-tertiary font-mono min-w-[35px] hidden sm:block">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Premium Volume & Additional Controls */}
        <div className="flex items-center space-x-3 flex-1 justify-end max-w-sm">
          {/* Queue */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl hidden lg:flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-primary transition-all duration-200"
          >
            <ListMusic className="w-4 h-4" />
          </motion.button>

          {/* Lyrics */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl hidden md:flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-primary transition-all duration-200"
          >
            <Mic2 className="w-4 h-4" />
          </motion.button>

          {/* Ultra-Premium Volume Control */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-primary transition-all duration-200"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 80 }}
                  exit={{ opacity: 0, width: 0 }}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="overflow-hidden hidden md:block"
                >
                  <Slider
                    value={[volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-surface-secondary [&>span:first-child]:rounded-full [&_[role=slider]]:bg-gradient-primary [&_[role=slider]]:w-2.5 [&_[role=slider]]:h-2.5 [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-glow-sm [&>span:first-child>span]:bg-gradient-primary [&>span:first-child>span]:h-1 [&>span:first-child>span]:rounded-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* More Options */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl hidden sm:flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-primary transition-all duration-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>

          {/* Expand Player */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-xl hidden lg:flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-primary transition-all duration-200"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
