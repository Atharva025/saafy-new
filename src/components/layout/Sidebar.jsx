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
    <div className={cn(
      "bg-background-secondary/50 backdrop-blur-glass border-r border-surface-primary/30 text-text-primary transition-all duration-300 flex flex-col h-full",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-surface-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow-sm">
            <Music className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col"
            >
              <span className="font-heading font-bold text-lg text-text-primary">Saafy</span>
              <span className="text-xs text-text-tertiary">Music Player</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-2">
        {navItems.map((item, index) => (
          <motion.a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
              "hover:bg-surface-primary/50 group relative overflow-hidden"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-lg bg-surface-primary/50 border border-surface-secondary/30 flex items-center justify-center group-hover:bg-surface-primary transition-all duration-200">
              <item.icon className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors duration-200" />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-200"
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
          className="mx-4 mb-4 space-y-2"
        >
          <div className="p-3 rounded-xl bg-surface-primary/30 border border-surface-secondary/20">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent-primary" />
              <span className="text-sm text-text-primary">High Quality Audio</span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">320kbps streaming</p>
          </div>

          <div className="p-3 rounded-xl bg-surface-primary/30 border border-surface-secondary/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-secondary" />
              <span className="text-sm text-text-primary">Premium Experience</span>
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
          className="mx-4 mb-4 p-3 rounded-xl bg-surface-primary/30 border border-surface-secondary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">App Info</span>
          </div>
          <div className="space-y-1 text-xs text-text-muted">
            <p>Version 2.0.0</p>
            <p>Made with ❤️ for music lovers</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
