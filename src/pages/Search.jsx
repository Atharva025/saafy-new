import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SongListItem from '@/components/music/SongListItem'
import ArtistCard from '@/components/music/ArtistCard'
import PlaylistCard from '@/components/music/PlaylistCard'
import { searchSongs, searchArtists, searchPlaylists } from '@/lib/api'
import { debounce } from '@/lib/utils'
import { Search as SearchIcon, Music, User, ListMusic, Sparkles } from 'lucide-react'

const tabs = [
    { id: 'songs', label: 'Songs', icon: Music, gradient: 'from-accent-secondary to-accent-primary' },
    { id: 'artists', label: 'Artists', icon: User, gradient: 'from-accent-warning to-accent-danger' },
    { id: 'playlists', label: 'Playlists', icon: ListMusic, gradient: 'from-accent-primary to-accent-secondary' },
]

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('songs')
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [results, setResults] = useState({
        songs: [],
        artists: [],
        playlists: [],
    })
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    // Debounced search function
    const debouncedSearch = debounce(async (searchQuery) => {
        console.log('Debounced search called with query:', searchQuery)

        if (!searchQuery.trim()) {
            setResults({
                songs: [],
                artists: [],
                playlists: [],
            })
            setHasSearched(false)
            return
        }

        setLoading(true)
        setHasSearched(true)

        try {
            console.log('Searching for:', searchQuery, 'in tab:', activeTab)

            if (activeTab === 'songs') {
                const data = await searchSongs(searchQuery, 0, 20)
                console.log('Search songs results:', data)
                setResults(prev => ({ ...prev, songs: data.data?.results || [] }))
            } else if (activeTab === 'artists') {
                const data = await searchArtists(searchQuery, 0, 20)
                console.log('Search artists results:', data)
                setResults(prev => ({ ...prev, artists: data.data?.results || [] }))
            } else if (activeTab === 'playlists') {
                const data = await searchPlaylists(searchQuery, 0, 20)
                console.log('Search playlists results:', data)
                setResults(prev => ({ ...prev, playlists: data.data?.results || [] }))
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }, 300)

    useEffect(() => {
        const queryParam = searchParams.get('q')
        console.log('URL search params changed:', queryParam)
        if (queryParam) {
            setQuery(queryParam)
            debouncedSearch(queryParam)
        }
    }, [searchParams])

    useEffect(() => {
        console.log('Query or activeTab changed:', { query, activeTab })
        if (query) {
            setSearchParams({ q: query })
            debouncedSearch(query)
        } else {
            setSearchParams({})
        }
    }, [query, activeTab])

    const handleTabChange = (tabId) => {
        setActiveTab(tabId)
    }

    const renderLoadingSkeletons = (count = 6) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-surface-primary/30 rounded-2xl h-48 animate-pulse"
                />
            ))}
        </div>
    )

    const renderSongSkeletons = (count = 10) => (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center space-x-4 p-3 bg-surface-primary/30 rounded-2xl animate-pulse"
                >
                    <div className="w-8 h-4 bg-surface-secondary/50 rounded"></div>
                    <div className="w-10 h-10 bg-surface-secondary/50 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-surface-secondary/50 rounded w-3/4"></div>
                        <div className="h-3 bg-surface-secondary/50 rounded w-1/2"></div>
                    </div>
                    <div className="w-12 h-4 bg-surface-secondary/50 rounded"></div>
                </motion.div>
            ))}
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto scrollbar-hide relative"
        >
            {/* Premium Background */}
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
                    className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl"
                />
            </div>

            <div className="relative max-w-7xl mx-auto p-8">
                {/* Search Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center">
                            <SearchIcon className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-3xl font-heading font-bold bg-gradient-primary bg-clip-text text-white">
                            Search
                        </h1>
                    </div>

                    {/* Search Input - Already handled by Header on search page */}
                </motion.div>

                {!hasSearched && !query && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-16"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-24 h-24 bg-gradient-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-sm"
                        >
                            <Sparkles className="w-12 h-12 text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-2">
                            Discover amazing music
                        </h2>
                        <p className="text-text-tertiary">
                            Find your favorite songs, artists, albums, and playlists
                        </p>
                    </motion.div>
                )}

                {hasSearched && (
                    <>
                        {/* Tabs */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex space-x-2 mb-8 bg-surface-primary/30 backdrop-blur-glass p-2 rounded-2xl w-fit border border-surface-secondary/30"
                        >
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id

                                return (
                                    <motion.button
                                        key={tab.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 relative overflow-hidden ${isActive
                                            ? 'bg-gradient-primary text-white shadow-glow-sm'
                                            : 'text-text-tertiary hover:text-text-primary hover:bg-surface-primary/50'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeSearchTab"
                                                className="absolute inset-0 bg-gradient-primary rounded-xl"
                                                initial={false}
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                            />
                                        )}
                                        <Icon className="w-4 h-4 relative z-10" />
                                        <span className="font-medium relative z-10">{tab.label}</span>
                                    </motion.button>
                                )
                            })}
                        </motion.div>

                        {/* Results */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                {loading ? (
                                    activeTab === 'songs' ? renderSongSkeletons() : renderLoadingSkeletons()
                                ) : (
                                    <>
                                        {/* Songs Tab */}
                                        {activeTab === 'songs' && (
                                            <div className="space-y-2">
                                                {results.songs.length > 0 ? (
                                                    results.songs.map((song, index) => (
                                                        <motion.div
                                                            key={song.id}
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: index * 0.05 }}
                                                        >
                                                            <SongListItem song={song} index={index} />
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-center py-8"
                                                    >
                                                        <Music className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                                                        <p className="text-text-tertiary">No songs found</p>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        {/* Artists Tab */}
                                        {activeTab === 'artists' && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                                {results.artists.length > 0 ? (
                                                    results.artists.map((artist, index) => (
                                                        <motion.div
                                                            key={artist.id}
                                                            initial={{ y: 20, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            transition={{ delay: index * 0.1 }}
                                                        >
                                                            <ArtistCard
                                                                artist={artist}
                                                                onClick={(artist) => navigate(`/artist/${artist.id}`)}
                                                            />
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="col-span-full text-center py-8"
                                                    >
                                                        <User className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                                                        <p className="text-text-tertiary">No artists found</p>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        {/* Playlists Tab */}
                                        {activeTab === 'playlists' && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                                {results.playlists.length > 0 ? (
                                                    results.playlists.map((playlist, index) => (
                                                        <motion.div
                                                            key={playlist.id}
                                                            initial={{ y: 20, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            transition={{ delay: index * 0.1 }}
                                                        >
                                                            <PlaylistCard
                                                                playlist={playlist}
                                                                onClick={(playlist) => navigate(`/playlist/${playlist.id}`)}
                                                            />
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="col-span-full text-center py-8"
                                                    >
                                                        <ListMusic className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                                                        <p className="text-text-tertiary">No playlists found</p>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </>
                )}
            </div>
        </motion.div>
    )
}
