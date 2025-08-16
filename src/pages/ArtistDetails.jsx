import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Heart, MoreHorizontal, ArrowLeft, Users, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SongCard from '@/components/music/SongCard'
import AlbumCard from '@/components/music/AlbumCard'
import { getArtist, getArtistSongs, searchAlbums } from '@/lib/api'
import { usePlayer } from '@/context/PlayerContext'
import { getOptimizedImageUrl, cleanText } from '@/lib/utils'

export default function ArtistDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [artist, setArtist] = useState(null)
    const [topSongs, setTopSongs] = useState([])
    const [albums, setAlbums] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { playSong } = usePlayer()

    useEffect(() => {
        const fetchArtistData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Get artist details
                const artistData = await getArtist(id)
                if (artistData.success && artistData.data) {
                    setArtist(artistData.data)

                    // Get artist's songs using the artist ID and albums using artist name
                    const artistName = artistData.data.name
                    const [songsData, albumsData] = await Promise.allSettled([
                        getArtistSongs(id, 0, 'popularity', 'desc'),
                        artistName ? searchAlbums(artistName, 0, 8) : Promise.resolve({ status: 'fulfilled', value: { success: false } })
                    ])

                    if (songsData.status === 'fulfilled' && songsData.value.success) {
                        setTopSongs(songsData.value.data?.results || [])
                    }
                    if (albumsData.status === 'fulfilled' && albumsData.value.success) {
                        setAlbums(albumsData.value.data?.results || [])
                    }
                } else {
                    throw new Error('Artist not found')
                }
            } catch (err) {
                console.error('Error fetching artist data:', err)
                setError(err.message || 'Failed to load artist data')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchArtistData()
        }
    }, [id])

    const handlePlayAll = () => {
        if (topSongs.length > 0) {
            playSong(topSongs[0], topSongs)
        }
    }

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-y-auto p-6"
            >
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="w-64 h-64 bg-surface-secondary/50 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-8 bg-surface-secondary/50 rounded w-3/4 animate-pulse"></div>
                            <div className="h-6 bg-surface-secondary/50 rounded w-1/2 animate-pulse"></div>
                            <div className="h-4 bg-surface-secondary/50 rounded w-1/4 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Songs Skeleton */}
                    <div className="space-y-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-16 bg-surface-secondary/50 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </motion.div>
        )
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-y-auto p-6"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary/50 flex items-center justify-center">
                            <Music className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-2">
                            Artist not found
                        </h2>
                        <p className="text-text-tertiary mb-8">{error}</p>
                        <Button
                            onClick={() => navigate(-1)}
                            className="bg-gradient-primary text-white"
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            </motion.div>
        )
    }

    if (!artist) return null

    const imageUrl = artist.image?.[2]?.url || artist.image?.[1]?.url || artist.image?.[0]?.url
    const hasValidImage = imageUrl && !imageUrl.includes('artist-default')

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto"
        >
            {/* Hero Section */}
            <div className="relative">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-surface-secondary/30 to-background-primary"></div>

                {/* Animated Background Orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{
                            x: [0, 100, 0],
                            y: [0, -50, 0],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-1/4 left-1/6 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl"
                    />
                </div>

                <div className="relative p-8">
                    {/* Back Button */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="mb-6"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-surface-primary/50 backdrop-blur-md text-text-primary hover:bg-surface-primary border border-surface-secondary/30"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </motion.div>

                    {/* Artist Info */}
                    <div className="flex items-end space-x-8">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-64 h-64 rounded-full overflow-hidden shadow-elevated flex-shrink-0 bg-surface-secondary/50"
                        >
                            {hasValidImage ? (
                                <img
                                    src={imageUrl}
                                    alt={artist.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                                    <Users className="w-24 h-24" />
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex-1 text-text-primary pb-4"
                        >
                            <div className="flex items-center space-x-2 mb-2">
                                <Users className="w-5 h-5 text-accent-primary" />
                                <p className="text-sm font-medium text-accent-primary uppercase tracking-wider">
                                    {artist.role || 'Artist'}
                                </p>
                            </div>
                            <h1 className="text-5xl font-heading font-bold mb-4 leading-tight bg-gradient-primary bg-clip-text text-transparent">
                                {cleanText(artist.name)}
                            </h1>
                            <div className="flex items-center space-x-4 text-text-tertiary">
                                {artist.followerCount && (
                                    <span className="text-sm">
                                        {formatFollowers(artist.followerCount)} followers
                                    </span>
                                )}
                                {artist.dominantLanguage && (
                                    <span className="text-sm capitalize">
                                        {artist.dominantLanguage}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="px-8 py-6 flex items-center space-x-4"
            >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        onClick={handlePlayAll}
                        disabled={topSongs.length === 0}
                        className="w-14 h-14 rounded-full bg-gradient-primary hover:shadow-glow-md text-white border-0"
                    >
                        <Play className="w-6 h-6 ml-0.5" />
                    </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-12 h-12 rounded-full text-text-tertiary hover:text-accent-danger hover:bg-surface-primary/50"
                    >
                        <Heart className="w-6 h-6" />
                    </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-12 h-12 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-primary/50"
                    >
                        <MoreHorizontal className="w-6 h-6" />
                    </Button>
                </motion.div>
            </motion.div>

            {/* Content */}
            <div className="px-8 pb-8 space-y-12">
                {/* Top Songs */}
                {topSongs.length > 0 && (
                    <motion.section
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-6">
                            Popular Songs
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {topSongs.slice(0, 12).map((song, index) => (
                                <motion.div
                                    key={song.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 + index * 0.05 }}
                                >
                                    <SongCard song={song} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Albums */}
                {albums.length > 0 && (
                    <motion.section
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-6">
                            Albums
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {albums.map((album, index) => (
                                <motion.div
                                    key={album.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.8 + index * 0.1 }}
                                >
                                    <AlbumCard
                                        album={album}
                                        onClick={(album) => navigate(`/album/${album.id}`)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* About */}
                {artist.bio && (
                    <motion.section
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        <h3 className="text-xl font-heading font-semibold text-text-primary mb-4">
                            About
                        </h3>
                        <p className="text-text-tertiary leading-relaxed max-w-4xl">
                            {cleanText(artist.bio)}
                        </p>
                    </motion.section>
                )}

                {/* No Content Fallback */}
                {topSongs.length === 0 && albums.length === 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-center py-12"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary/50 flex items-center justify-center">
                            <Music className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
                            No content available
                        </h3>
                        <p className="text-text-tertiary">
                            We couldn't find any songs or albums for this artist.
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}

function formatFollowers(count) {
    if (!count) return '0'
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
    return `${(count / 1000000).toFixed(1)}M`
}
