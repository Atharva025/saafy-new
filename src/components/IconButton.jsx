import { useTheme } from '@/context/ThemeContext'

export default function IconButton({
  onClick,
  isActive = false,
  title = '',
  ariaLabel = '',
  badge = null,
  children,
  className = '',
  style = {}
}) {
  const { isDark, colors, fonts } = useTheme()

  const defaultStyle = {
    width: 'clamp(36px, 8vw, 40px)',
    height: 'clamp(36px, 8vw, 40px)',
    borderRadius: '50%',
    background: isActive
      ? (isDark ? 'rgba(224, 115, 86, 0.15)' : 'rgba(196, 92, 62, 0.10)')
      : 'transparent',
    backgroundImage: 'none',
    border: isActive
      ? `1px solid ${colors.accent}`
      : `1px solid transparent`,
    boxShadow: isActive ? 'var(--shadow-ske-inset-sm)' : 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive ? colors.accent : colors.ink,
    transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    ...style
  }

  return (
    <button
      onClick={onClick}
      style={defaultStyle}
      className={`icon-button ${className}`}
      title={title}
      aria-label={ariaLabel || title}
      onMouseEnter={(e) => {
        if (!isActive && !style.background) {
          e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
        }
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = defaultStyle.background
        e.currentTarget.style.transform = 'none'
      }}
    >
      {children}
      {badge !== null && badge !== undefined && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          minWidth: '18px',
          height: '18px',
          borderRadius: '10px',
          background: colors.accent,
          color: colors.paper,
          fontSize: '0.65rem',
          fontFamily: fonts.mono,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
        }}>
          {badge}
        </div>
      )}
    </button>
  )
}
