import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Calendar, Music } from 'lucide-react'
import NewReleases from '@/components/music/NewReleases'

export default function NewReleasesPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto pt-20 pb-24"
        >
            <div className="max-w-7xl mx-auto p-6">
                {/* Premium Header Section */}
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
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-md">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-heading font-bold text-text-primary leading-tight">
                                    New Releases
                                </h1>
                                <p className="text-text-secondary">
                                    Discover the latest and hottest tracks
                                </p>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-surface-primary/30 rounded-xl p-4 border border-surface-secondary/20"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-accent-primary" />
                                    </div>
                                    <div>
                                        <p className="text-text-primary font-semibold">Fresh Tracks</p>
                                        <p className="text-text-tertiary text-sm">Updated daily</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-surface-primary/30 rounded-xl p-4 border border-surface-secondary/20"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent-secondary/20 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-accent-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-text-primary font-semibold">This Week</p>
                                        <p className="text-text-tertiary text-sm">Latest releases</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-surface-primary/30 rounded-xl p-4 border border-surface-secondary/20"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent-warning/20 flex items-center justify-center">
                                        <Music className="w-4 h-4 text-accent-warning" />
                                    </div>
                                    <div>
                                        <p className="text-text-primary font-semibold">High Quality</p>
                                        <p className="text-text-tertiary text-sm">320kbps audio</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* New Releases Content */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <NewReleases />
                </motion.div>
            </div>
        </motion.div>
    )
}
