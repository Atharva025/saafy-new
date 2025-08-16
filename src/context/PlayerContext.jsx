import { createContext, useContext, useReducer, useRef, useEffect } from 'react'
import { getSong } from '@/lib/api'

const PlayerContext = createContext()

const initialState = {
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: 0,
    volume: 0.7,
    progress: 0,
    duration: 0,
    repeatMode: 'none', // 'none', 'one', 'all'
    shuffleMode: false,
    originalQueue: [], // for shuffle mode
}

const playerReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CURRENT_SONG':
            return {
                ...state,
                currentSong: action.payload,
                progress: 0,
            }

        case 'SET_PLAYING':
            return {
                ...state,
                isPlaying: action.payload,
            }

        case 'SET_QUEUE':
            return {
                ...state,
                queue: action.payload,
                originalQueue: state.shuffleMode ? state.originalQueue : action.payload,
                currentIndex: 0,
            }

        case 'ADD_TO_QUEUE':
            return {
                ...state,
                queue: [...state.queue, action.payload],
                originalQueue: state.shuffleMode ?
                    [...state.originalQueue, action.payload] :
                    [...state.queue, action.payload],
            }

        case 'REMOVE_FROM_QUEUE':
            const newQueue = state.queue.filter((_, index) => index !== action.payload)
            const newOriginalQueue = state.shuffleMode ?
                state.originalQueue.filter((_, index) => index !== action.payload) :
                newQueue

            return {
                ...state,
                queue: newQueue,
                originalQueue: newOriginalQueue,
                currentIndex: action.payload < state.currentIndex ?
                    state.currentIndex - 1 :
                    state.currentIndex,
            }

        case 'SET_CURRENT_INDEX':
            return {
                ...state,
                currentIndex: action.payload,
                currentSong: state.queue[action.payload] || null,
            }

        case 'SET_VOLUME':
            return {
                ...state,
                volume: action.payload,
            }

        case 'SET_PROGRESS':
            return {
                ...state,
                progress: action.payload,
            }

        case 'SET_DURATION':
            return {
                ...state,
                duration: action.payload,
            }

        case 'SET_REPEAT_MODE':
            return {
                ...state,
                repeatMode: action.payload,
            }

        case 'TOGGLE_SHUFFLE':
            if (!state.shuffleMode) {
                // Enabling shuffle
                const shuffled = [...state.queue]
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1))
                        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
                }

                return {
                    ...state,
                    shuffleMode: true,
                    queue: shuffled,
                    originalQueue: state.queue,
                    currentIndex: shuffled.findIndex(song => song.id === state.currentSong?.id) || 0,
                }
            } else {
                // Disabling shuffle
                return {
                    ...state,
                    shuffleMode: false,
                    queue: state.originalQueue,
                    currentIndex: state.originalQueue.findIndex(song => song.id === state.currentSong?.id) || 0,
                }
            }

        default:
            return state
    }
}

