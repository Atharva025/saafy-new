import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '@/context/PlayerContext'
import {
  Home,
  TrendingUp,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Heart,
  Crown,
  Sparkles,
  Clock,
  Headphones,
  ListMusic,
  Info,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    playPrevious,
    playNext,
    queue,
    volume
  } = usePlayer()

  const navItems = [
    { icon: Home, label: 'Home', href: '/app' },
    { icon: TrendingUp, label: 'New Releases', href: '/app/new-releases' }
  ]

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isMobileOpen ? 0 : -280,
        }}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-full",
          "bg-black/90 lg:bg-background-secondary/50 backdrop-blur-md lg:backdrop-blur-glass",
          "border-r border-white/10 lg:border-surface-primary/30 text-text-primary",
          "transition-all duration-300 flex flex-col",
          "w-64 sm:w-72 lg:w-64",
          isCollapsed && "lg:w-16"
        )}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-white/10 lg:border-surface-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center shadow-glow-sm">
                <Music className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col"
                >
                  <span className="font-heading font-bold text-base sm:text-lg text-text-primary">Saafy</span>
                  <span className="text-xs text-text-tertiary">Music Player</span>
                </motion.div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-3 sm:p-4 space-y-1 sm:space-y-2">
          {navItems.map((item, index) => (
            <motion.a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200",
                "hover:bg-white/10 lg:hover:bg-surface-primary/50 group relative overflow-hidden"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsMobileOpen(false)}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white/10 lg:bg-surface-primary/50 border border-white/20 lg:border-surface-secondary/30 flex items-center justify-center group-hover:bg-white/20 lg:group-hover:bg-surface-primary transition-all duration-200">
                <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-secondary group-hover:text-text-primary transition-colors duration-200" />
              </div>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="font-medium text-sm sm:text-base text-text-secondary group-hover:text-text-primary transition-colors duration-200"
                >
                  {item.label}
                </motion.span>
              )}
            </motion.a>
          ))}
        </div>

        {/* Feature Cards */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-3 sm:mx-4 mb-3 sm:mb-4 space-y-2"
          >
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/10 lg:bg-surface-primary/30 border border-white/20 lg:border-surface-secondary/20">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-primary" />
                <span className="text-xs sm:text-sm text-text-primary">High Quality Audio</span>
              </div>
              <p className="text-xs text-text-tertiary mt-1">320kbps streaming</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/10 lg:bg-surface-primary/30 border border-white/20 lg:border-surface-secondary/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-secondary" />
                <span className="text-xs sm:text-sm text-text-primary">Premium Experience</span>
              </div>
              <p className="text-xs text-text-tertiary mt-1">Ad-free listening</p>
            </div>
          </motion.div>
        )}

        {/* App Info */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-3 sm:mx-4 mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/10 lg:bg-surface-primary/30 border border-white/20 lg:border-surface-secondary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-tertiary" />
              <span className="text-xs sm:text-sm text-text-secondary">App Info</span>
            </div>
            <div className="space-y-1 text-xs text-text-muted">
              <p>Version 2.0.0</p>
              <p>Made with ❤️ for music lovers</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden w-10 h-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center"
      >
        <Music className="w-5 h-5 text-white" />
      </button>
    </>
  )
}
