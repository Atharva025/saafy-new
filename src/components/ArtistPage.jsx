import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getArtist, getArtistSongs } from '@/lib/api'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import BasicPlayer from './BasicPlayer'
import Tooltip from './Tooltip'

export default function ArtistPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { playSong, currentSong, isPlaying } = usePlayer()
    const { colors, fonts, isDark } = useTheme()
    
    const [artist, setArtist] = useState(null)
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hoveredIndex, setHoveredIndex] = useState(null)

    useEffect(() => {
        const fetchArtist = async () => {
            setLoading(true)
            try {
                const [artistRes, songsRes] = await Promise.all([
                    getArtist(id),
                    getArtistSongs(id)
                ])
                if (artistRes.success && artistRes.data) setArtist(artistRes.data)
                if (songsRes.success && songsRes.data?.results) setSongs(songsRes.data.results)
            } catch (err) {
                setError('Failed to load artist')
            } finally {
                setLoading(false)
            }
        }
        fetchArtist()
    }, [id])

    const handlePlay = (song) => playSong(song)

    const formatDuration = (seconds) => {
        if (!seconds) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: colors.paper,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{ fontFamily: fonts.mono, color: colors.inkLight }}>
                    Loading artist...
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                background: colors.paper,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
            }}>
                <div style={{ fontFamily: fonts.mono, color: colors.inkMuted }}>{error}</div>
                <button
                    onClick={() => navigate('/')}
                    className="ske-raised"
                    style={{
                        padding: '12px 24px',
                        fontFamily: fonts.mono,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: colors.ink,
                        color: colors.paper,
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '10px',
                    }}
                >
                    Go Back
                </button>
            </div>
        )
    }

    // Use highest quality artist image available
    const artistImage = artist?.image?.[2]?.link || artist?.image?.[2]?.url ||
        artist?.image?.[1]?.link || artist?.image?.[1]?.url ||
        artist?.image?.[0]?.link || artist?.image?.[0]?.url || ''

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.paper,
            paddingTop: '76px',
            paddingBottom: '120px',
            transition: 'background 0.3s ease',
            position: 'relative',
        }}>
            {/* Header */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: isDark ? 'rgba(26, 22, 20, 0.88)' : 'rgba(250, 247, 242, 0.88)',
                backdropFilter: 'blur(12px) saturate(140%)',
                WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: `0 2px 8px var(--ske-shadow), 0 1px 0 var(--ske-inner-highlight), inset 0 1px 0 var(--ske-highlight)`,
                transition: 'all 0.3s ease',
            }}>
                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    padding: '16px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <button
                        onClick={() => navigate('/')}
                        className="ske-raised"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontFamily: fonts.mono,
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: colors.inkMuted,
                            background: colors.paperDark,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.60)'}`,
                            borderRadius: '10px',
                            padding: '8px 14px',
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <span style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        color: colors.inkLight,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                    }}>
                        Artist Profile
                    </span>
                </div>
            </header>

            {/* Artist Hero */}
            <div style={{
                padding: '64px 32px',
                maxWidth: '1000px',
                margin: '0 auto',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '40px',
                    flexWrap: 'wrap',
                }}>
                    {artistImage ? (
                        <img
                            src={artistImage}
                            alt={artist?.name}
                            className="ske-art"
                            style={{
                                width: '200px',
                                height: '200px',
                                objectFit: 'cover',
                                borderRadius: '16px',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)'}`,
                                boxShadow: `var(--shadow-ske-md)`,
                            }}
                        />
                    ) : (
                        <div 
                            className="ske-recessed"
                            style={{
                                width: '200px',
                                height: '200px',
                                background: colors.paperDarker,
                                borderRadius: '16px',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.inkMuted} strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                    )}
                    <div>
                        <div style={{
                            fontFamily: fonts.mono,
                            fontSize: '0.7rem',
                            color: colors.accent,
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            marginBottom: '8px',
                        }}>
                            Artist
                        </div>
                        <h1 style={{
                            fontFamily: fonts.display,
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                            fontWeight: 800,
                            color: colors.ink,
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            marginBottom: '8px',
                        }}>
                            {artist?.name}
                        </h1>
                        {artist?.followerCount && (
                            <div style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.9rem',
                                color: colors.inkMuted,
                            }}>
                                {artist.followerCount.toLocaleString()} followers
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px', marginBottom: '48px' }}>
                <hr className="ske-groove" />
            </div>

            {/* Songs */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '16px',
                    marginBottom: '24px',
                }}>
                    <h2 style={{
                        fontFamily: fonts.display,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: colors.ink,
                    }}>
                        Popular Songs
                    </h2>
                    <span style={{
                        fontFamily: fonts.mono,
                        fontSize: '0.7rem',
                        color: colors.inkLight,
                        textTransform: 'uppercase',
                    }}>
                        {songs.length} tracks
                    </span>
                </div>

                {songs.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '64px 0',
                        fontFamily: fonts.mono,
                        color: colors.inkLight,
                    }}>
                        No songs found
                    </div>
                ) : (
                    <div>
                        {songs.map((song, index) => {
                            const isCurrentSong = currentSong?.id === song.id
                            const imageUrl = song.image?.[2]?.link || song.image?.[2]?.url ||
                                song.image?.[1]?.link || song.image?.[1]?.url ||
                                song.image?.[0]?.link || song.image?.[0]?.url ||
                                song.imageUrl || ''

                            return (
                                <div
                                    key={song.id}
                                    onClick={() => handlePlay(song)}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '14px 16px',
                                        cursor: 'pointer',
                                        background: isCurrentSong
                                            ? (isDark ? 'rgba(224,115,86,0.07)' : 'rgba(196,92,62,0.05)')
                                            : hoveredIndex === index ? colors.paperDark : 'transparent',
                                        backgroundImage: (isCurrentSong || hoveredIndex === index) ? 'var(--background-image-ske-surface)' : 'none',
                                        borderRadius: '10px',
                                        borderLeft: isCurrentSong ? `3px solid ${colors.accent}` : '3px solid transparent',
                                        boxShadow: isCurrentSong
                                            ? `inset 1px 2px 5px var(--ske-inner-shadow), inset -1px -1px 3px var(--ske-inner-highlight)`
                                            : hoveredIndex === index
                                                ? `1px 2px 6px var(--ske-shadow), -1px -1px 4px var(--ske-highlight), inset 0 1px 0 var(--ske-inner-highlight)`
                                                : 'none',
                                        transition: 'background 0.12s ease, box-shadow 100ms ease-out',
                                        marginBottom: '2px',
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        textAlign: 'center',
                                        fontFamily: fonts.mono,
                                        fontSize: '0.85rem',
                                        color: colors.inkLight,
                                    }}>
                                        {isCurrentSong && isPlaying ? (
                                            <span style={{ color: colors.accent }}>▶</span>
                                        ) : (
                                            String(index + 1).padStart(2, '0')
                                        )}
                                    </div>

                                    {imageUrl ? (
                                        <img 
                                            src={imageUrl} 
                                            alt="" 
                                            className="ske-art"
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                                            }} 
                                        />
                                    ) : (
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            background: colors.paperDark,
                                            backgroundImage: 'var(--background-image-ske-recessed)',
                                            borderRadius: '8px',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.50)'}`,
                                            boxShadow: 'var(--shadow-ske-inset-sm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: colors.accent }} />
                                        </div>
                                    )}

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {song.name && song.name.length > 20 ? (
                                            <Tooltip text={song.name}>
                                                <div style={{
                                                    fontFamily: fonts.primary,
                                                    fontWeight: 500,
                                                    color: isCurrentSong ? colors.accent : colors.ink,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {song.name}
                                                </div>
                                            </Tooltip>
                                        ) : (
                                            <div style={{
                                                fontFamily: fonts.primary,
                                                fontWeight: 500,
                                                color: isCurrentSong ? colors.accent : colors.ink,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {song.name}
                                            </div>
                                        )}
                                        {song.primaryArtists && song.primaryArtists.length > 28 ? (
                                            <Tooltip text={song.primaryArtists}>
                                                <div style={{
                                                    fontFamily: fonts.mono,
                                                    fontSize: '0.75rem',
                                                    color: colors.inkMuted,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {song.primaryArtists}
                                                </div>
                                            </Tooltip>
                                        ) : (
                                            <div style={{
                                                fontFamily: fonts.mono,
                                                fontSize: '0.75rem',
                                                color: colors.inkMuted,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                }}>
                                                    {song.primaryArtists}
                                                </div>
                                        )}
                                    </div>

                                    <div style={{
                                        fontFamily: fonts.mono,
                                        fontSize: '0.75rem',
                                        color: colors.inkLight,
                                        width: '48px',
                                        textAlign: 'right',
                                    }}>
                                        {formatDuration(song.duration)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <BasicPlayer />
        </div>
    )
}
