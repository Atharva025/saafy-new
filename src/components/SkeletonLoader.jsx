import { useTheme } from '@/context/ThemeContext'

export default function SkeletonLoader({ type = 'card', count = 1 }) {
    const { colors, isDark } = useTheme()

    const shimmerStyle = {
        background: `linear-gradient(110deg, 
      ${colors.paperDark}00 0%, 
      ${isDark ? `${colors.accent}15` : `${colors.accent}10`} 40%,
      ${colors.paperDark}00 80%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s ease-in-out infinite',
    }

    if (type === 'card') {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                    style={{
                            width: 'clamp(140px, 35vw, 160px)',
                            background: colors.paperDark,
                            backgroundImage: 'var(--background-image-ske-surface)',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            position: 'relative',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)'}`,
                            boxShadow: `2px 3px 8px var(--ske-shadow), -1px -1px 5px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight), inset 0 -1px 1px var(--ske-inner-shadow)`,
                        }}
                    >
                        {/* Image placeholder */}
                        <div style={{
                            width: '100%',
                            paddingBottom: '100%',
                            background: colors.paperDark,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                ...shimmerStyle,
                            }} />
                        </div>

                        {/* Text placeholders */}
                        <div style={{ padding: '12px' }}>
                            <div style={{
                                height: '16px',
                                background: colors.paperDark,
                                borderRadius: '4px',
                                marginBottom: '8px',
                                width: '80%',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    ...shimmerStyle,
                                }} />
                            </div>
                            <div style={{
                                height: '12px',
                                background: colors.paperDark,
                                borderRadius: '4px',
                                width: '60%',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    ...shimmerStyle,
                                }} />
                            </div>
                        </div>
                    </div>
                ))}

                <style>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
            </>
        )
    }

    if (type === 'list') {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: colors.paperDark,
                            backgroundImage: 'var(--background-image-ske-surface)',
                            borderRadius: '10px',
                            marginBottom: '8px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.70)'}`,
                            boxShadow: `1px 2px 5px var(--ske-shadow), -1px -1px 3px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight)`,
                        }}
                    >
                        {/* Image placeholder */}
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: colors.paperDarker,
                            backgroundImage: 'var(--background-image-ske-recessed)',
                            borderRadius: '8px',
                            flexShrink: 0,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-ske-inset-sm)',
                            border: `1px solid ${isDark ? 'rgba(0,0,0,0.15)' : 'rgba(26,22,20,0.08)'}`,
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                ...shimmerStyle,
                            }} />
                        </div>

                        {/* Text placeholders */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                height: '14px',
                                background: colors.rule,
                                borderRadius: '4px',
                                marginBottom: '8px',
                                width: '70%',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    ...shimmerStyle,
                                }} />
                            </div>
                            <div style={{
                                height: '12px',
                                background: colors.rule,
                                borderRadius: '4px',
                                width: '50%',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    ...shimmerStyle,
                                }} />
                            </div>
                        </div>

                        {/* Duration placeholder */}
                        <div style={{
                            width: '40px',
                            height: '12px',
                            background: colors.rule,
                            borderRadius: '4px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                ...shimmerStyle,
                            }} />
                        </div>
                    </div>
                ))}

                <style>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
            </>
        )
    }

    if (type === 'player') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: colors.paperDark,
                backgroundImage: 'var(--background-image-ske-surface)',
                borderRadius: '16px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)'}`,
                boxShadow: `3px 4px 10px var(--ske-shadow), -2px -2px 7px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight), inset 0 -1px 1px var(--ske-inner-shadow)`,
            }}>
                {/* Album art */}
                <div style={{
                    width: '56px',
                    height: '56px',
                    background: colors.rule,
                    borderRadius: '8px',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        ...shimmerStyle,
                    }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        height: '16px',
                        background: colors.rule,
                        borderRadius: '4px',
                        marginBottom: '8px',
                        width: '60%',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            ...shimmerStyle,
                        }} />
                    </div>
                    <div style={{
                        height: '12px',
                        background: colors.rule,
                        borderRadius: '4px',
                        width: '40%',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            ...shimmerStyle,
                        }} />
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[44, 44, 44].map((size, i) => (
                        <div
                            key={i}
                            style={{
                                width: `${size}px`,
                                height: `${size}px`,
                                background: colors.rule,
                                borderRadius: '50%',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                ...shimmerStyle,
                            }} />
                        </div>
                    ))}
                </div>

                <style>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
            </div>
        )
    }

    return null
}
