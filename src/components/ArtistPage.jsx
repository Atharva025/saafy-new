import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getArtist, getArtistSongs } from '@/lib/api'
import { usePlayer } from '@/context/PlayerContext'
import BasicPlayer from './BasicPlayer'

// Design System
const colors = {
    paper: '#FAF7F2',
    paperDark: '#F0EBE3',
    paperDarker: '#E5DFD7',
    ink: '#1A1614',
    inkMuted: '#6B635B',
    inkLight: '#9C948B',
    accent: '#C45C3E',
    accentHover: '#A94E34',
    rule: '#E5DFD7',
}

const fonts = {
    display: "'Syne', sans-serif",
    primary: "'Sora', sans-serif",
    mono: "'Space Grotesk', monospace",
}

export default function ArtistPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { playSong, currentSong, isPlaying } = usePlayer()
    const [artist, setArtist] = useState(null)
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
                    }}
                >
                    Go Back
                </button>
            </div>
        )
    }

    // Use highest quality artist image available
    const artistImage = artist?.image?.[0]?.link || artist?.image?.[0]?.url ||
        artist?.image?.[1]?.link || artist?.image?.[1]?.url ||
        artist?.image?.[2]?.link || artist?.image?.[2]?.url || ''

    return (
        <div style={{
            minHeight: '100vh',
            background: colors.paper,
            paddingBottom: '120px',
        }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: colors.paper,
                borderBottom: `1px solid ${colors.rule}`,
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
                            backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                            border: `1px solid rgba(255,255,255,0.60)`,
                            borderRadius: '10px',
                            padding: '8px 14px',
                            cursor: 'pointer',
                            boxShadow: `2px 3px 6px rgba(26,22,20,0.12), -1px -1px 4px rgba(255,255,255,0.80), inset 0 1px 0 rgba(255,255,255,0.80)`,
                            transition: 'box-shadow 80ms ease-out, transform 80ms ease-out',
                        }}
                        onMouseDown={(e) => { e.currentTarget.style.boxShadow = 'inset 2px 3px 6px rgba(26,22,20,0.15), inset -1px -1px 3px rgba(255,255,255,0.60)'; e.currentTarget.style.transform = 'translateY(1px)' }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `2px 3px 6px rgba(26,22,20,0.12), -1px -1px 4px rgba(255,255,255,0.80), inset 0 1px 0 rgba(255,255,255,0.80)` }}
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
                }}>
                    {artistImage ? (
                        <img
                            src={artistImage}
                            alt={artist?.name}
                            style={{
                                width: '200px',
                                height: '200px',
                                objectFit: 'cover',
                                borderRadius: '16px',
                                border: `1px solid rgba(255,255,255,0.60)`,
                                boxShadow: `6px 8px 20px rgba(26,22,20,0.22), -3px -3px 10px rgba(255,255,255,0.75), inset 0 1px 1px rgba(255,255,255,0.80), inset 0 -1px 2px rgba(26,22,20,0.10)`,
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '200px',
                            height: '200px',
                            background: colors.ink,
                            borderRadius: '16px',
                            border: `1px solid rgba(255,255,255,0.60)`,
                            boxShadow: `6px 8px 20px rgba(26,22,20,0.22), -3px -3px 10px rgba(255,255,255,0.75)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: colors.accent }} />
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
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px' }}>
                <div style={{ height: '1px', background: colors.rule, marginBottom: '48px' }} />
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
                            // Use highest quality image available - check both .link and .url
                            const imageUrl = song.image?.[0]?.link || song.image?.[0]?.url ||
                                song.image?.[1]?.link || song.image?.[1]?.url ||
                                song.image?.[2]?.link || song.image?.[2]?.url ||
                                song.imageUrl || ''

                            return (
                                <div
                                    key={song.id}
                                    onClick={() => handlePlay(song)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '14px 16px',
                                        cursor: 'pointer',
                                        background: isCurrentSong ? 'rgba(196,92,62,0.06)' : 'transparent',
                                        backgroundImage: isCurrentSong ? 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 100%)' : 'none',
                                        borderRadius: '10px',
                                        borderLeft: isCurrentSong ? `3px solid ${colors.accent}` : '3px solid transparent',
                                        boxShadow: isCurrentSong
                                            ? `inset 1px 2px 5px rgba(26,22,20,0.10), inset -1px -1px 3px rgba(255,255,255,0.60)`
                                            : 'none',
                                        transition: 'background 0.12s ease, box-shadow 100ms ease-out',
                                        marginBottom: '2px',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isCurrentSong) {
                                            e.currentTarget.style.background = colors.paperDark
                                            e.currentTarget.style.backgroundImage = 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, transparent 100%)'
                                            e.currentTarget.style.boxShadow = `1px 2px 6px rgba(26,22,20,0.12), -1px -1px 4px rgba(255,255,255,0.75), inset 0 1px 0 rgba(255,255,255,0.70)`
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isCurrentSong) {
                                            e.currentTarget.style.background = 'transparent'
                                            e.currentTarget.style.backgroundImage = 'none'
                                            e.currentTarget.style.boxShadow = 'none'
                                        }
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
                                        <img src={imageUrl} alt="" style={{
                                            width: '48px',
                                            height: '48px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            boxShadow: `1px 2px 5px rgba(26,22,20,0.14), -1px -1px 3px rgba(255,255,255,0.75), inset 0 1px 0 rgba(255,255,255,0.60)`,
                                        }} />
                                    ) : (
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            background: colors.paperDark,
                                            backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
                                            borderRadius: '8px',
                                            border: `1px solid rgba(255,255,255,0.50)`,
                                            boxShadow: `inset 1px 2px 4px rgba(26,22,20,0.10), inset -1px -1px 2px rgba(255,255,255,0.60)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: colors.accent }} />
                                        </div>
                                    )}

                                    <div style={{ flex: 1, minWidth: 0 }}>
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

            <BasicPlayer colors={colors} fonts={fonts} />
        </div>
    )
}
