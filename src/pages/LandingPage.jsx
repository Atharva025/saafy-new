import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    Play,
    Music,
    Volume2,
    Crown,
    Sparkles,
    Heart,
    TrendingUp,
    ArrowRight,
    Star,
    Headphones,
    Waves,
    Zap,
    Shield,
    Check,
    ChevronDown,
    Github,
    Twitter,
    Instagram,
    User,
    Award,
    Music2,
    Radio,
    Disc3
} from 'lucide-react'
import MusicVisualizer from '@/components/ui/MusicVisualizer'
import FloatingCard from '@/components/ui/FloatingCard'
import { searchArtists } from '@/lib/api'

const LandingPage = () => {
    const navigate = useNavigate()
    const [isLoaded, setIsLoaded] = useState(false)
    const [currentFeature, setCurrentFeature] = useState(0)
    const [leftArtists, setLeftArtists] = useState([])
    const [rightArtists, setRightArtists] = useState([])
    const [artistsLoading, setArtistsLoading] = useState(true)
    const heroRef = useRef(null)
    const featuresRef = useRef(null)

    const { scrollYProgress } = useScroll()
    const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -100])

    // Famous artists from different languages
    const famousArtists = {
        hindi: ['Arijit Singh', 'Shreya Ghoshal', 'KK'],
        english: ['Ed Sheeran', 'Taylor Swift', 'The Weeknd'],
        punjabi: ['Diljit Dosanjh', 'Sidhu Moose Wala', 'Karan Aujla'],
        marathi: ['Ajay Atul', 'Shankar Mahadevan', 'Avadhoot Gupte']
    }

    useEffect(() => {
        setIsLoaded(true)
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % 3)
        }, 4000)

        // Fetch artists for floating elements
        fetchFloatingArtists()

        return () => clearInterval(interval)
    }, [])

    const fetchFloatingArtists = async () => {
        try {
            setArtistsLoading(true)

            // Get random artists from different languages
            const allArtists = [
                ...famousArtists.hindi,
                ...famousArtists.english,
                ...famousArtists.punjabi,
                ...famousArtists.marathi
            ]

            // Shuffle and select artists for left and right sides
            const shuffled = allArtists.sort(() => 0.5 - Math.random())
            const leftArtistNames = shuffled.slice(0, 6)
            const rightArtistNames = shuffled.slice(6, 12)

            // Fetch artist data with fixed positions for better distribution
            const leftArtistsData = await Promise.all(
                leftArtistNames.map(async (artistName, index) => {
                    try {
                        const result = await searchArtists(artistName, 0, 1)
                        const artist = result.data?.results?.[0]
                        if (artist) {
                            // Fixed positions for left side - evenly distributed
                            const leftPositions = [
                                { top: 15, left: 8, size: 90 },   // Top left
                                { top: 35, left: 18, size: 85 },  // Mid-upper left
                                { top: 25, left: 5, size: 95 },   // Upper left
                                { top: 55, left: 15, size: 88 },  // Mid-lower left
                                { top: 75, left: 6, size: 92 },   // Bottom left
                                { top: 45, left: 22, size: 87 }   // Mid left
                            ]

                            return {
                                ...artist,
                                position: {
                                    ...leftPositions[index],
                                    delay: 1.5 + index * 0.3
                                }
                            }
                        }
                        return null
                    } catch (error) {
                        console.error(`Error fetching ${artistName}:`, error)
                        return null
                    }
                })
            )

            const rightArtistsData = await Promise.all(
                rightArtistNames.map(async (artistName, index) => {
                    try {
                        const result = await searchArtists(artistName, 0, 1)
                        const artist = result.data?.results?.[0]
                        if (artist) {
                            // Fixed positions for right side - evenly distributed
                            const rightPositions = [
                                { top: 20, right: 6, size: 93 },   // Top right
                                { top: 12, right: 16, size: 88 },  // Upper right
                                { top: 40, right: 8, size: 90 },   // Mid-upper right
                                { top: 60, right: 18, size: 86 },  // Mid-lower right
                                { top: 30, right: 20, size: 91 },  // Mid right
                                { top: 80, right: 10, size: 89 }   // Bottom right
                            ]

                            return {
                                ...artist,
                                position: {
                                    ...rightPositions[index],
                                    delay: 2 + index * 0.3
                                }
                            }
                        }
                        return null
                    } catch (error) {
                        console.error(`Error fetching ${artistName}:`, error)
                        return null
                    }
                })
            )

            // Filter out null results and set state
            setLeftArtists(leftArtistsData.filter(artist => artist))
            setRightArtists(rightArtistsData.filter(artist => artist))

        } catch (error) {
            console.error('Error fetching floating artists:', error)
        } finally {
            setArtistsLoading(false)
        }
    }

    const features = [
        {
            icon: Heart,
            title: "High Quality Audio",
            description: "Experience crystal-clear 320kbps streaming quality that brings every note to life",
            gradient: "from-red-500 to-pink-500",
            demo: "🎵 320kbps Quality"
        },
        {
            icon: Shield,
            title: "Ad-Free Experience",
            description: "Enjoy uninterrupted music without any advertisements disturbing your flow",
            gradient: "from-green-500 to-emerald-500",
            demo: "🚫 No Interruptions"
        },
        {
            icon: TrendingUp,
            title: "Latest Releases",
            description: "Stay updated with the newest tracks and trending music from your favorite artists",
            gradient: "from-purple-500 to-indigo-500",
            demo: "🔥 Fresh Tracks"
        }
    ]

    const stats = [
        { number: "320", label: "kbps Quality", icon: Waves },
        { number: "100%", label: "Ad-Free", icon: Shield },
        { number: "2", label: "Core Features", icon: Star },
        { number: "∞", label: "Music Discovery", icon: Music2 }
    ]

    const testimonials = [
        {
            name: "Music Enthusiast",
            role: "Audiophile",
            content: "The audio quality is absolutely phenomenal. Every beat hits perfectly!",
            avatar: "🎧"
        },
        {
            name: "Daily Listener",
            role: "Power User",
            content: "Finally, a music player that focuses on what matters - great music, no distractions.",
            avatar: "🎵"
        },
        {
            name: "Trend Follower",
            role: "Music Explorer",
            content: "Love how I can discover new releases instantly. The interface is so smooth!",
            avatar: "🌟"
        }
    ]

    const musicNotes = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: i * 0.5,
        duration: 3 + Math.random() * 2,
        x: Math.random() * 100,
        size: 0.5 + Math.random() * 1
    }))

    return (
        <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-tertiary relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {musicNotes.map((note) => (
                    <motion.div
                        key={note.id}
                        className="absolute text-accent-primary/10"
                        style={{
                            left: `${note.x}%`,
                            fontSize: `${note.size}rem`
                        }}
                        animate={{
                            y: [-20, -100, -20],
                            rotate: [0, 360, 0],
                            opacity: [0, 0.3, 0]
                        }}
                        transition={{
                            duration: note.duration,
                            repeat: Infinity,
                            delay: note.delay,
                            ease: "easeInOut"
                        }}
                    >
                        <Music className="w-4 h-4 sm:w-6 sm:h-6" />
                    </motion.div>
                ))}
            </div>

            {/* Hero Section */}
            <motion.section
                ref={heroRef}
                className="relative min-h-screen flex items-center justify-center px-3 sm:px-4"
            >
                {/* Floating Artist Icons - Left Side */}
                <div className="absolute inset-0 hidden lg:block pointer-events-none">
                    {leftArtists.map((artist, index) => (
                        <motion.div
                            key={artist.id || index}
                            initial={{ opacity: 0, x: -100, scale: 0.3 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{
                                delay: artist.position.delay,
                                duration: 0.8,
                                type: "spring",
                                bounce: 0.4
                            }}
                            className="absolute pointer-events-auto"
                            style={{
                                top: `${artist.position.top}%`,
                                left: `${artist.position.left}%`,
                                width: `${artist.position.size}px`,
                                height: `${artist.position.size}px`
                            }}
                        >
                            <motion.div
                                animate={{
                                    y: [-8, 12, -8],
                                    rotate: [0, 3, -3, 0]
                                }}
                                transition={{
                                    duration: 4 + index * 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: index * 0.5
                                }}
                                className="relative group cursor-pointer w-full h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-accent-primary/30 group-hover:border-accent-primary/60 transition-all duration-300 bg-surface-primary">
                                    <img
                                        src={artist.image?.[2]?.url || artist.image?.[1]?.url || artist.image?.[0]?.url}
                                        alt={artist.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=7c3aed&color=fff&size=${artist.position.size}&bold=true`
                                        }}
                                    />
                                </div>

                                {/* Artist name tooltip */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ opacity: 1, scale: 1 }}
                                    className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 bg-background-primary/95 backdrop-blur-sm border border-surface-primary/50 rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg"
                                >
                                    <p className="text-sm font-semibold text-text-primary">{artist.name}</p>
                                    <p className="text-xs text-text-tertiary">
                                        {artist.followerCount ? `${Math.floor(artist.followerCount / 1000)}K followers` : 'Popular Artist'}
                                    </p>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* Floating Artist Icons - Right Side */}
                <div className="absolute inset-0 hidden lg:block pointer-events-none">
                    {rightArtists.map((artist, index) => (
                        <motion.div
                            key={artist.id || index}
                            initial={{ opacity: 0, x: 100, scale: 0.3 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{
                                delay: artist.position.delay,
                                duration: 0.8,
                                type: "spring",
                                bounce: 0.4
                            }}
                            className="absolute pointer-events-auto"
                            style={{
                                top: `${artist.position.top}%`,
                                right: `${artist.position.right}%`,
                                width: `${artist.position.size}px`,
                                height: `${artist.position.size}px`
                            }}
                        >
                            <motion.div
                                animate={{
                                    y: [12, -8, 12],
                                    rotate: [0, -4, 4, 0]
                                }}
                                transition={{
                                    duration: 4.5 + index * 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: index * 0.7
                                }}
                                className="relative group cursor-pointer w-full h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-secondary/20 to-purple-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-accent-secondary/30 group-hover:border-accent-secondary/60 transition-all duration-300 bg-surface-primary">
                                    <img
                                        src={artist.image?.[2]?.url || artist.image?.[1]?.url || artist.image?.[0]?.url}
                                        alt={artist.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=ec4899&color=fff&size=${artist.position.size}&bold=true`
                                        }}
                                    />
                                </div>

                                {/* Artist name tooltip */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ opacity: 1, scale: 1 }}
                                    className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 bg-background-primary/95 backdrop-blur-sm border border-surface-primary/50 rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg"
                                >
                                    <p className="text-sm font-semibold text-text-primary">{artist.name}</p>
                                    <p className="text-xs text-text-tertiary">
                                        {artist.followerCount ? `${Math.floor(artist.followerCount / 1000)}K followers` : 'Popular Artist'}
                                    </p>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* Loading state for artists */}
                {artistsLoading && (
                    <div className="absolute inset-0 hidden lg:block pointer-events-none">
                        {/* Left side loading - fixed positions */}
                        {[
                            { top: 15, left: 8, size: 90 },
                            { top: 35, left: 18, size: 85 },
                            { top: 25, left: 5, size: 95 },
                            { top: 55, left: 15, size: 88 },
                            { top: 75, left: 6, size: 92 },
                            { top: 45, left: 22, size: 87 }
                        ].map((pos, index) => (
                            <motion.div
                                key={`left-${index}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute bg-surface-primary/50 rounded-full animate-pulse"
                                style={{
                                    top: `${pos.top}%`,
                                    left: `${pos.left}%`,
                                    width: `${pos.size}px`,
                                    height: `${pos.size}px`
                                }}
                            />
                        ))}
                        {/* Right side loading - fixed positions */}
                        {[
                            { top: 20, right: 6, size: 93 },
                            { top: 12, right: 16, size: 88 },
                            { top: 40, right: 8, size: 90 },
                            { top: 60, right: 18, size: 86 },
                            { top: 30, right: 20, size: 91 },
                            { top: 80, right: 10, size: 89 }
                        ].map((pos, index) => (
                            <motion.div
                                key={`right-${index}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute bg-surface-primary/50 rounded-full animate-pulse"
                                style={{
                                    top: `${pos.top}%`,
                                    right: `${pos.right}%`,
                                    width: `${pos.size}px`,
                                    height: `${pos.size}px`
                                }}
                            />
                        ))}
                    </div>
                )}

                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-8 sm:mb-12"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                            className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6"
                        >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center">
                                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-text-primary">
                                Saafy Music
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="text-sm sm:text-base lg:text-lg text-text-secondary max-w-2xl mx-auto px-4"
                        >
                            Experience premium music streaming with 320kbps quality, zero ads, and instant access to the latest releases
                        </motion.p>
                    </motion.div>

                    {/* Simple CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="text-center space-y-6 sm:space-y-8"
                    >
                        {/* Main CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                            <motion.button
                                onClick={() => navigate('/app')}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto bg-gradient-primary hover:shadow-glow-lg text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group"
                            >
                                <Play className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
                                <span className="text-base sm:text-lg">Start Listening</span>
                            </motion.button>

                            <motion.button
                                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-accent-primary/50 rounded-xl sm:rounded-2xl text-accent-primary font-semibold text-base sm:text-lg hover:bg-accent-primary/10 transition-all duration-300"
                            >
                                Explore Features
                            </motion.button>
                        </div>

                        {/* Feature Tags */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="flex flex-wrap justify-center gap-3 sm:gap-4 px-4"
                        >
                            {[
                                { icon: Shield, text: "Ad-Free", color: "from-green-500 to-emerald-500" },
                                { icon: Waves, text: "320kbps Quality", color: "from-blue-500 to-cyan-500" },
                                { icon: TrendingUp, text: "Latest Releases", color: "from-purple-500 to-pink-500" }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-surface-primary/50 backdrop-blur-sm border border-surface-secondary/30 rounded-lg sm:rounded-xl"
                                >
                                    <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br ${feature.color} rounded-md sm:rounded-lg flex items-center justify-center`}>
                                        <feature.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-text-primary">{feature.text}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-accent-primary cursor-pointer"
                        onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <ChevronDown className="w-8 h-8" />
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* Features Section */}
            <motion.section
                ref={featuresRef}
                className="relative py-20 px-4"
            >
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-6xl font-heading font-bold text-text-primary mb-6">
                            Why Choose Saafy?
                        </h2>
                        <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                            We focus on delivering the essential features that matter most to music lovers
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        {features.map((feature, index) => (
                            <FloatingCard key={index} intensity={0.3}>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.2, duration: 0.8 }}
                                    className="group relative"
                                >
                                    <div className="bg-surface-primary/50 backdrop-blur-glass border border-surface-secondary/30 rounded-3xl p-8 h-full relative overflow-hidden">
                                        <motion.div
                                            className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                                        />

                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                            className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 relative`}
                                        >
                                            <feature.icon className="w-8 h-8 text-white" />
                                            <motion.div
                                                className="absolute inset-0 rounded-2xl"
                                                animate={{
                                                    boxShadow: [
                                                        "0 0 0 0 rgba(123, 95, 255, 0)",
                                                        "0 0 0 10px rgba(123, 95, 255, 0.1)",
                                                        "0 0 0 0 rgba(123, 95, 255, 0)"
                                                    ]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </motion.div>

                                        <h3 className="text-2xl font-bold text-text-primary mb-4 group-hover:text-accent-primary transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-text-secondary leading-relaxed mb-4">
                                            {feature.description}
                                        </p>

                                        {/* Interactive visualizer */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <MusicVisualizer isPlaying={true} className="h-8" />
                                        </div>

                                        {/* Floating particles on hover */}
                                        <motion.div
                                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Sparkles className="w-6 h-6 text-accent-primary" />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </FloatingCard>
                        ))}
                    </div>

                    {/* Stats Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="bg-gradient-to-br from-surface-primary/50 to-surface-secondary/30 backdrop-blur-glass border border-surface-secondary/30 rounded-3xl p-8 mb-20"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
                                    className="text-center"
                                >
                                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: index * 0.2 + 0.5 }}
                                        className="text-3xl font-bold text-accent-primary mb-2"
                                    >
                                        {stat.number}
                                    </motion.div>
                                    <div className="text-text-secondary text-sm">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Testimonials Section */}
            <motion.section className="relative py-20 px-4 bg-gradient-to-br from-surface-primary/30 to-transparent">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-6xl font-heading font-bold text-text-primary mb-6">
                            What Users Say
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <FloatingCard key={index} intensity={0.2}>
                                <motion.div
                                    initial={{ opacity: 0, x: index === 0 ? -50 : index === 2 ? 50 : 0, y: 50 }}
                                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ delay: index * 0.2, duration: 0.8 }}
                                    className="bg-surface-primary/50 backdrop-blur-glass border border-surface-secondary/30 rounded-3xl p-8 relative overflow-hidden group"
                                >
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            rotate: [0, 10, -10, 0]
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Infinity,
                                            delay: index * 0.5
                                        }}
                                        className="text-4xl mb-4"
                                    >
                                        {testimonial.avatar}
                                    </motion.div>
                                    <p className="text-text-secondary mb-6 italic">"{testimonial.content}"</p>
                                    <div>
                                        <div className="font-semibold text-text-primary">{testimonial.name}</div>
                                        <div className="text-text-tertiary text-sm">{testimonial.role}</div>
                                    </div>

                                    {/* Hover effect visualizer */}
                                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <MusicVisualizer isPlaying={true} className="h-6" />
                                    </div>
                                </motion.div>
                            </FloatingCard>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Final CTA Section */}
            <motion.section className="relative py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <FloatingCard intensity={0.8}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 backdrop-blur-glass border border-accent-primary/30 rounded-3xl p-12 relative overflow-hidden group"
                        >
                            {/* Animated background pattern */}
                            <div className="absolute inset-0 opacity-10">
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-32 h-32 border border-accent-primary/20 rounded-full"
                                        style={{
                                            top: `${Math.random() * 100}%`,
                                            left: `${Math.random() * 100}%`,
                                        }}
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.1, 0.3, 0.1],
                                            rotate: 360
                                        }}
                                        transition={{
                                            duration: 8 + i * 2,
                                            repeat: Infinity,
                                            delay: i * 1.5
                                        }}
                                    />
                                ))}
                            </div>

                            <h2 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-6 relative z-10">
                                Ready to Experience Premium Music?
                            </h2>
                            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto relative z-10">
                                Join thousands of music lovers who have already discovered the perfect balance of quality and simplicity.
                            </p>

                            {/* Enhanced music visualizer */}
                            <div className="flex justify-center mb-8 relative z-10">
                                <MusicVisualizer isPlaying={true} className="h-12" />
                            </div>

                            <motion.button
                                onClick={() => navigate('/app')}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative px-10 py-5 bg-gradient-primary rounded-2xl text-white font-bold text-xl shadow-glow-lg hover:shadow-glow-md transition-all duration-300 overflow-hidden z-10"
                            >
                                <motion.div
                                    className="absolute inset-0 bg-white/20"
                                    initial={{ scale: 0 }}
                                    whileHover={{ scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                />
                                <span className="relative flex items-center gap-3">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Crown className="w-6 h-6" />
                                    </motion.div>
                                    Launch Saafy Music Player
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                </span>
                            </motion.button>
                        </motion.div>
                    </FloatingCard>
                </div>
            </motion.section>

            {/* Footer */}
            <footer className="relative py-12 px-4 border-t border-surface-primary/30">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-3 mb-4 md:mb-0">
                            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-text-primary">Saafy</div>
                                <div className="text-text-tertiary text-sm">Premium Music Experience</div>
                            </div>
                        </div>

                        <div className="text-text-tertiary text-center">
                            <p className="mb-2">Made with ❤️ for music lovers</p>
                            <p className="text-sm">Version {import.meta.env.VITE_APP_VERSION || '2.0.0'}</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
