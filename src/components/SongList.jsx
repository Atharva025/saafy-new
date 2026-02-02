import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'

export default function SongList({ songs, onPlaySong }) {
    const { colors, fonts } = useTheme()
    const { playSong, currentSong, isPlaying } = usePlayer()

    if (!songs || songs.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '64px 0',
                fontFamily: fonts.mono,
                color: colors.inkLight,
            }}>
                No songs found
            </div>
        )
    }

    const handlePlay = (song) => {
        if (onPlaySong) {
            onPlaySong(song, songs)
        } else {
            playSong(song, songs)
        }
    }

    const formatDuration = (seconds) => {
        if (!seconds) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
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
                            borderRadius: '8px',
                            borderLeft: isCurrentSong ? `3px solid ${colors.accent}` : '3px solid transparent',
                            transition: 'all 0.15s',
                            marginBottom: '2px',
                        }}
                    >
                        {/* Track Number */}
                        <div style={{
                            width: '32px',
                            textAlign: 'center',
                            fontFamily: fonts.mono,
                            fontSize: '0.85rem',
                            color: colors.inkLight,
                        }}>
                            {isCurrentSong && isPlaying ? (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                    <span style={{
                                        width: '3px',
                                        height: '12px',
                                        background: colors.accent,
                                        animation: 'pulse 0.6s infinite alternate',
                                    }} />
                                    <span style={{
                                        width: '3px',
                                        height: '16px',
                                        background: colors.accent,
                                        animation: 'pulse 0.6s infinite alternate 0.1s',
                                    }} />
                                    <span style={{
                                        width: '3px',
                                        height: '10px',
                                        background: colors.accent,
                                        animation: 'pulse 0.6s infinite alternate 0.2s',
                                    }} />
                                </div>
                            ) : (
                                String(index + 1).padStart(2, '0')
                            )}
                        </div>

                        {/* Album Art */}
                        {imageUrl ? (
                            <img src={imageUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', flexShrink: 0, borderRadius: '6px' }} />
                        ) : (
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: colors.paperDark,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                borderRadius: '6px',
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={colors.inkLight}>
                                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                </svg>
                            </div>
                        )}

                        {/* Song Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontFamily: fonts.primary,
                                fontWeight: 500,
                                color: isCurrentSong ? colors.accent : colors.ink,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {song.name || song.title}
                            </div>
                            <div style={{
                                fontFamily: fonts.mono,
                                fontSize: '0.75rem',
                                color: colors.inkMuted,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                                {song.primaryArtists || 'Unknown'}
                            </div>
                        </div>

                        {/* Duration */}
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

            <style>{`
                @keyframes pulse {
                    0% { transform: scaleY(0.6); }
                    100% { transform: scaleY(1); }
                }
            `}</style>
        </div>
    )
}
