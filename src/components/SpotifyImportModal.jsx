import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { X, Loader2, Link2, Info } from 'lucide-react'

export default function SpotifyImportModal({ isOpen, onClose, currentUser, importSpotifyPlaylist, onSuccess }) {
  const { isDark, colors, fonts } = useTheme()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Listen to Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const validateSpotifyUrl = (input) => {
    const regex = /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/
    return regex.test(input.trim())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim() || !currentUser) return

    const sanitizedUrl = url.trim()
    if (!validateSpotifyUrl(sanitizedUrl)) {
      setError('Please enter a valid Spotify Playlist URL (e.g., https://open.spotify.com/playlist/...)')
      return
    }

    setIsLoading(true)
    setError('')

    const userId = currentUser.id || currentUser._id
    try {
      const result = await importSpotifyPlaylist(userId, sanitizedUrl)
      if (result.success) {
        onSuccess(result.playlist.name)
        setUrl('')
        onClose()
      } else {
        setError(result.error || 'Failed to import Spotify playlist. Please make sure the playlist is public.')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred during the import process.')
    } finally {
      setIsLoading(false)
    }
  }

  const labelStyle = {
    fontFamily: fonts.mono,
    fontSize: '0.7rem',
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
    display: 'block',
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 42px', // extra left padding for icon
    borderRadius: '10px',
    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
    fontFamily: fonts.primary,
    fontSize: '0.9rem',
    color: colors.ink,
    outline: 'none',
    transition: 'all 0.2s ease',
  }

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: '#1DB954', // Spotify brand green
    color: '#fff',
    fontFamily: fonts.primary,
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: (!url.trim() || isLoading) ? 0.6 : 1,
    boxShadow: '0 4px 14px rgba(29, 185, 84, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Backdrop with full background blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark ? 'rgba(10, 8, 8, 0.75)' : 'rgba(26, 22, 20, 0.45)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          background: isDark ? 'rgba(26, 22, 20, 0.88)' : 'rgba(255, 254, 252, 0.92)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          borderRadius: '24px',
          boxShadow: isDark 
            ? '0 24px 80px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 24px 80px rgba(26, 22, 20, 0.15)',
          overflow: 'hidden',
          padding: '32px',
        }}
      >
        {/* Glow ambient background accent (Spotify Green) */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '60px',
          background: '#1DB954',
          filter: 'blur(50px)',
          opacity: isDark ? 0.18 : 0.09,
          pointerEvents: 'none',
        }} />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: colors.inkLight,
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#1DB954'}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.inkLight}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(29, 185, 84, 0.1)',
            border: '1px solid rgba(29, 185, 84, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.893-1.026-.33.076-.662-.133-.738-.463-.077-.33.133-.662.463-.738 3.856-.88 7.15-.5 9.818 1.137.295.18.387.563.207.857zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.075-1.183-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.66-1.11 8.23-.57 11.345 1.342.367.227.487.708.26 1.076zm.105-2.81c-3.26-1.937-8.643-2.12-11.758-1.173-.5.15-1.02-.133-1.173-.633-.15-.5.133-1.02.633-1.173 3.616-1.1 9.54-.892 13.29 1.336.45.268.6.845.33 1.296-.268.45-.846.6-1.296.33z"/>
            </svg>
          </div>
          <div>
            <h3 style={{
              fontFamily: fonts.display,
              fontSize: '1.4rem',
              fontWeight: 800,
              color: colors.ink,
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Import Spotify Playlist
            </h3>
            <p style={{
              fontFamily: fonts.primary,
              fontSize: '0.82rem',
              color: colors.inkMuted,
              marginTop: '2px',
              marginBottom: 0,
            }}>
              Transfer your curated Spotify collections directly to Saafy.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#EF4444',
            fontFamily: fonts.primary,
            fontSize: '0.8rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Input block */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={labelStyle}>Spotify Playlist URL *</label>
            <div style={{ position: 'relative' }}>
              <Link2 size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.inkLight,
              }} />
              <input
                type="text"
                placeholder="https://open.spotify.com/playlist/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#1DB954'}
                onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Guide Card */}
          <div style={{
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            border: `1px solid ${colors.rule}`,
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '28px',
            display: 'flex',
            gap: '12px',
          }}>
            <Info size={16} style={{ color: '#1DB954', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontFamily: fonts.primary, fontSize: '0.78rem', color: colors.inkMuted, lineHeight: '1.45' }}>
              <strong style={{ color: colors.ink, display: 'block', marginBottom: '4px' }}>How it works:</strong>
              We request the track titles, artists, and albums from the Spotify API, and securely map them to our system. Because Spotify does not support exporting audio directly, this allows us to safely stream corresponding audio files from the Saafy catalog without any legal issues.
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: `1px solid ${colors.rule}`,
            paddingTop: '20px',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
                background: 'transparent',
                color: colors.inkMuted,
                fontFamily: fonts.primary,
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
              onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = 'transparent' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              style={buttonStyle}
              onMouseEnter={(e) => { if (url.trim() && !isLoading) e.currentTarget.style.filter = 'brightness(1.05)' }}
              onMouseLeave={(e) => { if (url.trim() && !isLoading) e.currentTarget.style.filter = 'none' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Playlist'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
