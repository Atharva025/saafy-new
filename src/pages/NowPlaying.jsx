import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart, MoreHorizontal, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '@/context/PlayerContext'
import { getOptimizedImageUrl, truncateText, formatDuration } from '@/lib/utils'

export default function NowPlaying() {
    const navigate = useNavigate()
    const [showLyrics, setShowLyrics] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    
    const {
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        repeatMode,
        shuffleMode,
        togglePlay,
        skipNext,
        skipPrevious,
        setVolume,
        seekTo,
        toggleRepeat,
        toggleShuffle,
    } = usePlayer()

    const handleProgressChange = (value) => {
        seekTo(value[0])
    }

    const handleVolumeChange = (value) => {
        setVolume(value[0] / 100)
    }

    if (!currentSong) {
        return (
            <div className="flex-1 bg-background overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <div className="text-center py-16">
                        <div className="w-32 h-32 bg-background-secondary border border-white rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Play className="w-16 h-16 text-accent" />
                        </div>
                        <h2 className="text-2xl font-heading font-semibold text-text-primary mb-2">
                            No song playing
                        </h2>
                        <p className="text-text-secondary mb-8">
                            Select a song to start listening
                        </p>
                        <Button onClick={() => navigate('/')}>
                            Browse Music
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'flex-1'} bg-background overflow-hidden relative`}>
            {/* Background Image with Blur */}
            <div className="absolute inset-0">
                <img
                    src={getOptimizedImageUrl(currentSong.image?.[2]?.link, 'large')}
                    alt={currentSong.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => isFullscreen ? setIsFullscreen(false) : navigate(-1)}
                        className="text-text-primary hover:bg-background-secondary"
                    >
                        {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                    </Button>

                    <div className="text-center">
                        <h1 className="text-base font-heading font-semibold text-text-primary">
                            Now Playing
                        </h1>
                        <p className="text-xs text-text-secondary">
                            {truncateText(currentSong.name, 40)}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="text-text-primary hover:bg-background-secondary"
                    >
                        {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                    </Button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
                    {/* Album Art */}
                    <div className="relative group mb-6">
                        <div className="w-72 h-72 rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src={getOptimizedImageUrl(currentSong.image?.[2]?.link, 'large')}
                                alt={currentSong.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-r from-accent to-accent-blue rounded-3xl blur opacity-100 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Song Info */}
                    <div className="text-center mb-6 max-w-2xl">
                        <h2 className="text-2xl font-heading font-bold text-text-primary mb-1.5">
                            {currentSong.name}
                        </h2>
                        <p className="text-lg text-text-secondary mb-3">
                            {currentSong.primaryArtists}
                        </p>
                        {currentSong.album?.name && (
                            <p className="text-base text-text-secondary/70">
                                {currentSong.album.name}
                            </p>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-2xl mb-6">
                        <div className="flex items-center space-x-3 mb-1.5">
                            <span className="text-xs text-text-secondary font-medium">
                                {formatDuration(progress)}
                            </span>
                            <div className="flex-1">
                                <Slider
                                    value={[progress]}
                                    max={duration || 100}
                                    step={1}
                                    onValueChange={handleProgressChange}
                                    className="w-full [&>span:first-child]:h-1.5 [&>span:first-child]:bg-white [&>span:first-child]:backdrop-blur-md [&_[role=slider]]:bg-accent [&_[role=slider]]:w-3.5 [&_[role=slider]]:h-3.5 [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg [&>span:first-child>span]:bg-accent [&>span:first-child>span]:h-1.5"
                                />
                            </div>
                            <span className="text-xs text-text-secondary font-medium">
                                {formatDuration(duration)}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center space-x-5 mb-6">
                        <Button
                            onClick={toggleShuffle}
                            className={cn(
                                "w-12 h-12 rounded-full border border-white transition-all duration-300 hover:scale-110",
                                shuffleMode
                                    ? "bg-accent text-white shadow-lg hover:shadow-accent/25"
                                    : "bg-background-secondary hover:bg-background-secondary text-text-secondary hover:text-text-primary"
                            )}
                        >
                            <Shuffle className="w-5 h-5" />
                        </Button>

                        <Button
                            onClick={skipPrevious}
                            className="w-12 h-12 bg-background-secondary hover:bg-background-secondary border border-white rounded-full transition-all duration-300 hover:scale-110 text-text-primary"
                        >
                            <SkipBack className="w-6 h-6" />
                        </Button>

                        <Button
                            onClick={togglePlay}
                            className="w-16 h-16 bg-accent hover:bg-accent rounded-full transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-accent/30"
                        >
                            {isPlaying ? (
                                <Pause className="w-10 h-10 text-white" />
                            ) : (
                                <Play className="w-10 h-10 text-white ml-1" />
                            )}
                        </Button>

                        <Button
                            onClick={skipNext}
                            className="w-12 h-12 bg-background-secondary hover:bg-background-secondary border border-white rounded-full transition-all duration-300 hover:scale-110 text-text-primary"
                        >
                            <SkipForward className="w-6 h-6" />
                        </Button>

                        <Button
                            onClick={toggleRepeat}
                            className={cn(
                                "w-10 h-10 rounded-full border border-white transition-all duration-300 hover:scale-110 relative",
                                repeatMode !== 'none'
                                    ? "bg-accent-blue text-white shadow-lg hover:shadow-accent-blue/25"
                                    : "bg-background-secondary hover:bg-background-secondary text-text-secondary hover:text-text-primary"
                            )}
                        >
                            <Repeat className="w-5 h-5" />
                            {repeatMode === 'one' && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-orange rounded-full border-2 border-white"></div>
                            )}
                        </Button>
                    </div>

                    {/* Additional Controls */}
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-text-secondary hover:text-accent-secondary"
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

                        <div className="flex items-center space-x-3">
                            <Volume2 className="w-5 h-5 text-text-secondary" />
                            <div className="w-20">
                                <Slider
                                    value={[volume * 100]}
                                    max={100}
                                    step={1}
                                    onValueChange={handleVolumeChange}
                                    className="w-full [&>span:first-child]:h-1.5 [&>span:first-child]:bg-white [&>span:first-child]:backdrop-blur-md [&_[role=slider]]:bg-accent [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg [&>span:first-child>span]:bg-accent [&>span:first-child>span]:h-1.5"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}
