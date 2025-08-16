import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ListMusic, Music, Play, Pause, Trash2, Shuffle, RotateCcw } from 'lucide-react'
import { usePlayer } from '@/context/PlayerContext'
import SongCard from '@/components/music/SongCard'

export default function QueuePage() {
    const {
        queue,
        currentSong,
        currentIndex,
        isPlaying,
        togglePlay,
        handleNext,
        handlePrevious,
        clearQueue,
        removeFromQueue,
        shuffleMode,
        toggleShuffle
    } = usePlayer()

    const handleClearQueue = () => {
        if (window.confirm('Are you sure you want to clear the entire queue?')) {
            clearQueue && clearQueue()
        }
    }

    const handleRemoveSong = (index) => {
        removeFromQueue && removeFromQueue(index)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto pt-20 pb-24"
        >
            <div className="max-w-7xl mx-auto p-6">
                {/* Header Section */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-glass backdrop-blur-md border border-surface-primary/30 p-8 mb-8"
                >
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary rounded-full blur-3xl opacity-10"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-secondary rounded-full blur-3xl opacity-10"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-md">
                                    <ListMusic className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-heading font-bold text-text-primary leading-tight">
                                        Play Queue
                                    </h1>
                                    <p className="text-text-secondary">
                                        {queue.length} song{queue.length !== 1 ? 's' : ''} in queue
                                    </p>
                                </div>
                            </div>

                            {/* Queue Controls */}
                            <div className="flex items-center space-x-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleShuffle}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${shuffleMode
                                            ? 'bg-accent-primary border-accent-primary text-white shadow-glow-sm'
                                            : 'bg-surface-primary/50 border-surface-secondary/30 text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Shuffle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Shuffle</span>
                                </motion.button>

                                {queue.length > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleClearQueue}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-surface-primary/50 border border-surface-secondary/30 text-text-secondary hover:text-accent-danger hover:border-accent-danger/30 transition-all duration-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Clear Queue</span>
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Current Song Display */}
                        {currentSong && (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-surface-primary/30 rounded-xl p-4 border border-surface-secondary/20"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <img
                                            src={currentSong.image?.[0]?.link || currentSong.image?.[1]?.link || currentSong.image?.[2]?.link}
                                            alt={currentSong.name}
                                            className="w-16 h-16 rounded-xl object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/64x64/6366f1/ffffff?text=♪'
                                            }}
                                        />
                                        {isPlaying && (
                                            <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                    className="w-2 h-2 bg-white rounded-full"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-text-primary font-semibold">{currentSong.name}</h3>
                                        <p className="text-text-secondary text-sm">{currentSong.primaryArtists}</p>
                                        <p className="text-accent-primary text-xs font-medium">Now Playing</p>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={togglePlay}
                                        className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow-sm"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-5 h-5 text-white" />
                                        ) : (
                                            <Play className="w-5 h-5 text-white ml-0.5" />
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Queue List */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {queue.length > 0 ? (
                        <div className="space-y-2">
                            <h2 className="text-xl font-heading font-semibold text-text-primary mb-4">
                                Next in Queue
                            </h2>

                            <AnimatePresence>
                                {queue.map((song, index) => {
                                    const isCurrentSong = index === currentIndex

                                    return (
                                        <motion.div
                                            key={`${song.id}-${index}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            className={`relative ${isCurrentSong ? 'opacity-50' : ''}`}
                                        >
                                            <div className="group relative">
                                                <SongCard
                                                    song={song}
                                                    showIndex={true}
                                                    index={index}
                                                    variant="queue"
                                                />

                                                {/* Remove Button */}
                                                {!isCurrentSong && (
                                                    <motion.button
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleRemoveSong(index)}
                                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-accent-danger/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-white" />
                                                    </motion.button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-secondary/50 flex items-center justify-center">
                                <ListMusic className="w-12 h-12 text-text-tertiary" />
                            </div>
                            <h3 className="text-2xl font-heading font-semibold text-text-primary mb-2">
                                Your queue is empty
                            </h3>
                            <p className="text-text-tertiary mb-8 max-w-md mx-auto">
                                Add some songs to your queue to see them here. Start by playing a song or adding tracks from any playlist.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.history.back()}
                                className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold shadow-glow-md hover:shadow-glow-lg transition-all duration-200"
                            >
                                Go Back
                            </motion.button>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}
