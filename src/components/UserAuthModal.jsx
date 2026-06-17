import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { registerUser, loginUser } from '@/lib/api'
import { encryptedSetItem } from '@/lib/encryption'

export default function UserAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const { isDark, colors, fonts, tokens } = useTheme()
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
    padding: '12px 14px',
    borderRadius: tokens?.radius?.md || '10px',
    background: isDark ? colors.paperDarker : colors.paper,
    border: `1px solid ${colors.border}`,
    fontFamily: fonts.primary,
    fontSize: '0.9rem',
    color: colors.ink,
    outline: 'none',
    transition: 'all 150ms ease',
  }

  const labelStyle = {
    fontFamily: fonts.mono,
    fontSize: '0.7rem',
    fontWeight: 600,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
    display: 'block',
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.15, ease: 'easeIn' } }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: tokens?.zIndex?.modal || 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobileView ? '12px' : '24px',
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
          background: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(26, 22, 20, 0.4)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
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
          maxWidth: '400px',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: isDark ? colors.paperDark : colors.paper,
          border: `1px solid ${colors.border}`,
          borderRadius: tokens?.radius?.xl || '18px',
          boxShadow: isDark ? colors.shadowXl : colors.shadowLg,
          padding: isMobileView ? '28px 20px' : '36px',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: colors.inkMuted,
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 150ms, background-color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.ink;
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.inkMuted;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: colors.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: `0 4px 12px ${colors.accent}20`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h3 style={{
            fontFamily: fonts.display,
            fontSize: '1.25rem',
            fontWeight: 700,
            color: colors.ink,
            margin: '0 0 6px 0',
            letterSpacing: '-0.015em',
          }}>
            {activeTab === 'login' ? 'Sign in to Saafy' : 'Create an account'}
          </h3>
          <p style={{
            fontFamily: fonts.primary,
            fontSize: '0.85rem',
            color: colors.inkMuted,
            margin: 0,
          }}>
            {activeTab === 'login' ? 'Enter your details below to log in' : 'Start your premium music experience today'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: isDark ? colors.paperDarker : colors.paperDark,
          borderRadius: tokens?.radius?.md || '10px',
          padding: '4px',
          marginBottom: '24px',
          border: `1px solid ${colors.border}`,
        }}>
          <button
            onClick={() => handleTabChange('login')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'login' ? (isDark ? colors.paperDark : colors.paper) : 'transparent',
              color: activeTab === 'login' ? colors.accent : colors.inkMuted,
              fontFamily: fonts.primary,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'login' ? colors.shadowSm : 'none',
              transition: 'all 150ms ease',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => handleTabChange('register')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'register' ? (isDark ? colors.paperDark : colors.paper) : 'transparent',
              color: activeTab === 'register' ? colors.accent : colors.inkMuted,
              fontFamily: fonts.primary,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'register' ? colors.shadowSm : 'none',
              transition: 'all 150ms ease',
            }}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.16)',
            borderRadius: tokens?.radius?.md || '10px',
            padding: '10px 14px',
            color: '#EF4444',
            fontFamily: fonts.primary,
            fontSize: '0.8rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Forms */}
        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form
              key="login"
              onSubmit={handleLogin}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.15 }}
            >
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Username or Email</label>
                <input
                  type="text"
                  placeholder="Enter email or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.accent;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.accentSubtle}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.accent;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.accentSubtle}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: tokens?.radius?.md || '10px',
                  border: 'none',
                  background: loading ? colors.inkLight : colors.accent,
                  color: '#fff',
                  fontFamily: fonts.primary,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 150ms ease, opacity 150ms ease',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = colors.accentHover }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = colors.accent }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              onSubmit={handleRegister}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
            >
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.accent;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.accentSubtle}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.accent;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.accentSubtle}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.accent;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.accentSubtle}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.accent;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.accentSubtle}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: tokens?.radius?.md || '10px',
                  border: 'none',
                  background: loading ? colors.inkLight : colors.accent,
                  color: '#fff',
                  fontFamily: fonts.primary,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 150ms ease, opacity 150ms ease',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = colors.accentHover }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = colors.accent }}
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
