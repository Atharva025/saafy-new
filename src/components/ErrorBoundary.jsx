import { Component } from 'react'

// HOC to inject theme context into class component
const withTheme = (WrappedComponent) => {
    return (props) => {
        // Access theme from localStorage or use default
        const isDark = localStorage.getItem('theme') === 'dark'
        const colors = isDark ? {
            paper: '#1A1614',
            paperDark: '#0F0E0D',
            paperDarker: '#0A0908',
            ink: '#FAF7F2',
            inkLight: '#9C948B',
            inkMuted: '#6B635B',
            accent: '#C45C3E',
            rule: '#2A2522',
        } : {
            paper: '#FAF7F2',
            paperDark: '#E5DFD7',
            paperDarker: '#D4CCC1',
            ink: '#1A1614',
            inkLight: '#6B635B',
            inkMuted: '#9C948B',
            accent: '#C45C3E',
            rule: '#E5DFD7',
        }
        const fonts = {
            display: "'Syne', system-ui, sans-serif",
            primary: "'Sora', system-ui, sans-serif",
            mono: "'Space Grotesk', 'Courier New', monospace",
        }
        return <WrappedComponent {...props} colors={colors} fonts={fonts} isDark={isDark} />
    }
}

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            const { colors, fonts, isDark } = this.props

            return (
                <div style={{
                    minHeight: '100vh',
                    background: colors.paper,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'clamp(20px, 5vw, 32px)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Animated Background Pattern */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.04,
                        background: `radial-gradient(circle at 20% 50%, ${colors.accent} 0%, transparent 50%),
                                   radial-gradient(circle at 80% 50%, ${colors.accent} 0%, transparent 50%)`,
                        animation: 'pulse 6s ease-in-out infinite',
                    }} />

                    {/* Floating orbs */}
                    <div style={{
                        position: 'absolute',
                        top: '20%',
                        left: '10%',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${colors.accent}15, transparent)`,
                        animation: 'float 8s ease-in-out infinite',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '10%',
                        width: '160px',
                        height: '160px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${colors.accent}10, transparent)`,
                        animation: 'float 10s ease-in-out infinite 2s',
                    }} />

                    {/* Error Card */}
                    <div style={{
                        maxWidth: '520px',
                        width: '100%',
                        background: colors.paper,
                        border: `1px solid ${colors.rule}`,
                        borderRadius: 'clamp(16px, 4vw, 24px)',
                        padding: 'clamp(32px, 6vw, 48px)',
                        boxShadow: isDark
                            ? '0 20px 60px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)'
                            : '0 20px 60px rgba(26,22,20,0.15), 0 8px 24px rgba(26,22,20,0.08)',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1,
                        animation: 'slideUp 0.6s ease-out',
                    }}>
                        {/* Error Icon */}
                        <div style={{
                            width: 'clamp(64px, 15vw, 80px)',
                            height: 'clamp(64px, 15vw, 80px)',
                            margin: '0 auto 24px',
                            background: `linear-gradient(135deg, ${colors.accent}25, ${colors.accent}10)`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            animation: 'iconBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: '-8px',
                                borderRadius: '50%',
                                border: `2px solid ${colors.accent}20`,
                                animation: 'ripple 2s ease-out infinite',
                            }} />
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h1 style={{
                            fontFamily: fonts.display,
                            fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
                            fontWeight: 800,
                            color: colors.ink,
                            marginBottom: '12px',
                            letterSpacing: '-0.02em',
                        }}>
                            Oops! Something Broke
                        </h1>

                        {/* Description */}
                        <p style={{
                            fontFamily: fonts.primary,
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            color: colors.inkLight,
                            marginBottom: '8px',
                            lineHeight: 1.6,
                        }}>
                            An unexpected error occurred while playing your music.
                        </p>
                        <p style={{
                            fontFamily: fonts.mono,
                            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                            color: colors.inkMuted,
                            marginBottom: '32px',
                            lineHeight: 1.5,
                        }}>
                            Don't worry, your vibes are safe. Let's get you back on track.
                        </p>

                        {/* Error Details (Collapsed) */}
                        {this.state.error && (
                            <details style={{
                                marginBottom: '32px',
                                textAlign: 'left',
                                background: colors.paperDark,
                                padding: '16px',
                                borderRadius: '12px',
                                border: `1px solid ${colors.rule}`,
                            }}>
                                <summary style={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.8rem',
                                    color: colors.inkLight,
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}>
                                    Technical Details
                                </summary>
                                <pre style={{
                                    fontFamily: fonts.mono,
                                    fontSize: '0.7rem',
                                    color: colors.inkMuted,
                                    marginTop: '12px',
                                    overflow: 'auto',
                                    maxHeight: '150px',
                                    lineHeight: 1.5,
                                }}>
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: 'clamp(12px, 3vw, 16px)',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: 'clamp(12px, 3vw, 14px) clamp(24px, 6vw, 32px)',
                                    background: colors.accent,
                                    color: colors.paper,
                                    border: 'none',
                                    borderRadius: 'clamp(10px, 2.5vw, 12px)',
                                    fontFamily: fonts.mono,
                                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: `0 4px 12px ${colors.accent}40`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = `0 6px 20px ${colors.accent}60`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}40`
                                }}
                            >
                                Retry
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    padding: 'clamp(12px, 3vw, 14px) clamp(24px, 6vw, 32px)',
                                    background: colors.paperDark,
                                    color: colors.ink,
                                    border: `1px solid ${colors.rule}`,
                                    borderRadius: 'clamp(10px, 2.5vw, 12px)',
                                    fontFamily: fonts.mono,
                                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = colors.paperDarker
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = colors.paperDark
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                Go Home
                            </button>
                        </div>

                        {/* Helper Text */}
                        <p style={{
                            fontFamily: fonts.mono,
                            fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)',
                            color: colors.inkMuted,
                            marginTop: '24px',
                        }}>
                            If this keeps happening, try clearing your browser cache
                        </p>
                    </div>

                    <style>{`
                        @keyframes slideUp {
                            from {
                                opacity: 0;
                                transform: translateY(30px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }

                        @keyframes float {
                            0%, 100% {
                                transform: translateY(0px);
                            }
                            50% {
                                transform: translateY(-10px);
                            }
                        }

                        @keyframes ripple {
                            0% {
                                opacity: 0.6;
                                transform: scale(1);
                            }
                            100% {
                                opacity: 0;
                                transform: scale(1.5);
                            }
                        }

                        @keyframes pulse {
                            0%, 100% {
                                opacity: 0.03;
                            }
                            50% {
                                opacity: 0.06;
                            }
                        }

                        @keyframes iconBounce {
                            0% {
                                transform: scale(0) rotate(-180deg);
                                opacity: 0;
                            }
                            50% {
                                transform: scale(1.1) rotate(0deg);
                            }
                            100% {
                                transform: scale(1) rotate(0deg);
                                opacity: 1;
                            }
                        }
                    `}</style>
                </div>
            )
        }
        return this.props.children
    }
}

export default withTheme(ErrorBoundary)
