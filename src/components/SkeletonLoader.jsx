import { useTheme } from '@/context/ThemeContext'

// GPU-accelerated light reflection sweep overlay component
function ShimmerOverlay({ isDark }) {
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                width: '200%',
                height: '100%',
                background: isDark
                    ? 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.02) 25%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 75%, rgba(255, 255, 255, 0) 100%)'
                    : 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 248, 230, 0.20) 25%, rgba(255, 248, 230, 0.50) 50%, rgba(255, 248, 230, 0.20) 75%, rgba(255, 255, 255, 0) 100%)',
                animation: 'shimmerSweep 1.6s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                pointerEvents: 'none',
                zIndex: 2,
            }}
        />
    )
}

export default function SkeletonLoader({ type = 'card', count = 1 }) {
    const { isDark } = useTheme()

    if (type === 'card') {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className="ske-card ske-textured"
                        style={{
                            width: 'clamp(140px, 35vw, 160px)',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            position: 'relative',
                            border: `1px solid var(--color-border)`,
                            background: 'var(--color-paper-dark)',
                        }}
                    >
                        {/* Image well */}
                        <div 
                            className="ske-recessed"
                            style={{
                                width: '100%',
                                paddingBottom: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                background: 'var(--color-paper-darker)',
                            }}
                        >
                            <ShimmerOverlay isDark={isDark} />
                        </div>

                        {/* Text placeholders */}
                        <div style={{ padding: '12px' }}>
                            <div 
                                className="ske-recessed"
                                style={{
                                    height: '14px',
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                    width: '85%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    background: 'var(--color-paper-darker)',
                                }}
                            >
                                <ShimmerOverlay isDark={isDark} />
                            </div>
                            <div 
                                className="ske-recessed"
                                style={{
                                    height: '10px',
                                    borderRadius: '4px',
                                    width: '55%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    background: 'var(--color-paper-darker)',
                                }}
                            >
                                <ShimmerOverlay isDark={isDark} />
                            </div>
                        </div>
                    </div>
                ))}

                <style>{`
                    @keyframes shimmerSweep {
                        0% { transform: translate3d(-100%, 0, 0) skewX(-20deg); }
                        100% { transform: translate3d(100%, 0, 0) skewX(-20deg); }
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
                        className="ske-card ske-textured"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '10px',
                            marginBottom: '8px',
                            border: `1px solid var(--color-border)`,
                            background: 'var(--color-paper-dark)',
                        }}
                    >
                        {/* Image well */}
                        <div 
                            className="ske-recessed"
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                flexShrink: 0,
                                position: 'relative',
                                overflow: 'hidden',
                                background: 'var(--color-paper-darker)',
                            }}
                        >
                            <ShimmerOverlay isDark={isDark} />
                        </div>

                        {/* Text placeholders */}
                        <div style={{ flex: 1 }}>
                            <div 
                                className="ske-recessed"
                                style={{
                                    height: '12px',
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                    width: '70%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    background: 'var(--color-paper-darker)',
                                }}
                            >
                                <ShimmerOverlay isDark={isDark} />
                            </div>
                            <div 
                                className="ske-recessed"
                                style={{
                                    height: '10px',
                                    borderRadius: '4px',
                                    width: '45%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    background: 'var(--color-paper-darker)',
                                }}
                            >
                                <ShimmerOverlay isDark={isDark} />
                            </div>
                        </div>

                        {/* Duration well */}
                        <div 
                            className="ske-recessed"
                            style={{
                                width: '40px',
                                height: '12px',
                                borderRadius: '4px',
                                position: 'relative',
                                overflow: 'hidden',
                                background: 'var(--color-paper-darker)',
                            }}
                        >
                            <ShimmerOverlay isDark={isDark} />
                        </div>
                    </div>
                ))}

                <style>{`
                    @keyframes shimmerSweep {
                        0% { transform: translate3d(-100%, 0, 0) skewX(-20deg); }
                        100% { transform: translate3d(100%, 0, 0) skewX(-20deg); }
                    }
                `}</style>
            </>
        )
    }

    if (type === 'player') {
        return (
            <div 
                className="ske-textured ske-float"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '16px',
                    border: `1px solid var(--color-border)`,
                    background: 'var(--color-overlay-deep)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                {/* Album art well */}
                <div 
                    className="ske-recessed"
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'var(--color-paper-darker)',
                    }}
                >
                    <ShimmerOverlay isDark={isDark} />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                    <div 
                        className="ske-recessed"
                        style={{
                            height: '14px',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            width: '60%',
                            position: 'relative',
                            overflow: 'hidden',
                            background: 'var(--color-paper-darker)',
                        }}
                    >
                        <ShimmerOverlay isDark={isDark} />
                    </div>
                    <div 
                        className="ske-recessed"
                        style={{
                            height: '10px',
                            borderRadius: '4px',
                            width: '40%',
                            position: 'relative',
                            overflow: 'hidden',
                            background: 'var(--color-paper-darker)',
                        }}
                    >
                        <ShimmerOverlay isDark={isDark} />
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[38, 38, 38].map((size, i) => (
                        <div
                            key={i}
                            className="ske-recessed"
                            style={{
                                width: `${size}px`,
                                height: `${size}px`,
                                borderRadius: '50%',
                                position: 'relative',
                                overflow: 'hidden',
                                background: 'var(--color-paper-darker)',
                            }}
                        >
                            <ShimmerOverlay isDark={isDark} />
                        </div>
                    ))}
                </div>

                <style>{`
                    @keyframes shimmerSweep {
                        0% { transform: translate3d(-100%, 0, 0) skewX(-20deg); }
                        100% { transform: translate3d(100%, 0, 0) skewX(-20deg); }
                    }
                `}</style>
            </div>
        )
    }

    return null
}
