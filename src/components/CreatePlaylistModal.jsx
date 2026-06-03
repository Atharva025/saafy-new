import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { compressImage } from '@/utils/image'
import { X, ImagePlus, Loader2 } from 'lucide-react'

export default function CreatePlaylistModal({ isOpen, onClose, currentUser, createPlaylist, onSuccess }) {
  const { isDark, colors, fonts } = useTheme()
  const [name, setName] = useState('')
  const [image, setImage] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef(null)

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

  const handleImageFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    try {
      const compressed = await compressImage(file)
      setImage(compressed)
      setError('')
    } catch (err) {
      console.error('Failed to compress image:', err)
      setError('Failed to process cover image.')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !currentUser) return

    setIsLoading(true)
    setError('')

    const userId = currentUser.id || currentUser._id
    try {
      const playlist = await createPlaylist(userId, name.trim(), image)
      if (playlist) {
        onSuccess(name.trim())
        setName('')
        setImage(null)
        onClose()
      } else {
        setError('Failed to create playlist. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred.')
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
    padding: '12px 16px',
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
    background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#e07356' : '#c45c3e'} 100%)`,
    color: '#fff',
    fontFamily: fonts.primary,
    fontWeight: 650,
    fontSize: '0.9rem',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: (!name.trim() || isLoading) ? 0.6 : 1,
    boxShadow: `0 4px 14px ${colors.accent}25`,
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
          maxWidth: '520px',
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
        {/* Glow ambient background accent */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '180px',
          height: '60px',
          background: colors.accent,
          filter: 'blur(45px)',
          opacity: isDark ? 0.16 : 0.08,
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
          onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.inkLight}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontFamily: fonts.display,
            fontSize: '1.4rem',
            fontWeight: 800,
            color: colors.ink,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Create Playlist
          </h3>
          <p style={{
            fontFamily: fonts.primary,
            fontSize: '0.82rem',
            color: colors.inkMuted,
            marginTop: '4px',
            marginBottom: 0,
          }}>
            Design a custom playlist to group your favorite songs together.
          </p>
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
          {/* Main content row */}
          <div style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'flex-start',
            marginBottom: '28px',
            flexWrap: 'wrap',
          }}>
            {/* Left Column: Cover Image Upload */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '140px',
              margin: '0 auto',
              flexShrink: 0,
            }}>
              <label style={{ ...labelStyle, alignSelf: 'flex-start' }}>Playlist Cover</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageFile(file);
                }}
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '16px',
                  border: `2px dashed ${isDragging ? colors.accent : (image ? 'transparent' : colors.rule)}`,
                  background: isDark 
                    ? (isDragging ? 'rgba(224, 115, 86, 0.08)' : 'rgba(255, 255, 255, 0.02)') 
                    : (isDragging ? 'rgba(196, 92, 62, 0.05)' : 'rgba(0, 0, 0, 0.01)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={() => image && setIsHoveringImage(true)}
                onMouseLeave={() => image && setIsHoveringImage(false)}
              >
                {image ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img src={image} alt="Playlist Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isHoveringImage && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.65)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontFamily: fonts.mono,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        gap: '6px',
                        backdropFilter: 'blur(2px)',
                      }}>
                        <ImagePlus size={16} />
                        Change Cover
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.inkLight,
                    textAlign: 'center',
                    padding: '12px',
                  }}>
                    <ImagePlus size={24} style={{ marginBottom: '8px', color: isDragging ? colors.accent : colors.inkLight }} />
                    <span style={{ fontFamily: fonts.primary, fontSize: '0.75rem', fontWeight: 500 }}>
                      {isDragging ? 'Drop Image' : 'Upload Cover'}
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Right Column: Name Input */}
            <div style={{
              flex: '1 1 240px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignSelf: 'stretch',
              paddingTop: '6px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Playlist Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chill Beats / Midnight Driving"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
                  maxLength={50}
                  required
                  autoFocus
                />
              </div>
              <p style={{
                fontFamily: fonts.primary,
                fontSize: '0.72rem',
                color: colors.inkLight,
                marginTop: '10px',
                lineHeight: '1.4',
              }}>
                Playlist covers are compressed locally in the browser to maintain fast page transitions and database storage efficiency.
              </p>
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
              disabled={!name.trim() || isLoading}
              style={buttonStyle}
              onMouseEnter={(e) => { if (name.trim() && !isLoading) e.currentTarget.style.filter = 'brightness(1.05)' }}
              onMouseLeave={(e) => { if (name.trim() && !isLoading) e.currentTarget.style.filter = 'none' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Playlist'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
