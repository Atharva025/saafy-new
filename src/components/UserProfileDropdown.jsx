import { useTheme } from '@/context/ThemeContext'
import { LogOut, User } from 'lucide-react'

export default function UserProfileDropdown({
  currentUser,
  showUserDropdown,
  setShowUserDropdown,
  setShowAuthModal,
  handleSignOut,
  dropdownRef,
  isMobile = false,
  iconBtnStyle
}) {
  const { isDark, colors, fonts } = useTheme()

  // Base iconBtnStyle fallback if not provided
  const getButtonStyle = () => {
    if (iconBtnStyle) {
      return iconBtnStyle(showUserDropdown)
    }

    return {
      width: '38px',
      height: '38px',
      borderRadius: '11px',
      background: showUserDropdown
        ? (isDark ? 'rgba(224, 115, 86, 0.22)' : 'rgba(196, 92, 62, 0.12)')
        : 'var(--color-paper-dark)',
      backgroundImage: showUserDropdown ? 'none' : 'var(--background-image-ske-button)',
      border: showUserDropdown
        ? `1.5px solid ${colors.accent}`
        : `1px solid var(--color-border)`,
      boxShadow: showUserDropdown ? 'var(--shadow-ske-inset-sm)' : 'var(--shadow-ske-xs)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: showUserDropdown ? colors.accent : colors.ink,
      transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
    }
  }

  const buttonStyle = isMobile
    ? {
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        overflow: 'hidden',
        border: currentUser
          ? `1.5px solid ${colors.accent}60`
          : `1px solid var(--color-border)`,
        background: currentUser
          ? `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`
          : 'var(--color-paper-dark)',
        cursor: 'pointer',
        boxShadow: currentUser ? `0 2px 8px ${colors.accent}30` : 'none',
        transition: 'all 0.2s ease',
      }
    : {
        ...getButtonStyle(),
        width: 'clamp(36px, 8vw, 40px)',
        height: 'clamp(36px, 8vw, 40px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        overflow: 'hidden',
      }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => {
          if (currentUser) {
            setShowUserDropdown(!showUserDropdown)
          } else {
            setShowAuthModal(true)
          }
        }}
        style={buttonStyle}
        title={currentUser ? `Account: ${currentUser.username}` : "Sign In"}
        aria-label={currentUser ? `Account settings for ${currentUser.username}` : "Sign In"}
      >
        {currentUser ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
            color: '#fff',
            fontWeight: 700,
            fontSize: isMobile ? '0.72rem' : '0.85rem',
            fontFamily: fonts.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            {currentUser.username.substring(0, 2)}
          </div>
        ) : (
          <User size={isMobile ? 16 : 18} style={{ color: isMobile ? colors.inkMuted : undefined }} />
        )}
      </button>

      {currentUser && showUserDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: isMobile ? '200px' : '240px',
          background: isMobile
            ? (isDark ? 'rgba(28, 24, 22, 0.96)' : 'rgba(252, 249, 244, 0.97)')
            : colors.paper,
          backdropFilter: isMobile ? 'blur(20px)' : undefined,
          WebkitBackdropFilter: isMobile ? 'blur(20px)' : undefined,
          borderRadius: isMobile ? '14px' : '12px',
          border: `1px solid ${colors.rule}`,
          boxShadow: isDark
            ? '0 16px 48px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.3)'
            : '0 16px 48px rgba(26,22,20,0.12), 0 8px 20px rgba(26,22,20,0.06)',
          overflow: 'hidden',
          zIndex: isMobile ? 300 : 100,
        }}>
          <div style={{
            padding: isMobile ? '12px 14px' : '14px',
            borderBottom: `1px solid ${colors.rule}`,
          }}>
            <div style={{
              fontFamily: fonts.primary,
              fontSize: isMobile ? '0.82rem' : '0.85rem',
              fontWeight: 700,
              color: colors.ink,
            }}>
              {currentUser.username}
            </div>
            <div style={{
              fontFamily: fonts.primary,
              fontSize: isMobile ? '0.68rem' : '0.72rem',
              color: colors.inkLight,
              wordBreak: 'break-all',
              marginTop: '2px',
            }}>
              {currentUser.email}
            </div>
          </div>
          <div style={{ padding: '6px' }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: isMobile ? '9px 10px' : '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: '#EF4444',
                fontFamily: fonts.primary,
                fontSize: isMobile ? '0.78rem' : '0.8rem',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={isMobile ? 13 : 14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
