import { createContext, useContext, useReducer, useRef, useEffect } from 'react'
import { getSong } from '@/lib/api'

// ============================================================================
// PRODUCTION-SAFE LOGGER
// ============================================================================
const IS_DEV = import.meta.env.DEV

const log = {
    info: (...args) => IS_DEV && console.log(...args),
    warn: (...args) => IS_DEV && console.warn(...args),
    error: (...args) => IS_DEV && console.error(...args)
}

// ============================================================================
// CONTEXT & STATE
// ============================================================================

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
    originalQueue: [],
    error: null
}

// ============================================================================
// REDUCER
// ============================================================================

const playerReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CURRENT_SONG':
            return {
                ...state,
                currentSong: action.payload,
                progress: 0,
                error: null
            }

        case 'SET_PLAYING':
            return {
                ...state,
                isPlaying: action.payload
            }

        case 'SET_QUEUE':
            return {
                ...state,
                queue: action.payload,
                originalQueue: state.shuffleMode ? state.originalQueue : action.payload,
                currentIndex: 0
            }

        case 'ADD_TO_QUEUE': {
            // Prevent duplicate entries
            if (state.queue.find(s => s.id === action.payload.id)) {
                return state
            }
            return {
                ...state,
                queue: [...state.queue, action.payload],
                originalQueue: state.shuffleMode
                    ? [...state.originalQueue, action.payload]
                    : [...state.queue, action.payload]
            }
        }

        case 'REMOVE_FROM_QUEUE': {
            const newQueue = state.queue.filter((_, index) => index !== action.payload)
            const newOriginalQueue = state.shuffleMode
                ? state.originalQueue.filter((_, index) => index !== action.payload)
                : newQueue

            return {
                ...state,
                queue: newQueue,
                originalQueue: newOriginalQueue,
                currentIndex: action.payload < state.currentIndex
                    ? state.currentIndex - 1
                    : state.currentIndex
            }
        }

        case 'SET_CURRENT_INDEX':
            return {
                ...state,
                currentIndex: action.payload,
                currentSong: state.queue[action.payload] || null
            }

        case 'SET_VOLUME':
            return {
                ...state,
                volume: Math.max(0, Math.min(1, action.payload))
            }

        case 'SET_PROGRESS':
            return {
                ...state,
                progress: action.payload
            }

        case 'SET_DURATION':
            return {
                ...state,
                duration: action.payload
            }

        case 'SET_REPEAT_MODE':
            return {
                ...state,
                repeatMode: action.payload
            }

        case 'TOGGLE_SHUFFLE': {
            if (!state.shuffleMode) {
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
                    currentIndex: shuffled.findIndex(song => song.id === state.currentSong?.id) || 0
                }
            } else {
                return {
                    ...state,
                    shuffleMode: false,
                    queue: state.originalQueue,
                    currentIndex: state.originalQueue.findIndex(song => song.id === state.currentSong?.id) || 0
                }
            }
        }

        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                isPlaying: false
            }

        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            }

        default:
            return state
    }
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function PlayerProvider({ children }) {
    const [state, dispatch] = useReducer(playerReducer, initialState)
    const audioRef = useRef(null)

    /**
     * Normalize song image to consistent array format
     */
    function normalizeImageForSong(song) {
        if (!song) return song
        try {
            let imgs = song.image

            if (!imgs && song.imageUrl) {
                imgs = [{ link: song.imageUrl }, { link: song.imageUrl }, { link: song.imageUrl, url: song.imageUrl }]
            }

            if (typeof imgs === 'string') {
                imgs = [{ link: imgs }, { link: imgs }, { link: imgs, url: imgs }]
            }

            if (Array.isArray(imgs)) {
                const normalized = imgs.slice(0, 3).map((it) => {
                    if (!it) return { link: '' }
                    if (typeof it === 'string') return { link: it }
                    return { link: it.link || it.url || '', url: it.url || it.link || '' }
                })
                while (normalized.length < 3) {
                    normalized.push({ link: normalized[normalized.length - 1]?.link || '' })
                }
                song.image = normalized
            } else if (!song.image && song.imageUrl) {
                song.image = [{ link: song.imageUrl }, { link: song.imageUrl }, { link: song.imageUrl, url: song.imageUrl }]
            }
        } catch {
            // Silent fail - image normalization is non-critical
        }
        return song
    }

    /**
     * Extract best audio URL from song object
     */
    function extractAudioUrl(song) {
        if (!song) return null

        // Try downloadUrl array (highest quality last)
        if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
            const highQuality = song.downloadUrl[song.downloadUrl.length - 1]
            return highQuality?.url || highQuality?.link || null
        }

        // Fallback chain
        return song.download_url || song.streamUrl || song.url || song.previewUrl || null
    }

    // ============================================================================
    // AUDIO EVENT HANDLERS
    // ============================================================================

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

        const handleError = (e) => {
            log.error('Audio error:', e)
            dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio' })
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
        }
    }, [state.currentSong])

    // ============================================================================
    // PLAYER ACTIONS
    // ============================================================================

    const playSong = async (song, queue = null) => {
        if (!song?.id) {
            log.warn('Invalid song object')
            return
        }

        log.info('Playing:', song.name || song.title)

        try {
            dispatch({ type: 'CLEAR_ERROR' })

            let songWithUrl = song

            // Fetch full song details if no download URL
            if (!extractAudioUrl(song)) {
                log.info('Fetching song details for:', song.id)
                const response = await getSong(song.id)
                if (response.success && response.data) {
                    songWithUrl = response.data
                }
            }

            const audioUrl = extractAudioUrl(songWithUrl)

            if (!audioUrl) {
                dispatch({ type: 'SET_ERROR', payload: `Cannot play "${songWithUrl.name}" - no audio available` })
                return
            }

            // Update queue if provided
            if (queue) {
                const normalizedQueue = queue.map(normalizeImageForSong)
                dispatch({ type: 'SET_QUEUE', payload: normalizedQueue })
                const index = normalizedQueue.findIndex(s => s.id === song.id)
                dispatch({ type: 'SET_CURRENT_INDEX', payload: index >= 0 ? index : 0 })
            } else {
                const normalized = normalizeImageForSong(songWithUrl)
                dispatch({ type: 'SET_CURRENT_SONG', payload: normalized })
                dispatch({ type: 'ADD_TO_QUEUE', payload: normalized })
            }

            // Setup and play audio
            if (audioRef.current) {
                const audio = audioRef.current
                audio.crossOrigin = 'anonymous'
                audio.preload = 'auto'
                audio.src = audioUrl
                audio.load()

                dispatch({ type: 'SET_PLAYING', payload: true })

                try {
                    await audio.play()
                    log.info('Playback started')
                } catch (playError) {
                    log.warn('Playback failed:', playError.message)
                    dispatch({ type: 'SET_PLAYING', payload: false })
                }
            }
        } catch (error) {
            log.error('playSong error:', error)
            dispatch({ type: 'SET_ERROR', payload: 'Failed to play song' })
        }
    }

    const togglePlay = () => {
        if (!audioRef.current || !state.currentSong) return

        if (state.isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(() => {
                dispatch({ type: 'SET_PLAYING', payload: false })
            })
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

        // Restart if more than 3 seconds played
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
        const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0))
        dispatch({ type: 'SET_VOLUME', payload: safeVolume })
        if (audioRef.current) {
            audioRef.current.volume = safeVolume
        }
    }

    const seekTo = (time) => {
        if (audioRef.current && !isNaN(time)) {
            audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration))
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
        if (!song?.id) return
        const normalized = normalizeImageForSong(song)
        dispatch({ type: 'ADD_TO_QUEUE', payload: normalized })
    }

    const removeFromQueue = (index) => {
        if (typeof index !== 'number' || index < 0) return
        dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index })
    }

    const clearQueue = () => {
        dispatch({ type: 'SET_QUEUE', payload: [] })
        dispatch({ type: 'SET_CURRENT_SONG', payload: null })
        dispatch({ type: 'SET_PLAYING', payload: false })
    }

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' })
    }

    // ============================================================================
    // CONTEXT VALUE
    // ============================================================================

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
        clearError
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

// ============================================================================
// HOOK
// ============================================================================

export const usePlayer = () => {
    const context = useContext(PlayerContext)
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider')
    }
    return context
}
