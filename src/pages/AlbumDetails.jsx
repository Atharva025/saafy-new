import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Heart, MoreHorizontal, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SongListItem from '@/components/music/SongListItem'
import { getAlbum } from '@/lib/api'
import { usePlayer } from '@/context/PlayerContext'
import { getOptimizedImageUrl, cleanText, formatDuration } from '@/lib/utils'

export default function AlbumDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [album, setAlbum] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { playSong } = usePlayer()

    useEffect(() => {
        const fetchAlbum = async () => {
            try {
                setLoading(true)
                const data = await getAlbum(id)
                setAlbum(data.data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchAlbum()
        }
    }, [id])

    const handlePlayAll = () => {
        if (album?.songs?.length > 0) {
            playSong(album.songs[0], album.songs)
        }
    }

    if (loading) {
        return (
            <div className="flex-1 bg-background overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="w-64 h-64 bg-background-secondary border border-white rounded-2xl animate-pulse"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-8 bg-background-secondary rounded w-3/4 animate-pulse"></div>
                            <div className="h-6 bg-background-secondary rounded w-1/2 animate-pulse"></div>
                            <div className="h-4 bg-background-secondary rounded w-1/4 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-16 bg-background-secondary border border-white rounded-2xl animate-pulse"></div>
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
                        <h2 className="text-2xl font-heading font-semibold text-text-secondary mb-2">
                            Album not found
                        </h2>
                        <p className="text-text-secondary/70 mb-8">{error}</p>
                        <Button onClick={() => navigate(-1)}>Go Back</Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!album) return null

    const totalDuration = album.songs?.reduce((total, song) => total + (song.duration || 0), 0) || 0

    return (
        <div className="flex-1 bg-background overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="relative">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-background-secondary to-background opacity-100"></div>

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

                        {/* Album Info */}
                        <div className="flex items-end space-x-6">
                            <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
                                <img
                                    src={getOptimizedImageUrl(album.image?.[2]?.link, 'large')}
                                    alt={album.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 text-text-primary">
                                <p className="text-sm font-medium mb-2 opacity-100">Album</p>
                                <h1 className="text-5xl font-heading font-bold mb-4 leading-tight">
                                    {cleanText(album.name)}
                                </h1>
                                <div className="flex items-center space-x-2 text-text-secondary">
                                    <span className="font-medium">{cleanText(album.primaryArtists)}</span>
                                    {album.year && (
                                        <>
                                            <span>•</span>
                                            <span>{album.year}</span>
                                        </>
                                    )}
                                    {album.songs?.length && (
                                        <>
                                            <span>•</span>
                                            <span>{album.songs.length} songs</span>
                                        </>
                                    )}
                                    {totalDuration > 0 && (
                                        <>
                                            <span>•</span>
                                            <span>{formatDuration(totalDuration)}</span>
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
                        className="w-14 h-14 rounded-full bg-accent hover:bg-accent text-gray-900 hover:scale-105 transition-all"
                    >
                        <Play className="w-6 h-6 ml-0.5" />
                    </Button>

                    <Button variant="ghost" size="icon" className="text-text-secondary hover:text-text-primary">
                        <Heart className="w-6 h-6" />
                    </Button>

                    <Button variant="ghost" size="icon" className="text-text-secondary hover:text-text-primary">
                        <MoreHorizontal className="w-6 h-6" />
                    </Button>
                </div>

                {/* Songs List */}
                <div className="px-8 pb-8">
                    {album.songs?.length > 0 ? (
                        <>
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-text-secondary font-medium border-b border-white mb-4">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-6">Title</div>
                                <div className="col-span-4 hidden md:block">Artist</div>
                                <div className="col-span-1 text-center">
                                    <Clock className="w-4 h-4 mx-auto" />
                                </div>
                            </div>

                            {/* Songs */}
                            <div className="space-y-1">
                                {album.songs.map((song, index) => (
                                    <SongListItem
                                        key={song.id}
                                        song={song}
                                        index={index}
                                        showIndex={true}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-text-secondary">No songs available</p>
                        </div>
                    )}
                </div>

                {/* Album Info */}
                {album.description && (
                    <div className="px-8 pb-8">
                        <h3 className="text-xl font-heading font-semibold text-text-primary mb-4">About</h3>
                        <p className="text-text-secondary leading-relaxed">
                            {cleanText(album.description)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
