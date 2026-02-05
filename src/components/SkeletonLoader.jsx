import { useTheme } from '@/context/ThemeContext'

export default function SkeletonLoader({ type = 'card', count = 1 }) {
    const { colors } = useTheme()

    const shimmerStyle = {
        background: `linear-gradient(90deg, 
      ${colors.paperDark}00 0%, 
      ${colors.paperDark}40 50%, 
      ${colors.paperDark}00 100%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
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
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
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
                            borderRadius: '8px',
                            marginBottom: '8px',
                        }}
                    >
                        {/* Image placeholder */}
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: colors.rule,
                            borderRadius: '6px',
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
                borderRadius: '12px',
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
