import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Heart, MoreHorizontal, ArrowLeft, Clock, Shuffle, Repeat, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SongCard from '@/components/music/SongCard'
import { usePlayer } from '@/context/PlayerContext'
import { getPlaylist } from '@/lib/api'
import { getOptimizedImageUrl, cleanText, formatDuration } from '@/lib/utils'

export default function PlaylistDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [playlist, setPlaylist] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { playSong } = usePlayer()

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                setLoading(true)
                setError(null)
                console.log('Fetching playlist details for ID:', id)

                const response = await getPlaylist(id)
                console.log('Playlist API response:', response)

                if (response.success !== false && response.data) {
                    // Handle different response formats
                    const playlistData = Array.isArray(response.data) ? response.data[0] : response.data
                    setPlaylist(playlistData)
                    console.log('Playlist data set:', playlistData)
                } else {
                    setError('Failed to load playlist details')
                    console.error('API response error:', response)
                }
            } catch (err) {
                console.error('Error fetching playlist details:', err)
                setError(err.message || 'Failed to load playlist. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchPlaylist()
        }
    }, [id])

    const handlePlayAll = () => {
        if (playlist?.songs?.length > 0) {
            playSong(playlist.songs[0])
        }
    }

    const handleShuffle = () => {
        if (playlist?.songs?.length > 0) {
            const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5)
            playSong(shuffled[0])
        }
    }

    const getImageUrl = (imageArray) => {
        if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
            return 'https://via.placeholder.com/500x500/6366f1/ffffff?text=Playlist'
        }

        const highQualityImage = imageArray.find(img => img.quality === '500x500') ||
            imageArray.find(img => img.quality === '150x150') ||
            imageArray[imageArray.length - 1] ||
            imageArray[0]

        return highQualityImage?.url || highQualityImage?.link || 'https://via.placeholder.com/500x500/6366f1/ffffff?text=Playlist'
    }

    if (loading) {
        return (
            <div className="flex-1 bg-background overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="w-64 h-64 bg-background-secondary/80 border border-white/10 rounded-2xl animate-pulse"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-8 bg-background-secondary/80 rounded w-3/4 animate-pulse"></div>
                            <div className="h-6 bg-background-secondary/80 rounded w-1/2 animate-pulse"></div>
                            <div className="h-4 bg-background-secondary/80 rounded w-1/4 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-16 bg-background-secondary/80 border border-white/10 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 bg-background overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <div className="text-center py-16">
                        <Music className="w-16 h-16 text-text-secondary/50 mx-auto mb-4" />
                        <h2 className="text-2xl font-heading font-semibold text-text-secondary mb-2">
                            Playlist not found
                        </h2>
                        <p className="text-text-secondary/70 mb-8">{error}</p>
                        <Button onClick={() => navigate(-1)}>Go Back</Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!playlist) return null

    const totalDuration = playlist.songs?.reduce((total, song) => total + (song.duration || 0), 0) || 0

    return (
        <div className="flex-1 bg-background overflow-y-auto scrollbar-hide">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="relative">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-background-secondary to-background opacity-60"></div>

                    <div className="relative p-8">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="mb-6 text-text-primary hover:bg-background-secondary"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>

                        {/* Playlist Info */}
                        <div className="flex items-end space-x-6">
                            <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
                                <img
                                    src={getImageUrl(playlist.image)}
                                    alt={playlist.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/500x500/6366f1/ffffff?text=Playlist'
                                    }}
                                />
                            </div>

                            <div className="flex-1 text-text-primary">
                                <p className="text-sm font-medium mb-2 opacity-90">Playlist</p>
                                <h1 className="text-5xl font-heading font-bold mb-4 leading-tight">
                                    {cleanText(playlist.name)}
                                </h1>
                                {playlist.description && (
                                    <p className="text-text-secondary text-lg mb-4 max-w-2xl">
                                        {cleanText(playlist.description)}
                                    </p>
                                )}
                                <div className="flex items-center space-x-2 text-text-secondary">
                                    {playlist.createdBy && (
                                        <>
                                            <span className="font-medium">{playlist.createdBy}</span>
                                            <span>•</span>
                                        </>
                                    )}
                                    <span>{playlist.songs?.length || playlist.songCount || 0} songs</span>
                                    {totalDuration > 0 && (
                                        <>
                                            <span>•</span>
                                            <span>{formatDuration(totalDuration)}</span>
                                        </>
                                    )}
                                    {playlist.followers && (
                                        <>
                                            <span>•</span>
                                            <span>{playlist.followers.toLocaleString()} followers</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="px-8 py-6 flex items-center space-x-4">
                    <Button
                        onClick={handlePlayAll}
                        size="lg"
                        className="w-14 h-14 rounded-full bg-accent hover:bg-accent/90 text-gray-900 hover:scale-105 transition-all"
                    >
                        <Play className="w-6 h-6 ml-0.5" />
                    </Button>

                    <Button
                        onClick={handleShuffle}
                        size="lg"
                        className="w-12 h-12 rounded-full bg-background-secondary/80 hover:bg-background-secondary border border-white/20 text-text-primary hover:scale-105 transition-all"
                    >
                        <Shuffle className="w-5 h-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-text-secondary hover:text-text-primary"
                    >
                        <Heart className="w-6 h-6" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-text-secondary hover:text-text-primary"
                    >
                        <MoreHorizontal className="w-6 h-6" />
                    </Button>
                </div>

                {/* Songs List */}
                <div className="px-8 pb-8">
                    {playlist.songs?.length > 0 ? (
                        <>
                            <h2 className="text-2xl font-heading font-bold text-text-primary mb-6">
                                Songs
                            </h2>

                            {/* Songs Grid */}
                            <div className="space-y-3">
                                {playlist.songs.map((song, index) => {
                                    const getSongImageUrl = (imageArray) => {
                                        if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
                                            return 'https://via.placeholder.com/150x150/6366f1/ffffff?text=Music'
                                        }

                                        const highQualityImage = imageArray.find(img => img.quality === '500x500') ||
                                            imageArray.find(img => img.quality === '150x150') ||
                                            imageArray[imageArray.length - 1] ||
                                            imageArray[0]

                                        return highQualityImage?.url || highQualityImage?.link || 'https://via.placeholder.com/150x150/6366f1/ffffff?text=Music'
                                    }

                                    return (
                                        <div
                                            key={song.id || `song-${index}`}
                                            className="transform transition-all duration-200 hover:scale-[1.01] hover:translate-x-2"
                                        >
                                            <SongCard
                                                song={song}
                                                showIndex={true}
                                                index={index + 1}
                                                image={getSongImageUrl(song.image)}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <Music className="w-16 h-16 text-text-secondary/50 mx-auto mb-4" />
                            <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
                                No Songs Available
                            </h3>
                            <p className="text-text-secondary/70">
                                This playlist doesn't contain any songs yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
