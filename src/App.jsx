import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PlayerProvider } from '@/context/PlayerContext'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PlayerBar from '@/components/layout/PlayerBar'
import Home from '@/pages/Home'
import Search from '@/pages/Search'
import Library from '@/pages/Library'
import NewReleasesPage from '@/pages/NewReleases'
import QueuePage from '@/pages/Queue'
import AlbumDetails from '@/pages/AlbumDetails'
import ArtistDetails from '@/pages/ArtistDetails'
import PlaylistDetails from '@/pages/PlaylistDetails'

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Start collapsed by default

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setSidebarCollapsed(false)
      } else {
        setSidebarCollapsed(true)
      }
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleNavigate = (path) => {
    navigate(path)
  }

  return (
    <div className="h-screen overflow-hidden relative bg-background-primary">
      {/* Ultra-Modern Background */}
      <div className="absolute inset-0">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/6 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5
            }}
            className="absolute top-3/4 right-1/6 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 10
            }}
            className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-accent-warning/8 rounded-full blur-3xl"
          />
        </div>

        {/* Premium Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background-primary via-background-secondary/50 to-background-primary"></div>
      </div>

      {/* Main App Container */}
      <div className="relative h-full flex flex-col">
        {/* Premium Header */}
        <Header onSearch={handleSearch} />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden pt-20 pb-24">
          {/* Glassmorphic Sidebar */}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="hidden md:block"
              >
                <Sidebar
                  currentPage={location.pathname}
                  onNavigate={handleNavigate}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-40 md:hidden"
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarCollapsed(true)}
                  className="absolute inset-0 bg-background-primary/80 backdrop-blur-sm"
                />
                {/* Sidebar */}
                <div className="relative">
                  <Sidebar
                    currentPage={location.pathname}
                    onNavigate={(path) => {
                      handleNavigate(path)
                      setSidebarCollapsed(true)
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Page Content */}
          <main className="flex-1 overflow-auto scrollbar-hide relative">
            {/* Page Transition Container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full"
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/new-releases" element={<NewReleasesPage />} />
                  <Route path="/queue" element={<QueuePage />} />
                  <Route path="/album/:id" element={<AlbumDetails />} />
                  <Route path="/artist/:id" element={<ArtistDetails />} />
                  <Route path="/playlist/:id" element={<PlaylistDetails />} />
                  {/* Add more routes as needed */}
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Premium Player Bar */}
        <PlayerBar />
      </div>

      {/* Sidebar Toggle for Mobile */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 bg-surface-primary/80 backdrop-blur-md border border-surface-secondary/30 rounded-xl flex items-center justify-center text-text-primary shadow-elevated"
      >
        <motion.div
          animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          ☰
        </motion.div>
      </motion.button>
    </div>
  )
}

export default function App() {
  return (
    <PlayerProvider>
      <Router>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AppLayout />
        </motion.div>
      </Router>
    </PlayerProvider>
  )
}