export function PlayerProvider({ children }) {
    const [state, dispatch] = useReducer(playerReducer, initialState)
    const audioRef = useRef(null)

    // Ensure song.image is an array of objects with link/url at indexes 0..2
    function normalizeImageForSong(song) {
        if (!song) return song
        try {
            // Prefer existing image array
            let imgs = song.image
            // If single URL available, convert to array
            if (!imgs && song.imageUrl) {
                imgs = [{ link: song.imageUrl }, { link: song.imageUrl }, { link: song.imageUrl, url: song.imageUrl }]
            }

            if (typeof imgs === 'string') {
                imgs = [{ link: imgs }, { link: imgs }, { link: imgs, url: imgs }]
            }

            if (Array.isArray(imgs)) {
                // Normalize elements to objects with link/url
                const normalized = imgs.slice(0, 3).map((it) => {
                    if (!it) return { link: '' }
                    if (typeof it === 'string') return { link: it }
                    return { link: it.link || it.url || it.url || '', url: it.url || it.link || '' }
                })
                // Ensure length 3
                while (normalized.length < 3) normalized.push({ link: normalized[normalized.length - 1]?.link || '' })
                song.image = normalized
            } else if (!song.image && song.imageUrl) {
                song.image = [{ link: song.imageUrl }, { link: song.imageUrl }, { link: song.imageUrl, url: song.imageUrl }]
            }
        } catch (e) {
            // ignore
        }
        return song
    }

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => {
            dispatch({ type: 'SET_PROGRESS', payload: audio.currentTime })
        }

        const handleLoadedMetadata = () => {
            dispatch({ type: 'SET_DURATION', payload: audio.duration })
        }

        const handleEnded = () => {
            handleNext()
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [state.currentSong])

    // Actions
    const playSong = async (song, queue = null) => {
        console.log('🎵 Playing song:', song.name || song.title, 'ID:', song.id)
        console.log('🎵 Initial song object:', song)
        console.log('🎵 Song has download_url:', !!song.download_url)
        console.log('🎵 Song download_url value:', song.download_url)

        try {
            // First, try to get the full song details with download URL
            let songWithUrl = song
            if (!song.download_url) {
                console.log('📥 Fetching detailed song info for:', song.id)
                const songResponse = await getSong(song.id)
                console.log('📥 Detailed song API response:', songResponse)
                if (songResponse.success && songResponse.data) {
                    songWithUrl = songResponse.data
                    console.log('✅ Got detailed song data:', songWithUrl)
                    console.log('✅ Detailed song download_url:', songWithUrl.download_url)
                    console.log('✅ Detailed song downloadUrl:', songWithUrl.downloadUrl)
                } else {
                    console.log('⚠️ Failed to get detailed song data, using original')
                    console.log('⚠️ API response was:', songResponse)
                }
            } else {
                console.log('✅ Song already has download_url, skipping API call')
            }

            // Enhanced audio URL selection with quality priority
            let audioUrl = null

            // First, try to find high-quality downloadUrl array (highest quality last)
            if (songWithUrl.downloadUrl && Array.isArray(songWithUrl.downloadUrl) && songWithUrl.downloadUrl.length > 0) {
                // Get the highest quality URL (usually the last in array)
                const highQualityUrl = songWithUrl.downloadUrl[songWithUrl.downloadUrl.length - 1]
                audioUrl = highQualityUrl.url || highQualityUrl.link || highQualityUrl
                console.log('🎵 Using high-quality URL from downloadUrl array:', audioUrl)
            } else {
                // Fallback to other sources, prioritizing direct download URLs
                audioUrl = songWithUrl.download_url ||
                    songWithUrl.downloadUrl ||
                    songWithUrl.streamUrl ||
                    songWithUrl.url ||
                    songWithUrl.previewUrl

                console.log('🎵 Using fallback audio URL:', audioUrl)
            }

            if (!audioUrl) {
                console.error(`❌ Cannot play "${songWithUrl.name}" - No download_url available`)
                console.log('📋 Song object:', songWithUrl)
                console.log('Available song properties:', Object.keys(songWithUrl))
                console.log('download_url:', songWithUrl.download_url)
                console.log('downloadUrl:', songWithUrl.downloadUrl)
                console.log('streamUrl:', songWithUrl.streamUrl)
                console.log('url:', songWithUrl.url)
                return
            }

            console.log('🎶 Using audio URL:', audioUrl)

            if (queue) {
                // normalize images for all queue items
                const normalizedQueue = queue.map(q => normalizeImageForSong(q))
                dispatch({ type: 'SET_QUEUE', payload: normalizedQueue })
                const index = normalizedQueue.findIndex(s => s.id === song.id)
                dispatch({ type: 'SET_CURRENT_INDEX', payload: index >= 0 ? index : 0 })
            } else {
                const normalized = normalizeImageForSong(songWithUrl)
                dispatch({ type: 'SET_CURRENT_SONG', payload: normalized })
                if (!state.queue.find(s => s.id === normalized.id)) {
                    dispatch({ type: 'ADD_TO_QUEUE', payload: normalized })
                }
            }

            if (audioRef.current && audioUrl) {
                // Enhanced audio setup for high-quality playback
                console.log('🔍 Setting up high-quality audio playback...')

                // Configure audio element for best quality
                const audio = audioRef.current
                audio.crossOrigin = 'anonymous' // Enable CORS for external audio
                audio.preload = 'auto' // Preload audio for better performance

                // Add cache-busting parameter to avoid caching issues
                const cacheBuster = `?cb=${Date.now()}`
                const finalUrl = audioUrl.includes('?')
                    ? `${audioUrl}&cb=${Date.now()}`
                    : `${audioUrl}${cacheBuster}`

                audio.src = finalUrl
                audio.load() // Explicitly load the new source

                dispatch({ type: 'SET_PLAYING', payload: true })

                const playPromise = audio.play()
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('▶️ High-quality audio playing successfully')
                        })
                        .catch(error => {
                            console.error('❌ Error playing audio:', error.message)
                            console.log('🔗 Failed URL:', finalUrl)

                            // Try without cache buster
                            if (finalUrl.includes('cb=')) {
                                console.log('🔄 Retrying without cache buster...')
                                audio.src = audioUrl
                                audio.load()

                                audio.play().catch(retryError => {
                                    console.error('🔄 Retry also failed:', retryError.message)
                                    dispatch({ type: 'SET_PLAYING', payload: false })
                                })
                            } else {
                                dispatch({ type: 'SET_PLAYING', payload: false })
                            }
                        })
                }
            }
        } catch (error) {
            console.error('💥 Error in playSong:', error)
            dispatch({ type: 'SET_PLAYING', payload: false })
        }
    }

    const togglePlay = () => {
        if (!audioRef.current || !state.currentSong) return

        if (state.isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }

        dispatch({ type: 'SET_PLAYING', payload: !state.isPlaying })
    }

    const handleNext = () => {
        if (state.queue.length === 0) return

        let nextIndex

        if (state.repeatMode === 'one') {
            nextIndex = state.currentIndex
        } else if (state.currentIndex < state.queue.length - 1) {
            nextIndex = state.currentIndex + 1
        } else if (state.repeatMode === 'all') {
            nextIndex = 0
        } else {
            dispatch({ type: 'SET_PLAYING', payload: false })
            return
        }

        dispatch({ type: 'SET_CURRENT_INDEX', payload: nextIndex })
        const nextSong = state.queue[nextIndex]

        if (nextSong) {
            playSong(nextSong)
        }
    }

    const handlePrevious = () => {
        if (state.queue.length === 0) return

        // If more than 3 seconds have passed, restart current song
        if (state.progress > 3) {
            seekTo(0)
            return
        }

        let prevIndex

        if (state.currentIndex > 0) {
            prevIndex = state.currentIndex - 1
        } else if (state.repeatMode === 'all') {
            prevIndex = state.queue.length - 1
        } else {
            seekTo(0)
            return
        }

        dispatch({ type: 'SET_CURRENT_INDEX', payload: prevIndex })
        const prevSong = state.queue[prevIndex]

        if (prevSong) {
            playSong(prevSong)
        }
    }

    const setVolume = (volume) => {
        dispatch({ type: 'SET_VOLUME', payload: volume })
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }

    const seekTo = (time) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time
            dispatch({ type: 'SET_PROGRESS', payload: time })
        }
    }

    const toggleRepeat = () => {
        const modes = ['none', 'all', 'one']
        const currentModeIndex = modes.indexOf(state.repeatMode)
        const nextMode = modes[(currentModeIndex + 1) % modes.length]
        dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode })
    }

    const toggleShuffle = () => {
        dispatch({ type: 'TOGGLE_SHUFFLE' })
    }

    const addToQueue = (song) => {
        const normalized = normalizeImageForSong(song)
        dispatch({ type: 'ADD_TO_QUEUE', payload: normalized })
    }

    const removeFromQueue = (index) => {
        dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index })
    }

    const clearQueue = () => {
        dispatch({ type: 'SET_QUEUE', payload: [] })
        dispatch({ type: 'SET_CURRENT_SONG', payload: null })
        dispatch({ type: 'SET_PLAYING', payload: false })
    }

    const value = {
        ...state,
        audioRef,
        playSong,
        togglePlay,
        handleNext,
        handlePrevious,
        skipNext: handleNext,
        skipPrevious: handlePrevious,
        setVolume,
        seekTo,
        toggleRepeat,
        toggleShuffle,
        addToQueue,
        removeFromQueue,
        clearQueue,
    }

    return (
        <PlayerContext.Provider value={value}>
            {children}
            <audio
                ref={audioRef}
                preload="metadata"
                onPlay={() => dispatch({ type: 'SET_PLAYING', payload: true })}
                onPause={() => dispatch({ type: 'SET_PLAYING', payload: false })}
            />
        </PlayerContext.Provider>
    )
}

export const usePlayer = () => {
    const context = useContext(PlayerContext)
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider')
    }
    return context
}
