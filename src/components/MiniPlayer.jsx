import { useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import AudioVisualizer from './AudioVisualizer'

export default function MiniPlayer({ onExpand }) {
    const { colors, fonts } = useTheme()
    const {
        currentSong,
        isPlaying,
        togglePlay,
        handleNext,
        progress,
        duration,
    } = usePlayer()
    const [isHovered, setIsHovered] = useState(false)

    if (!currentSong) return null

    // Use highest quality image available - check both .link and .url
    const imageUrl = currentSong?.image?.[0]?.link || currentSong?.image?.[0]?.url ||
        currentSong?.image?.[1]?.link || currentSong?.image?.[1]?.url ||
        currentSong?.image?.[2]?.link || currentSong?.image?.[2]?.url ||
        currentSong?.imageUrl || ''
    const progressPercent = duration ? (progress / duration) * 100 : 0

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'fixed',
                bottom: '16px',
                right: '16px',
                zIndex: 150,
                width: '280px',
                background: colors.paper,
                borderRadius: '14px',
                border: `1px solid ${colors.rule}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                cursor: 'pointer',
            }}
            onClick={onExpand}
        >
            {/* Progress Bar */}
            <div style={{
                height: '3px',
                background: colors.paperDark,
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}cc)`,
                    transition: 'width 0.1s linear',
                }} />
            </div>

            <div style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}>
                {/* Album Art */}
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: colors.paperDark,
                    position: 'relative',
                }}>
                    {imageUrl && (
                        <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    {isPlaying && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <AudioVisualizer compact />
                        </div>
                    )}
                </div>

                {/* Song Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontFamily: fonts.primary,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: colors.ink,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {currentSong.name}
                    </div>
                    <div style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        color: colors.inkMuted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {currentSong.primaryArtists}
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            togglePlay()
                        }}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: colors.accent,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {isPlaying ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={colors.paper}>
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={colors.paper}>
                                <path d="M8 5v14l11-7L8 5z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleNext()
                        }}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: colors.paperDark,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.ink,
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 4l12 8-12 8V4zm12 0v16h2V4h-2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
