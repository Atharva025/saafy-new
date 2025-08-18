import React from 'react'
import { Play, Heart, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getOptimizedImageUrl, truncateText, cleanText } from '@/lib/utils'

export default function AlbumCard({ album, onClick }) {
    return (
        <Card className="group bg-background-secondary/80 hover:bg-background-secondary border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-200 ease-out cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl w-full">
            <div onClick={() => onClick?.(album)} className="relative">
                {/* Album Cover */}
                <div className="aspect-square bg-background-secondary overflow-hidden">
                    <img
                        src={getOptimizedImageUrl(album.image?.[2]?.link, 'medium')}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200 ease-out"
                    />
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out flex items-center justify-center">
                    <Button
                        size="icon"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent text-gray-900 hover:bg-accent/90 shadow-lg"
                    >
                        <Play className="w-4 h-4 sm:w-6 sm:h-6 ml-0.5" />
                    </Button>
                </div>
            </div>

            <CardContent className="p-2.5 sm:p-3.5">
                {/* Album Info */}
                <div className="space-y-0.5 sm:space-y-1">
                    <h3 className="font-heading font-semibold tracking-wide text-text-primary text-xs sm:text-sm leading-tight line-clamp-2">
                        {cleanText(album.name)}
                    </h3>
                    <p className="text-text-secondary text-xs truncate">
                        {cleanText(album.primaryArtists || album.subtitle)}
                    </p>
                    {album.year && (
                        <p className="text-text-secondary/70 text-xs">
                            {album.year}
                        </p>
                    )}
                </div>

                {/* Action Buttons - Hidden on very small screens, show on hover for larger screens */}
                <div className="flex items-center justify-between mt-2 sm:mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon" className="w-5 h-5 sm:w-6 sm:h-6 text-text-secondary hover:text-text-primary">
                            <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-5 h-5 sm:w-6 sm:h-6 text-text-secondary hover:text-text-primary">
                            <MoreHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </Button>
                    </div>

                    {album.songCount && (
                        <span className="text-xs text-text-secondary/70">
                            <span className="hidden sm:inline">{album.songCount} songs</span>
                            <span className="sm:hidden">{album.songCount}</span>
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
