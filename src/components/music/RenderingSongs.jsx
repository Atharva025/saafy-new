import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Heart, Music, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SongCard from '@/components/music/SongCard'
import { getArtistSongs } from '@/lib/api'
import { usePlayer } from '@/context/PlayerContext'
import { cleanText, getOptimizedImageUrl } from '@/lib/utils'

export default function RenderingSongs({ artist, onBack }) {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { playSong } = usePlayer()

    useEffect(() => {
        const fetchArtistSongs = async () => {
            if (!artist?.id) return

            try {
                setLoading(true)
                const response = await getArtistSongs(artist.id, 0, 'popularity', 'desc')
                console.log('Full API response:', response)
                console.log('Response data:', response.data)
                console.log('Response results:', response.data?.results)
                console.log('Response success:', response.success)

                // Log the first raw song to see its structure
                if (response.data?.results && response.data.results.length > 0) {
                    console.log('First raw song structure:', response.data.results[0])
                    console.log('Raw song downloadUrl field:', response.data.results[0].downloadUrl)
                    console.log('Raw song download_url field:', response.data.results[0].download_url)
                    console.log('All fields of first song:', Object.keys(response.data.results[0]))

                    // Log detailed download URL structure if it exists
                    if (response.data.results[0].downloadUrl) {
                        console.log('Download URL structure:', response.data.results[0].downloadUrl)
                        if (Array.isArray(response.data.results[0].downloadUrl)) {
                            console.log('Download URL array length:', response.data.results[0].downloadUrl.length)
                            response.data.results[0].downloadUrl.forEach((url, index) => {
                                console.log(`Download URL ${index}:`, url)
                            })
                        }
                    }
                }

                // Try different possible response structures
                let songsData = []
                if (response.data?.results) {
                    songsData = response.data.results
                } else if (response.data?.songs) {
                    songsData = response.data.songs
                } else if (response.results) {
                    songsData = response.results
                } else if (Array.isArray(response.data)) {
                    songsData = response.data
                } else if (Array.isArray(response)) {
                    songsData = response
                }

                setSongs(songsData)
                console.log('Set songs:', songsData)
                console.log('Songs count:', songsData.length)
            } catch (err) {
                console.error('Error fetching artist songs:', err)
                setSongs([])
            } finally {
                setLoading(false)
            }
        }

        fetchArtistSongs()
    }, [artist?.id])

    const handlePlayAll = () => {
        if (songs.length > 0) {
            playSong(songs[0], songs)
        }
    }

    const getArtistImage = () => {
        if (!artist?.image || !Array.isArray(artist.image)) return null

        // Get the highest quality image
        const highQualityImage = artist.image.find(img => img.quality === '500x500') ||
            artist.image.find(img => img.quality === '150x150') ||
            artist.image[artist.image.length - 1]

        return highQualityImage?.url || null
    }

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-y-auto pt-20 pb-24"
            >
                <div className="max-w-7xl mx-auto p-6">
                    {/* Header Skeleton */}
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="w-32 h-32 bg-surface-secondary/50 rounded-2xl animate-pulse"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-8 bg-surface-secondary/50 rounded w-3/4 animate-pulse"></div>
                            <div className="h-6 bg-surface-secondary/50 rounded w-1/2 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Loading indicator */}
                    <div className="flex items-center justify-center py-16">
                        <div className="flex items-center space-x-3">
                            <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
                            <span className="text-text-secondary">Loading songs...</span>
                        </div>
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
                className="flex-1 overflow-y-auto pt-20 pb-24"
            >
                <div className="max-w-7xl mx-auto p-6">
                    {/* Back Button */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="mb-6"
                    >
                        <Button
                            variant="ghost"
                            onClick={onBack}
                            className="flex items-center space-x-2 text-text-secondary hover:text-text-primary"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Artists</span>
                        </Button>
                    </motion.div>

                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary/50 flex items-center justify-center">
                            <Music className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-2">
                            No songs found
                        </h2>
                        <p className="text-text-tertiary mb-8">{error}</p>
                        <Button
                            onClick={onBack}
                            className="bg-gradient-primary text-white"
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto pt-20 pb-24"
        >
            <div className="max-w-7xl mx-auto p-6">
                {/* Back Button */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="mb-6"
                >
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="flex items-center space-x-2 text-text-secondary hover:text-text-primary"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Artists</span>
                    </Button>
                </motion.div>

                {/* Artist Header */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-glass backdrop-blur-md border border-surface-primary/30 p-8 mb-8"
                >
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary rounded-full blur-3xl opacity-10"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-secondary rounded-full blur-3xl opacity-10"></div>

                    <div className="relative z-10 flex items-center space-x-6">
                        {/* Artist Image */}
                        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-surface-secondary/50 flex-shrink-0">
                            {getArtistImage() ? (
                                <img
                                    src={getArtistImage()}
                                    alt={artist.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                                    <Music className="w-16 h-16" />
                                </div>
                            )}
                        </div>

                        {/* Artist Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-heading font-bold text-text-primary mb-2 leading-tight">
                                {cleanText(artist.name)}
                            </h1>
                            <p className="text-text-secondary mb-4">
                                {songs.length} song{songs.length !== 1 ? 's' : ''} available
                            </p>

                            {/* Play All Button */}
                            <div className="flex items-center space-x-4">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        onClick={handlePlayAll}
                                        disabled={songs.length === 0}
                                        className="flex items-center space-x-2 bg-gradient-primary text-white px-6 py-3 rounded-xl font-semibold shadow-glow-md hover:shadow-glow-lg"
                                    >
                                        <Play className="w-4 h-4" />
                                        <span>Play All</span>
                                    </Button>
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full text-text-tertiary hover:text-accent-danger hover:bg-surface-primary/50"
                                    >
                                        <Heart className="w-5 h-5" />
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Songs Grid */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-2xl font-heading font-semibold text-text-primary mb-6">
                        Popular Songs by {cleanText(artist.name)}
                    </h2>

                    {songs.length > 0 ? (
                        <div className="space-y-2">
                            {songs.map((song, index) => (
                                <motion.div
                                    key={song.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                >
                                    <SongCard
                                        song={song}
                                        showIndex={true}
                                        index={index}
                                        variant="list"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary/50 flex items-center justify-center">
                                <Music className="w-8 h-8 text-text-tertiary" />
                            </div>
                            <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
                                No songs available
                            </h3>
                            <p className="text-text-tertiary">
                                No songs found for this artist. Check the console for API response details.
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}
