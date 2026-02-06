import { createContext, useContext, useReducer, useRef, useEffect, useState } from 'react'
import { getSong, addSongToRecommender, getRecommendations } from '@/lib/api'
import { getForYouMix } from '@/lib/discovery'
import { addToSessionPlayedSongs, hasBeenPlayedInSession } from '@/utils/sessionStorage'

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
    queue: [], // Upcoming songs
    history: [], // Previously played songs
    originalQueue: [], // For shuffle/unshuffle
    volume: 0.7,
    progress: 0,
    duration: 0,
    repeatMode: 'none', // 'none', 'one', 'all'
    shuffleMode: false,
    contextQueue: [], // The source playlist/album that was played
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

        case 'PLAY_NOW': {
            // Play a song immediately, add it to history
            const { song, context } = action.payload
            return {
                ...state,
                currentSong: song,
                history: state.currentSong ? [...state.history, state.currentSong] : state.history,
                queue: context || state.queue,
                contextQueue: context || state.contextQueue,
                progress: 0,
                error: null
            }
        }

        case 'PLAY_CONTEXT': {
            // Play from a playlist/album context
            const { songs, startIndex = 0 } = action.payload
            const currentSong = songs[startIndex]
            const upcomingSongs = songs.slice(startIndex + 1)

            return {
                ...state,
                currentSong,
                queue: upcomingSongs,
                contextQueue: songs,
                originalQueue: state.shuffleMode ? state.originalQueue : upcomingSongs,
                history: [],
                progress: 0,
                error: null
            }
        }

        case 'ADD_TO_QUEUE': {
            // Add song after current song (Spotify behavior)
            const song = action.payload
            if (state.queue.find(s => s.id === song.id)) {
                return state // Already in queue
            }
            return {
                ...state,
                queue: [song, ...state.queue],
                originalQueue: state.shuffleMode ? [...state.originalQueue, song] : [song, ...state.queue]
            }
        }

        case 'ADD_TO_END': {
            // Add song to end of queue
            const song = action.payload
            if (state.queue.find(s => s.id === song.id)) {
                return state
            }
            return {
                ...state,
                queue: [...state.queue, song],
                originalQueue: state.shuffleMode ? [...state.originalQueue, song] : [...state.queue, song]
            }
        }

        case 'REMOVE_FROM_QUEUE': {
            const index = action.payload
            return {
                ...state,
                queue: state.queue.filter((_, i) => i !== index),
                originalQueue: state.shuffleMode
                    ? state.originalQueue.filter((_, i) => i !== index)
                    : state.queue.filter((_, i) => i !== index)
            }
        }

        case 'PLAY_NEXT': {
            // Move to next song in queue
            if (state.queue.length === 0) {
                return state
            }

            const [nextSong, ...remainingQueue] = state.queue

            return {
                ...state,
                currentSong: nextSong,
                queue: remainingQueue,
                history: state.currentSong ? [...state.history, state.currentSong] : state.history,
                progress: 0
            }
        }

        case 'PLAY_PREVIOUS': {
            // Go back in history
            if (state.history.length === 0) {
                return state
            }

            const previousSong = state.history[state.history.length - 1]
            const newHistory = state.history.slice(0, -1)

            return {
                ...state,
                currentSong: previousSong,
                queue: state.currentSong ? [state.currentSong, ...state.queue] : state.queue,
                history: newHistory,
                progress: 0
            }
        }

        case 'EXTEND_QUEUE': {
            // Add songs to queue (for auto-continue)
            const newSongs = action.payload
            const existingIds = new Set(state.queue.map(s => s?.id))
            const uniqueSongs = newSongs.filter(s => s?.id && !existingIds.has(s.id))

            if (uniqueSongs.length === 0) return state

            return {
                ...state,
                queue: [...state.queue, ...uniqueSongs],
                originalQueue: state.shuffleMode
                    ? [...state.originalQueue, ...uniqueSongs]
                    : [...state.queue, ...uniqueSongs]
            }
        }

        case 'CLEAR_QUEUE':
            return {
                ...state,
                queue: [],
                originalQueue: []
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
                // Enable shuffle
                const shuffled = [...state.queue]
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
                }

                return {
                    ...state,
                    shuffleMode: true,
                    originalQueue: state.queue,
                    queue: shuffled
                }
            } else {
                // Disable shuffle
                return {
                    ...state,
                    shuffleMode: false,
                    queue: state.originalQueue,
                    originalQueue: []
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
    const autoQueueingRef = useRef(false)

    // Recommendations state
    const [recommendations, setRecommendations] = useState([])
    const [recommendationsLoading, setRecommendationsLoading] = useState(false)
    const [currentRecommendedSongId, setCurrentRecommendedSongId] = useState(null)

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

    const promoteSongToFront = (queue, song) => {
        if (!song?.id) return queue
        const rest = queue.filter((item) => item?.id !== song.id)
        return [song, ...rest]
    }

    const appendUnique = (queue, songs) => {
        const ids = new Set(queue.map((s) => s?.id))
        const uniqueAdds = songs.filter((s) => s?.id && !ids.has(s.id))
        return [...queue, ...uniqueAdds]
    }

    const extendQueueIfNeeded = async () => {
        if (autoQueueingRef.current) return
        if (state.queue.length > 3) return // Don't extend if we still have songs

        autoQueueingRef.current = true

        try {
            const mix = await getForYouMix(12)
            if (mix?.songs?.length) {
                const normalized = mix.songs.map(normalizeImageForSong)
                dispatch({ type: 'EXTEND_QUEUE', payload: normalized })
            }
        } catch (error) {
            log.warn('Auto-queue fetch failed:', error?.message || error)
        } finally {
            autoQueueingRef.current = false
        }
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
    // UPDATE PAGE TITLE WITH CURRENT SONG
    // ============================================================================

    useEffect(() => {
        const defaultTitle = 'Saafy - Music Experience'

        if (state.currentSong && state.isPlaying) {
            const songName = state.currentSong.name || state.currentSong.title || 'Unknown Song'
            const artist = state.currentSong.primaryArtists || 'Unknown Artist'
            document.title = `${songName} - ${artist}`
        } else if (state.currentSong) {
            const songName = state.currentSong.name || state.currentSong.title || 'Unknown Song'
            document.title = `${songName} (Paused) - Saafy`
        } else {
            document.title = defaultTitle
        }

        return () => {
            document.title = defaultTitle
        }
    }, [state.currentSong, state.isPlaying])

    // ============================================================================
    // RECOMMENDATION SYSTEM
    // ============================================================================

    /**
     * Fetch recommendations for a given song
     */
    const fetchRecommendations = async (songId) => {
        if (!songId) return

        setRecommendationsLoading(true)
        setCurrentRecommendedSongId(songId)

        try {
            log.info('Fetching recommendations for song:', songId)
            const response = await getRecommendations(songId, 10)

            if (response.success && response.recommendations) {
                log.info(`Fetching full details for ${response.recommendations.length} recommendations`)

                // Fetch full song details for each recommendation
                const fullSongs = await Promise.all(
                    response.recommendations.map(async (rec) => {
                        try {
                            const songResponse = await getSong(rec.song_id)
                            if (songResponse.success && songResponse.data) {
                                // Normalize image format and add recommendation score
                                const normalizedSong = normalizeImageForSong(songResponse.data)
                                return {
                                    ...normalizedSong,
                                    recommendationScore: rec.score
                                }
                            }
                            return null
                        } catch (error) {
                            log.warn('Failed to fetch song:', rec.song_id, error)
                            return null
                        }
                    })
                )

                // Filter out any failed fetches and ensure all have proper image format
                const validSongs = fullSongs.filter(song => song !== null)

                // Double-check image quality - log any issues
                validSongs.forEach(song => {
                    if (!song.image?.[0]?.link) {
                        log.warn('Recommendation missing high-quality image:', song.name, song.id)
                    }
                })

                setRecommendations(validSongs)
                log.info(`Loaded ${validSongs.length} full recommendations with images`)
            } else {
                log.warn('No recommendations available:', response.error)
                setRecommendations([])
            }
        } catch (error) {
            log.error('Failed to fetch recommendations:', error)
            setRecommendations([])
        } finally {
            setRecommendationsLoading(false)
        }
    }

    /**
     * Handle song playback - add to recommender & fetch recommendations
     * This runs EVERY time a song is played, regardless of session history
     */
    const handleSongPlayback = async (song) => {
        if (!song?.id) return

        log.info('🎵 Processing song playback:', song.name || song.title, `(${song.id})`)

        // Add to session storage tracking array
        const sessionSongs = addToSessionPlayedSongs(song.id)
        log.info('📝 Session songs count:', sessionSongs.length)
        log.info('📝 All session song IDs:', sessionSongs)

        // ALWAYS add song to recommender backend (every play, not just first time)
        // Note: This is non-blocking - if it fails, recommendations will still work
        try {
            const songName = song.name || song.title || ''
            // Get first artist if multiple artists are listed
            let artist = song.primaryArtists || ''
            if (!artist && song.artists?.[0]?.name) {
                artist = song.artists[0].name
            }
            // If multiple artists, take the first one
            if (artist.includes(',')) {
                artist = artist.split(',')[0].trim()
            }

            if (songName && artist) {
                log.info('📤 Adding to recommender DB:', songName, 'by', artist)
                const result = await addSongToRecommender(songName, artist)
                if (result.success) {
                    log.info('✅ Successfully added to recommender DB:', result.data)
                } else {
                    log.warn('⚠️ Failed to add to recommender (non-critical):', result.error)
                    if (result.status === 404) {
                        log.warn('💡 Tip: The /add-song endpoint may not be deployed yet. Check your HuggingFace space.')
                    }
                }
            } else {
                log.warn('⚠️ Missing song name or artist:', { songName, artist, song })
            }
        } catch (error) {
            log.error('❌ Error adding song to recommender (non-critical):', error)
        }

        // Fetch recommendations for this song
        log.info('🔍 Fetching recommendations for:', song.id)
        await fetchRecommendations(song.id)
    }

    // ============================================================================
    // PLAYER ACTIONS
    // ============================================================================

    const playSong = async (song, context = null) => {
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

            const normalizedSong = normalizeImageForSong(songWithUrl)

            // If context provided (playlist/album), set up the queue properly
            if (context && Array.isArray(context)) {
                const normalizedContext = context.map(normalizeImageForSong)
                const songIndex = normalizedContext.findIndex(s => s.id === normalizedSong.id)

                dispatch({
                    type: 'PLAY_CONTEXT',
                    payload: {
                        songs: normalizedContext,
                        startIndex: songIndex >= 0 ? songIndex : 0
                    }
                })
            } else {
                // Single song play - just add current song
                dispatch({
                    type: 'PLAY_NOW',
                    payload: { song: normalizedSong, context: null }
                })
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

                    // Track song in session and fetch recommendations (await to ensure completion)
                    await handleSongPlayback(normalizedSong)
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

    const handleNext = async () => {
        if (state.repeatMode === 'one' && state.currentSong) {
            // Repeat current song
            if (audioRef.current) {
                audioRef.current.currentTime = 0
                audioRef.current.play()
            }
            return
        }

        // Check if we need to extend queue
        await extendQueueIfNeeded()

        if (state.queue.length === 0) {
            // No more songs in queue
            if (state.repeatMode === 'all' && state.contextQueue.length > 0) {
                // Loop back to start of context
                playSong(state.contextQueue[0], state.contextQueue)
            } else {
                // Stop playing
                dispatch({ type: 'SET_PLAYING', payload: false })
                if (audioRef.current) {
                    audioRef.current.pause()
                }
            }
            return
        }

        // Play next song and update queue
        const nextSong = state.queue[0]
        dispatch({ type: 'PLAY_NEXT' })

        // Setup audio for next song
        const audioUrl = extractAudioUrl(nextSong)
        if (audioUrl && audioRef.current) {
            const audio = audioRef.current
            audio.src = audioUrl
            audio.load()

            try {
                await audio.play()
                dispatch({ type: 'SET_PLAYING', payload: true })

                // Track song in session and fetch recommendations
                await handleSongPlayback(nextSong)
            } catch (error) {
                log.warn('Failed to play next song:', error)
                dispatch({ type: 'SET_PLAYING', payload: false })
            }
        }
    }

    const handlePrevious = () => {
        // Restart if more than 3 seconds played
        if (state.progress > 3) {
            seekTo(0)
            return
        }

        // Go back in history
        if (state.history.length === 0) {
            seekTo(0)
            return
        }

        const previousSong = state.history[state.history.length - 1]
        dispatch({ type: 'PLAY_PREVIOUS' })

        // Setup audio for previous song
        const audioUrl = extractAudioUrl(previousSong)
        if (audioUrl && audioRef.current) {
            const audio = audioRef.current
            audio.src = audioUrl
            audio.load()

            audio.play().then(() => {
                // Track song in session and fetch recommendations
                handleSongPlayback(previousSong)
            }).catch(error => {
                log.warn('Failed to play previous song:', error)
                dispatch({ type: 'SET_PLAYING', payload: false })
            })
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
        dispatch({ type: 'CLEAR_QUEUE' })
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
        clearError,
        // Recommendations
        recommendations,
        recommendationsLoading,
        currentRecommendedSongId,
        fetchRecommendations
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
