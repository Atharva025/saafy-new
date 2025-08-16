import React from 'react'
import { Play, Heart, MoreHorizontal, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayer } from '@/context/PlayerContext'
import { getOptimizedImageUrl, formatDuration, cleanText } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function SongListItem({ song, index, showIndex = true, className }) {
    const { playSong, currentSong, isPlaying, addToQueue } = usePlayer()

    // Debug: Log component render
    console.log(`🎵 SongListItem rendering for song:`, song?.name, 'Index:', index)
    console.log(`🎵 SongListItem props:`, { song, index, showIndex, className })

    // Basic safety check
    if (!song) {
        console.error('❌ SongListItem: No song provided')
        return <div className="text-red-500">Error: No song data</div>
    }

    if (!song.name) {
        console.error('❌ SongListItem: Song missing name:', song)
        return <div className="text-red-500">Error: Song missing name</div>
    }

    const isCurrentSong = currentSong?.id === song.id

    const handlePlay = () => {
        playSong(song)
    }

    const handleAddToQueue = (e) => {
        e.stopPropagation()
        addToQueue(song)
    }

    return (
        <div
            className={cn(
                "group flex items-center space-x-3 p-2.5 rounded-xl hover:bg-background-secondary transition-all duration-200 cursor-pointer border border-white",
                isCurrentSong && "bg-background-secondary border-white",
                className
            )}
            onClick={handlePlay}
        >
            {/* Index/Play Button */}
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
                {showIndex && !isCurrentSong ? (
                    <span className="text-gray-400 text-sm group-hover:hidden">
                        {index + 1}
                    </span>
                ) : null}

                <Button
                    variant="ghost"
                    size="icon"
                    className={`w-8 h-8 ${showIndex ? 'hidden group-hover:flex' : 'flex'} ${isCurrentSong ? 'flex' : ''
                        } items-center justify-center hover:bg-accent`}
                >
                    <Play className={`w-4 h-4 ${isCurrentSong && isPlaying ? 'text-accent' : 'text-text-primary'}`} />
                </Button>
            </div>

            {/* Song Image */}
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-background-secondary flex-shrink-0">
                <img
                    src={getOptimizedImageUrl(song.image?.[1]?.link, 'small')}
                    alt={song.name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Song Info */}
            <div className="flex-1 min-w-0">
                <h3 className={cn(
                    "font-heading font-medium text-[13px] truncate",
                    isCurrentSong ? 'text-accent' : 'text-text-primary'
                )}>
                    {cleanText(song.name)}
                </h3>
                <p className="text-text-secondary text-[11px] truncate">
                    {cleanText(song.primaryArtists)}
                </p>
            </div>

            {/* Album Info (Desktop) */}
            {song.album?.name && (
                <div className="hidden md:block flex-1 min-w-0">
                    <p className="text-text-secondary text-[11px] truncate">
                        {cleanText(song.album.name)}
                    </p>
                </div>
            )}

            {/* Duration */}
            <div className="text-text-secondary text-[11px] flex-shrink-0 flex items-center space-x-3">
                <span>
                    {formatDuration(song.duration)}
                </span>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1 opacity-100 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-text-secondary hover:text-accent"
                        onClick={handleAddToQueue}
                    >
                        <Heart className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-text-secondary hover:text-text-primary"
                    >
                        <MoreHorizontal className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
