import React from 'react'
import { motion } from 'framer-motion'
import { Play, Heart, MoreHorizontal, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getOptimizedImageUrl, cleanText } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ArtistCard({ artist, onClick, className }) {
    const imageUrl = artist.image?.[2]?.url || artist.image?.[1]?.url || artist.image?.[0]?.url
    const hasValidImage = imageUrl && !imageUrl.includes('artist-default')

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn("group cursor-pointer w-full", className)}
            onClick={() => onClick?.(artist)}
        >
            <Card className="bg-surface-primary/30 backdrop-blur-glass border border-surface-secondary/30 hover:border-surface-secondary/50 transition-all duration-300 ease-out overflow-hidden rounded-xl sm:rounded-2xl hover:shadow-elevated group-hover:bg-surface-primary/50">
                <div className="relative">
                    {/* Artist Image */}
                    <div className="aspect-square bg-surface-secondary/50 overflow-hidden relative">
                        {hasValidImage ? (
                            <img
                                src={imageUrl}
                                alt={artist.name}
                                className="w-full h-full object-cover rounded-full p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300 ease-out"
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                }}
                            />
                        ) : null}

                        {/* Fallback for no image */}
                        <div
                            className={cn(
                                "w-full h-full flex items-center justify-center text-text-tertiary",
                                hasValidImage ? "hidden" : "flex"
                            )}
                            style={{ display: hasValidImage ? 'none' : 'flex' }}
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-secondary/20 flex items-center justify-center">
                                <User className="w-8 h-8 sm:w-10 sm:h-10" />
                            </div>
                        </div>
                    </div>

                    {/* Play Button Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-background-primary/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Button
                                size="icon"
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-primary hover:shadow-glow-md text-white border-0"
                            >
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>

                <CardContent className="p-3 sm:p-4 text-center">
                    {/* Artist Info */}
                    <div className="space-y-1 sm:space-y-2">
                        <h3 className="font-heading font-semibold text-text-primary text-xs sm:text-sm leading-tight line-clamp-2">
                            {cleanText(artist.name)}
                        </h3>
                        <p className="text-text-tertiary text-xs capitalize">
                            {artist.role || 'Artist'}
                        </p>
                        {artist.followerCount && (
                            <p className="text-text-tertiary text-xs">
                                <span className="hidden sm:inline">{formatFollowers(artist.followerCount)} followers</span>
                                <span className="sm:hidden">{formatFollowers(artist.followerCount)}</span>
                            </p>
                        )}
                    </div>

                    {/* Action Buttons - Always visible on mobile, hover on desktop */}
                    <motion.div
                        initial={{ opacity: 1 }}
                        className="flex items-center justify-center space-x-1 sm:space-x-2 mt-2 sm:mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-text-tertiary hover:text-accent-danger hover:bg-surface-primary/50 transition-all duration-200"
                            onClick={(e) => {
                                e.stopPropagation()
                                // Handle like artist
                            }}
                        >
                            <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-primary/50 transition-all duration-200"
                            onClick={(e) => {
                                e.stopPropagation()
                                // Handle more options
                            }}
                        >
                            <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                        </motion.button>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function formatFollowers(count) {
    if (!count) return '0'
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
    return `${(count / 1000000).toFixed(1)}M`
}
