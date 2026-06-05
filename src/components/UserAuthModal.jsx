import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { registerUser, loginUser } from '@/lib/api'
import { encryptedSetItem } from '@/lib/encryption'

export default function UserAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const { isDark, colors, fonts } = useTheme()
  const toast = useToast()
  
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640
  
  const [activeTab, setActiveTab] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailOrUsername, setEmailOrUsername] = useState('')

  if (!isOpen) return null

  const resetForm = () => {
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setEmailOrUsername('')
    setError('')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await loginUser(emailOrUsername, password)
      if (result.success) {
        toast.success(`Welcome back, ${result.user.username}!`)
        encryptedSetItem('saafy_user', result.user)
        onLoginSuccess(result.user)
        resetForm()
        onClose()
      } else {
        setError(result.error || 'Invalid credentials')
        toast.error(result.error || 'Login failed')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
      toast.error('Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await registerUser(username, email, password)
      if (result.success) {
        toast.success('Account created successfully! Signing in...')
        // Auto login on successful register
        const loginResult = await loginUser(username, password)
        if (loginResult.success) {
          encryptedSetItem('saafy_user', loginResult.user)
          onLoginSuccess(loginResult.user)
        }
        resetForm()
        onClose()
      } else {
        setError(result.error || 'Registration failed')
        toast.error(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
      toast.error('Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: isMobileView ? '10px 14px' : '12px 16px',
    borderRadius: '10px',
    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
    fontFamily: fonts.primary,
    fontSize: '0.9rem',
    color: colors.ink,
    outline: 'none',
    transition: 'all 0.2s ease',
  }

  const labelStyle = {
    fontFamily: fonts.mono,
    fontSize: '0.7rem',
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: isMobileView ? '4px' : '6px',
    display: 'block',
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobileView ? '10px' : '20px',
    }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          background: isDark ? 'rgba(20, 16, 15, 0.95)' : 'rgba(255, 254, 252, 0.98)',
          border: `1px solid ${isDark ? 'rgba(224, 115, 86, 0.2)' : 'rgba(196, 92, 62, 0.15)'}`,
          borderRadius: '24px',
          boxShadow: isDark 
            ? '0 24px 80px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 24px 80px rgba(26, 22, 20, 0.15)',
          padding: isMobileView ? '24px 16px' : '32px',
        }}
      >
        {/* Glow ambient effect in modal */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '180px',
          height: '60px',
          background: colors.accent,
          filter: 'blur(45px)',
          opacity: 0.18,
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
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.inkLight}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobileView ? '16px' : '28px' }}>
          <div style={{
            width: isMobileView ? '32px' : '40px',
            height: isMobileView ? '32px' : '40px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: isMobileView ? '0 auto 8px auto' : '0 auto 12px auto',
            boxShadow: `0 4px 12px ${colors.accent}30`,
          }}>
            <svg width={isMobileView ? "14" : "18"} height={isMobileView ? "14" : "18"} viewBox="0 0 24 24" fill="#fff">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h3 style={{
            fontFamily: fonts.display,
            fontSize: isMobileView ? '1.15rem' : '1.4rem',
            fontWeight: 800,
            color: colors.ink,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {activeTab === 'login' ? 'Welcome back to Saafy' : 'Join Saafy Music'}
          </h3>
          <p style={{
            fontFamily: fonts.primary,
            fontSize: isMobileView ? '0.78rem' : '0.82rem',
            color: colors.inkLight,
            marginTop: '4px',
            marginBottom: 0,
          }}>
            {activeTab === 'login' ? 'Your personal premium music experience' : 'Create an account to start your journey'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
        }}>
          <button
            onClick={() => handleTabChange('login')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'login' ? (isDark ? 'rgba(224, 115, 86, 0.15)' : 'rgba(196, 92, 62, 0.1)') : 'transparent',
              color: activeTab === 'login' ? colors.accent : colors.inkMuted,
              fontFamily: fonts.primary,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => handleTabChange('register')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'register' ? (isDark ? 'rgba(224, 115, 86, 0.15)' : 'rgba(196, 92, 62, 0.1)') : 'transparent',
              color: activeTab === 'register' ? colors.accent : colors.inkMuted,
              fontFamily: fonts.primary,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
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

        {/* Forms */}
        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form
              key="login"
              onSubmit={handleLogin}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ marginBottom: isMobileView ? '12px' : '18px' }}>
                <label style={labelStyle}>Username or Email</label>
                <input
                  type="text"
                  placeholder="Enter email or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                />
              </div>

              <div style={{ marginBottom: isMobileView ? '20px' : '28px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#e07356' : '#c45c3e'} 100%)`,
                  color: '#fff',
                  fontFamily: fonts.primary,
                  fontWeight: 650,
                  fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: `0 4px 14px ${colors.accent}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.05)' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.filter = 'none' }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              onSubmit={handleRegister}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ marginBottom: isMobileView ? '10px' : '16px' }}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  placeholder="e.g. music_lover"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                />
              </div>

              <div style={{ marginBottom: isMobileView ? '10px' : '16px' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                />
              </div>

              <div style={{ marginBottom: isMobileView ? '10px' : '16px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                />
              </div>

              <div style={{ marginBottom: isMobileView ? '16px' : '24px' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#e07356' : '#c45c3e'} 100%)`,
                  color: '#fff',
                  fontFamily: fonts.primary,
                  fontWeight: 650,
                  fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: `0 4px 14px ${colors.accent}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.05)' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.filter = 'none' }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
