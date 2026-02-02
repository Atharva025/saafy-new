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

    const handlePlay = (song) => playSong(song, songs)

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

    const artistImage = artist?.image?.[2]?.link || artist?.image?.[1]?.link || ''

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
                            background: 'none',
                            border: 'none',
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
                }}>
                    {artistImage ? (
                        <img
                            src={artistImage}
                            alt={artist?.name}
                            style={{
                                width: '200px',
                                height: '200px',
                                objectFit: 'cover',
                                border: `1px solid ${colors.rule}`,
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '200px',
                            height: '200px',
                            background: colors.ink,
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
                            const imageUrl = song.image?.[1]?.link || song.image?.[0]?.link || ''

                            return (
                                <div
                                    key={song.id}
                                    onClick={() => handlePlay(song)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        background: isCurrentSong ? colors.paperDark : 'transparent',
                                        borderLeft: isCurrentSong ? `3px solid ${colors.accent}` : '3px solid transparent',
                                        transition: 'all 0.15s',
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
                                        <img src={imageUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            background: colors.ink,
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
