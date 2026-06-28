import { createContext, useContext, useReducer, useRef, useEffect, useState, useCallback } from 'react'
import { getSong, addSongToRecommender, getRecommendations, searchSongs } from '@/lib/api'
import { getForYouMix } from '@/lib/discovery'
import { encryptedGetItem, encryptedSetItem } from '@/lib/encryption'
import { addToSessionPlayedSongs, hasBeenPlayedInSession } from '@/utils/sessionStorage'
import { updateTray, registerMediaControlHandler } from '@/lib/electron'
import { extractDominantColor } from '@/utils/colorExtractor'
import { cacheSong, getCachedSong } from '@/lib/offlineCache'
import { useTheme } from '@/context/ThemeContext'
import { adjustColorForTheme } from '@/lib/utils'


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

const getSafeLocalStorage = (key, fallback) => {
    try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : fallback
    } catch {
        return fallback
    }
}

const getInitialState = () => {
    const currentSong = getSafeLocalStorage('saafy_current_song', null)
    const queue = getSafeLocalStorage('saafy_queue', [])
    
    let volume = 0.7
    try {
        const storedVolume = localStorage.getItem('saafy_volume')
        if (storedVolume !== null) {
            volume = parseFloat(storedVolume)
            if (isNaN(volume)) volume = 0.7
        }
    } catch {}

    const repeatMode = localStorage.getItem('saafy_repeat_mode') || 'none'
    const shuffleMode = localStorage.getItem('saafy_shuffle_mode') === 'true'

    return {
        currentSong,
        isPlaying: false,
        queue,
        history: [], // Previously played songs
        originalQueue: [], // For shuffle/unshuffle
        volume,
        progress: 0,
        duration: 0,
        repeatMode,
        shuffleMode,
        contextQueue: [], // The source playlist/album that was played
        error: null
    }
}

const initialState = getInitialState()

const appendUnique = (list, newItems) => {
    const existingIds = new Set(list.map(s => s.id))
    const unique = newItems.filter(s => !existingIds.has(s.id))
    return [...list, ...unique]
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

        case 'UPDATE_CURRENT_SONG':
            return {
                ...state,
                currentSong: action.payload
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
            // Append song to the end of the queue
            const song = action.payload
            if (state.queue.find(s => s.id === song.id)) {
                return state // Already in queue
            }
            return {
                ...state,
                queue: [...state.queue, song],
                originalQueue: state.shuffleMode ? [...state.originalQueue, song] : [...state.queue, song]
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

        case 'EXTEND_QUEUE': {
            // For autoplay queue extension
            return {
                ...state,
                queue: appendUnique(state.queue, action.payload),
                originalQueue: state.shuffleMode 
                    ? appendUnique(state.originalQueue, action.payload) 
                    : appendUnique(state.queue, action.payload)
            }
        }

        case 'REMOVE_FROM_QUEUE': {
            const songId = action.payload
            return {
                ...state,
                queue: state.queue.filter(song => song.id !== songId),
                originalQueue: state.originalQueue.filter(song => song.id !== songId)
            }
        }

        case 'REORDER_QUEUE':
            return {
                ...state,
                queue: action.payload
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

        case 'CLEAR_QUEUE':
            return {
                ...state,
                queue: [],
                originalQueue: []
            }

        case 'SET_VOLUME':
            return {
                ...state,
                volume: action.payload
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

// Helper to generate a synthetic impulse response for convolution reverb
function createReverbImpulseResponse(audioContext, type) {
    let duration = 2.5;
    let decay = 2.0;
    
    if (type === 'Cozy Room') {
        duration = 0.8;
        decay = 0.6;
    } else if (type === 'Concert Hall') {
        duration = 2.5;
        decay = 1.8;
    } else if (type === 'Cathedral') {
        duration = 5.0;
        decay = 4.0;
    } else if (type === 'Deep Cave') {
        duration = 4.0;
        decay = 3.5;
    }
    
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const decayFactor = Math.exp(-i / (sampleRate * decay));
        left[i] = (Math.random() * 2 - 1) * decayFactor;
        right[i] = (Math.random() * 2 - 1) * decayFactor;
    }
    return impulse;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function PlayerProvider({ children }) {
    const { isDark } = useTheme()
    const [state, dispatch] = useReducer(playerReducer, initialState)
    const audioRef = useRef(null)
    const autoQueueingRef = useRef(false)
    const defaultFaviconRef = useRef(null)
    const defaultFaviconTypeRef = useRef(null)

    // Refs to store the latest action handlers to prevent stale closure issues in event listeners
    const togglePlayRef = useRef(null)
    const handleNextRef = useRef(null)
    const handlePreviousRef = useRef(null)


    // Recommendations state
    const [recommendations, setRecommendations] = useState([])
    const [recommendationsLoading, setRecommendationsLoading] = useState(false)
    const [currentRecommendedSongId, setCurrentRecommendedSongId] = useState(null)

    // Playlist system state
    const [playlists, setPlaylists] = useState([])
    const [playlistsLoading, setPlaylistsLoading] = useState(false)
    
    // DSP & Audio Effects state / refs
    const eqFiltersRef = useRef([])
    const convolverNodeRef = useRef(null)
    const dryGainRef = useRef(null)
    const wetGainRef = useRef(null)
    const vocalReducerNodeRef = useRef(null)
    const audioContextRef = useRef(null)
    const analyserRef = useRef(null)
    const [analyserNode, setAnalyserNode] = useState(null)

    const [vocalReducerEnabled, setVocalReducerEnabled] = useState(() => {
        return getSafeLocalStorage('saafy_dsp_vocal_reducer', false)
    })
    
    const [eqGains, setEqGains] = useState(() => {
        return getSafeLocalStorage('saafy_dsp_eq_gains', [0, 0, 0, 0, 0])
    })
    const [eqPreset, setEqPresetState] = useState(() => {
        return getSafeLocalStorage('saafy_dsp_eq_preset', 'Flat')
    })
    
    const [reverbEnabled, setReverbEnabled] = useState(() => {
        return getSafeLocalStorage('saafy_dsp_reverb_enabled', false)
    })
    const [reverbMix, setReverbMix] = useState(() => {
        return getSafeLocalStorage('saafy_dsp_reverb_mix', 0.3)
    })
    const [reverbType, setReverbType] = useState(() => {
        return getSafeLocalStorage('saafy_dsp_reverb_type', 'Concert Hall')
    })
    
    // Premium Settings
    const [settings, setSettings] = useState(() => {
        return getSafeLocalStorage('saafy_settings_premium', {
            dynamicAccent: true,
            smartAutoplay: true
        })
    })

    // Playlist loop context state
    const [playlistLoopSongs, setPlaylistLoopSongs] = useState(null)

    // Dominant color extraction for dynamic backdrop color sync
    const [dominantColor, setDominantColor] = useState(null)

    // Listening History state
    const [listeningHistory, setListeningHistory] = useState([])

    // Fullscreen Immersive Playback Mode state
    const [isImmersiveOpen, setIsImmersiveOpen] = useState(false)

    // Setup visualizer analyser logic safely
    const initAudioAnalyser = useCallback(() => {
        if (analyserRef.current) return
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext
            if (!AudioContextClass) return

            const audioContext = new AudioContextClass()
            const analyser = audioContext.createAnalyser()

            // Connect element source
            const source = audioContext.createMediaElementSource(audioRef.current)
            
            // 1. Equalizer Filters
            const frequencies = [60, 230, 910, 4000, 14000]
            const filters = frequencies.map((freq, i) => {
                const filter = audioContext.createBiquadFilter()
                filter.frequency.value = freq
                if (freq === 60) {
                    filter.type = 'lowshelf'
                } else if (freq === 14000) {
                    filter.type = 'highshelf'
                } else {
                    filter.type = 'peaking'
                    filter.Q.value = 1.0
                }
                filter.gain.value = eqGains[i] || 0
                return filter
            })
            eqFiltersRef.current = filters

            // Connect source to EQ chain
            let currentConnection = source
            filters.forEach(filter => {
                currentConnection.connect(filter)
                currentConnection = filter
            })

            // 2. Vocal Reducer (Karaoke) Setup
            const vrDirectGain = audioContext.createGain()
            const vrProcessedGain = audioContext.createGain()
            
            const splitter = audioContext.createChannelSplitter(2)
            const leftGain = audioContext.createGain()
            const rightGain = audioContext.createGain()
            const sumGain = audioContext.createGain()
            const merger = audioContext.createChannelMerger(2)
            
            rightGain.gain.value = -1.0
            sumGain.gain.value = 0.5 // prevent clipping
            
            currentConnection.connect(vrDirectGain)
            currentConnection.connect(splitter)
            
            splitter.connect(leftGain, 0)
            splitter.connect(rightGain, 1)
            leftGain.connect(sumGain)
            rightGain.connect(sumGain)
            sumGain.connect(merger, 0, 0)
            sumGain.connect(merger, 0, 1)
            merger.connect(vrProcessedGain)
            
            vrDirectGain.gain.value = vocalReducerEnabled ? 0.0 : 1.0
            vrProcessedGain.gain.value = vocalReducerEnabled ? 1.4 : 0.0 // slight boost to balance lost elements
            
            vocalReducerNodeRef.current = { vrDirectGain, vrProcessedGain }

            const vrMixNode = audioContext.createGain()
            vrDirectGain.connect(vrMixNode)
            vrProcessedGain.connect(vrMixNode)
            
            currentConnection = vrMixNode

            // 3. Spatial Reverb Setup
            const convolver = audioContext.createConvolver()
            const dryGain = audioContext.createGain()
            const wetGain = audioContext.createGain()
            
            convolverNodeRef.current = convolver
            dryGainRef.current = dryGain
            wetGainRef.current = wetGain
            
            convolver.buffer = createReverbImpulseResponse(audioContext, reverbType)
            
            const mixVal = reverbMix
            dryGain.gain.value = reverbEnabled ? (1.0 - mixVal) : 1.0
            wetGain.gain.value = reverbEnabled ? mixVal * 1.5 : 0.0
            
            currentConnection.connect(dryGain)
            currentConnection.connect(convolver)
            convolver.connect(wetGain)
            
            const reverbMixNode = audioContext.createGain()
            dryGain.connect(reverbMixNode)
            wetGain.connect(reverbMixNode)
            
            currentConnection = reverbMixNode

            // Connect final output to analyser and destination
            currentConnection.connect(analyser)
            analyser.connect(audioContext.destination)

            analyserRef.current = analyser
            setAnalyserNode(analyser)
            audioContextRef.current = audioContext
            log.info('✅ Global Audio Analyser successfully initialized with DSP pipeline')
        } catch (err) {
            log.error('❌ Failed to initialize Web Audio Analyser with DSP:', err)
        }
    }, [setAnalyserNode, eqGains, vocalReducerEnabled, reverbEnabled, reverbMix, reverbType])

    const resumeAudioContext = useCallback(async () => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            try {
                await audioContextRef.current.resume()
                log.info('🔊 AudioContext resumed successfully')
            } catch (err) {
                log.warn('Failed to resume AudioContext:', err)
            }
        }
    }, [])

    const setEqGain = useCallback((index, gain) => {
        setEqGains(prev => {
            const next = [...prev]
            next[index] = gain
            localStorage.setItem('saafy_dsp_eq_gains', JSON.stringify(next))
            if (eqFiltersRef.current[index]) {
                eqFiltersRef.current[index].gain.value = gain
            }
            return next
        })
    }, [])

    const setEqPreset = useCallback((presetName) => {
        setEqPresetState(presetName)
        localStorage.setItem('saafy_dsp_eq_preset', presetName)
        
        let gains = [0, 0, 0, 0, 0]
        if (presetName === 'Bass Boost') {
            gains = [6, 4, 0, 0, -2]
        } else if (presetName === 'Vocal Boost') {
            gains = [-2, 0, 5, 4, 1]
        } else if (presetName === 'Acoustic') {
            gains = [4, 1, 2, 3, 2]
        } else if (presetName === 'Treble Boost') {
            gains = [-3, -1, 1, 4, 7]
        } // Flat is all 0
        
        setEqGains(gains)
        localStorage.setItem('saafy_dsp_eq_gains', JSON.stringify(gains))
        
        gains.forEach((gain, i) => {
            if (eqFiltersRef.current[i]) {
                eqFiltersRef.current[i].gain.value = gain
            }
        })
    }, [])

    const toggleReverb = useCallback(() => {
        setReverbEnabled(prev => {
            const next = !prev
            localStorage.setItem('saafy_dsp_reverb_enabled', String(next))
            if (dryGainRef.current && wetGainRef.current) {
                const mixVal = reverbMix
                dryGainRef.current.gain.value = next ? (1.0 - mixVal) : 1.0
                wetGainRef.current.gain.value = next ? mixVal * 1.5 : 0.0
            }
            return next
        })
    }, [reverbMix])

    const setReverbMixValue = useCallback((mixVal) => {
        setReverbMix(mixVal)
        localStorage.setItem('saafy_dsp_reverb_mix', String(mixVal))
        if (dryGainRef.current && wetGainRef.current && reverbEnabled) {
            dryGainRef.current.gain.value = 1.0 - mixVal
            wetGainRef.current.gain.value = mixVal * 1.5
        }
    }, [reverbEnabled])

    const updateReverbType = useCallback((type) => {
        setReverbType(type)
        localStorage.setItem('saafy_dsp_reverb_type', type)
        if (convolverNodeRef.current && audioContextRef.current) {
            const buffer = createReverbImpulseResponse(audioContextRef.current, type)
            convolverNodeRef.current.buffer = buffer
        }
    }, [])

    const toggleVocalReducer = useCallback(() => {
        setVocalReducerEnabled(prev => {
            const next = !prev
            localStorage.setItem('saafy_dsp_vocal_reducer', String(next))
            if (vocalReducerNodeRef.current) {
                const { vrDirectGain, vrProcessedGain } = vocalReducerNodeRef.current
                vrDirectGain.gain.value = next ? 0.0 : 1.0
                vrProcessedGain.gain.value = next ? 1.4 : 0.0
            }
            return next
        })
    }, [])

    const togglePremiumSetting = useCallback((key) => {
        setSettings(prev => {
            const next = { ...prev, [key]: !prev[key] }
            localStorage.setItem('saafy_settings_premium', JSON.stringify(next))
            return next
        })
    }, [])

    // Persist volume, repeat, shuffle and state changes in localStorage
    useEffect(() => {
        try {
            if (state.currentSong) {
                localStorage.setItem('saafy_current_song', JSON.stringify(state.currentSong))
            } else {
                localStorage.removeItem('saafy_current_song')
            }
        } catch {}
    }, [state.currentSong])

    useEffect(() => {
        try {
            localStorage.setItem('saafy_queue', JSON.stringify(state.queue))
        } catch {}
    }, [state.queue])

    useEffect(() => {
        try {
            localStorage.setItem('saafy_volume', String(state.volume))
        } catch {}
    }, [state.volume])

    useEffect(() => {
        try {
            localStorage.setItem('saafy_repeat_mode', state.repeatMode)
        } catch {}
    }, [state.repeatMode])

    useEffect(() => {
        try {
            localStorage.setItem('saafy_shuffle_mode', String(state.shuffleMode))
        } catch {}
    }, [state.shuffleMode])

    // Prime the audio element on mount if a song was persisted
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = state.volume
            if (state.currentSong) {
                const url = extractAudioUrl(state.currentSong)
                if (url) {
                    audioRef.current.src = url
                    audioRef.current.load()
                }
            }
        }
    }, [])

    const loadListeningHistory = useCallback((userId) => {
        const id = userId || 'guest'
        const key = `listening_history_${id}`
        try {
            const history = encryptedGetItem(key, [])
            setListeningHistory(Array.isArray(history) ? history : [])
        } catch {
            setListeningHistory([])
        }
    }, [setListeningHistory])

    useEffect(() => {
        const user = encryptedGetItem('saafy_user', null)
        const userId = user ? (user.id || user._id) : 'guest'
        loadListeningHistory(userId)
    }, [])

    useEffect(() => {
        const song = state.currentSong
        if (!song) {
            setDominantColor(null)
            return
        }

        const imageUrl = song.image?.[2]?.link || song.image?.[2]?.url ||
                         song.image?.[1]?.link || song.image?.[1]?.url ||
                         song.image?.[0]?.link || song.image?.[0]?.url ||
                         song.imageUrl || ''
                         
        if (!imageUrl) {
            setDominantColor(null)
            return
        }

        let active = true
        extractDominantColor(imageUrl).then(color => {
            if (active) {
                setDominantColor(color)
            }
        })

        return () => {
            active = false
        }
    }, [state.currentSong])

    useEffect(() => {
        if (settings.dynamicAccent && dominantColor) {
            const adjusted = adjustColorForTheme(dominantColor, isDark)
            const hex = adjusted?.hex || dominantColor.hex
            const rgba = (alpha) => adjusted?.rgba(alpha) || dominantColor.rgba(alpha)
            
            document.documentElement.style.setProperty('--color-accent', hex)
            document.documentElement.style.setProperty('--color-accent-hover', rgba(0.85))
            document.documentElement.style.setProperty('--color-accent-active', rgba(0.70))
            document.documentElement.style.setProperty('--color-accent-subtle', rgba(0.12))
            document.documentElement.style.setProperty('--color-accent-border', rgba(0.22))
        } else {
            document.documentElement.style.removeProperty('--color-accent')
            document.documentElement.style.removeProperty('--color-accent-hover')
            document.documentElement.style.removeProperty('--color-accent-active')
            document.documentElement.style.removeProperty('--color-accent-subtle')
            document.documentElement.style.removeProperty('--color-accent-border')
        }
        
        return () => {
            document.documentElement.style.removeProperty('--color-accent')
            document.documentElement.style.removeProperty('--color-accent-hover')
            document.documentElement.style.removeProperty('--color-accent-active')
            document.documentElement.style.removeProperty('--color-accent-subtle')
            document.documentElement.style.removeProperty('--color-accent-border')
        }
    }, [dominantColor, settings.dynamicAccent, isDark])


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

        // Try downloadUrl array (highest quality select)
        if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
            let highestItem = song.downloadUrl[0]
            let highestBitrate = 0
            for (const item of song.downloadUrl) {
                const qualityStr = item.quality || ''
                const match = qualityStr.match(/(\d+)/)
                if (match) {
                    const bitrate = parseInt(match[1], 10)
                    if (bitrate > highestBitrate) {
                        highestBitrate = bitrate
                        highestItem = item
                    }
                }
            }
            return highestItem?.url || highestItem?.link || null
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
        if (state.queue.length > 0) return // Only extend if queue is completely empty

        autoQueueingRef.current = true

        try {
            let tracksToAppend = []
            
            if (settings.smartAutoplay && state.currentSong?.id) {
                log.info('🧠 Smart Autoplay: Fetching recommendations for song:', state.currentSong.id)
                const response = await getRecommendations(state.currentSong.id, 10)
                if (response.success && response.recommendations && response.recommendations.length > 0) {
                    const fullSongs = await Promise.all(
                        response.recommendations.map(async (rec) => {
                            try {
                                const songResponse = await getSong(rec.song_id)
                                if (songResponse.success && songResponse.data) {
                                    return normalizeImageForSong(songResponse.data)
                                }
                            } catch (e) {}
                            return null
                        })
                    )
                    tracksToAppend = fullSongs.filter(song => song !== null)
                    log.info(`🧠 Smart Autoplay resolved ${tracksToAppend.length} recommendations`)
                }
            }
            
            // Fallback to general mix if no smart recommendations found
            if (tracksToAppend.length === 0) {
                log.info('🧠 Smart Autoplay: Falling back to general For You Mix')
                const mix = await getForYouMix(12)
                if (mix?.songs?.length) {
                    tracksToAppend = mix.songs.map(normalizeImageForSong)
                }
            }

            if (tracksToAppend.length > 0) {
                dispatch({ type: 'EXTEND_QUEUE', payload: tracksToAppend })
            }
        } catch (error) {
            log.warn('Auto-queue fetch failed:', error?.message || error)
        } finally {
            autoQueueingRef.current = false
        }
    }

    // ============================================================================
    // PLAYLIST ACTIONS
    // ============================================================================

    const loadPlaylists = useCallback(async (userId) => {
        if (!userId) {
            setPlaylists([])
            return
        }
        setPlaylistsLoading(true)
        try {
            const response = await fetch(`/api/playlists?userId=${userId}`)
            const data = await response.json()
            if (data.success) {
                setPlaylists(data.playlists)
            }
        } catch (error) {
            log.error('Failed to load playlists:', error)
        } finally {
            setPlaylistsLoading(false)
        }
    }, [setPlaylists, setPlaylistsLoading])

    const createPlaylist = useCallback(async (userId, name, image = null) => {
        if (!userId || !name) return false
        try {
            const response = await fetch('/api/playlists/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, name, image })
            })
            const data = await response.json()
            if (data.success) {
                await loadPlaylists(userId)
                return data.playlist
            }
            return false
        } catch (error) {
            log.error('Failed to create playlist:', error)
            return false
        }
    }, [loadPlaylists])

    const updatePlaylist = useCallback(async (userId, playlistId, name, image = null) => {
        if (!userId || !playlistId) return false
        try {
            const response = await fetch('/api/playlists/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, playlistId, name, image })
            })
            const data = await response.json()
            if (data.success) {
                await loadPlaylists(userId)
                return data.playlist
            }
            return false
        } catch (error) {
            log.error('Failed to update playlist:', error)
            return false
        }
    }, [loadPlaylists])

    const deletePlaylist = useCallback(async (userId, playlistId) => {
        if (!userId || !playlistId) return false
        try {
            const response = await fetch('/api/playlists/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, playlistId })
            })
            const data = await response.json()
            if (data.success) {
                await loadPlaylists(userId)
                return true
            }
            return false
        } catch (error) {
            log.error('Failed to delete playlist:', error)
            return false
        }
    }, [loadPlaylists])

    const addSongToPlaylist = useCallback(async (userId, playlistId, song) => {
        if (!userId || !playlistId || !song) return { success: false, error: 'Invalid parameters' }
        try {
            const response = await fetch('/api/playlists/add-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, playlistId, song })
            })
            const data = await response.json()
            if (data.success) {
                await loadPlaylists(userId)
                return { success: true, playlist: data.playlist }
            }
            return { success: false, error: data.error || 'Failed to add song' }
        } catch (error) {
            log.error('Failed to add song to playlist:', error)
            return { success: false, error: 'Network error occurred' }
        }
    }, [loadPlaylists])

    const removeSongFromPlaylist = useCallback(async (userId, playlistId, songId) => {
        if (!userId || !playlistId || !songId) return false
        try {
            const response = await fetch('/api/playlists/remove-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, playlistId, songId })
            })
            const data = await response.json()
            if (data.success) {
                await loadPlaylists(userId)
                return true
            }
            return false
        } catch (error) {
            log.error('Failed to remove song from playlist:', error)
            return false
        }
    }, [loadPlaylists])

    const importSpotifyPlaylist = useCallback(async (userId, playlistUrl) => {
        if (!userId || !playlistUrl) return { success: false, error: 'User ID and Playlist URL are required' }
        try {
            const response = await fetch('/api/playlists/import-spotify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, playlistUrl })
            })
            const data = await response.json()
            if (data.success) {
                await loadPlaylists(userId)
                return { success: true, playlist: data.playlist }
            }
            return { success: false, error: data.error || 'Failed to import playlist' }
        } catch (error) {
            log.error('Failed to import Spotify playlist:', error)
            return { success: false, error: 'Network error occurred' }
        }
    }, [loadPlaylists])

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
            handleNextRef.current?.()
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
    }, [])

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
    // DYNAMIC FAVICON BASED ON PLAYING SONG
    // ============================================================================

    useEffect(() => {
        const faviconLink = document.querySelector("link[rel*='icon']")
        if (faviconLink && !defaultFaviconRef.current) {
            defaultFaviconRef.current = faviconLink.getAttribute('href') || '/logo.svg'
            defaultFaviconTypeRef.current = faviconLink.getAttribute('type') || 'image/svg+xml'
        }
    }, [])

    useEffect(() => {
        const faviconLink = document.querySelector("link[rel*='icon']")
        if (!faviconLink) return

        let active = true

        if (state.currentSong) {
            const imageUrl = state.currentSong.image?.[0]?.link || 
                             state.currentSong.image?.[1]?.link || 
                             state.currentSong.image?.[2]?.link || 
                             state.currentSong.imageUrl || ''
            
            if (imageUrl) {
                const img = new Image()
                img.src = imageUrl
                img.onload = () => {
                    if (active) {
                        faviconLink.setAttribute('href', imageUrl)
                        faviconLink.setAttribute('type', 'image/jpeg')
                    }
                }
                img.onerror = () => {
                    if (active && defaultFaviconRef.current) {
                        faviconLink.setAttribute('href', defaultFaviconRef.current)
                        faviconLink.setAttribute('type', defaultFaviconTypeRef.current || 'image/svg+xml')
                    }
                }
            } else {
                if (defaultFaviconRef.current) {
                    faviconLink.setAttribute('href', defaultFaviconRef.current)
                    faviconLink.setAttribute('type', defaultFaviconTypeRef.current || 'image/svg+xml')
                }
            }
        } else {
            if (defaultFaviconRef.current) {
                faviconLink.setAttribute('href', defaultFaviconRef.current)
                faviconLink.setAttribute('type', defaultFaviconTypeRef.current || 'image/svg+xml')
            }
        }

        return () => {
            active = false
        }
    }, [state.currentSong])

    // ============================================================================
    // RECOMMENDATION SYSTEM
    // ============================================================================

    /**
     * Fetch recommendations for a given song
     */
    const fetchRecommendations = useCallback(async (songId) => {
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
                    if (!song.image?.[2]?.link) {
                        log.warn('Recommendation missing high-quality image:', song.name, song.id)
                    }
                })

                if (validSongs.length > 0) {
                    setRecommendations(validSongs)
                    log.info(`Loaded ${validSongs.length} full recommendations with images`)
                } else {
                    log.info('No valid recommendations found, keeping discovery mode')
                    setRecommendations([])
                }
            } else {
                // Silently handle - song not in recommendations DB is normal
                log.info('Song not in recommendations database, keeping discovery content')
                setRecommendations([])
            }
        } catch (error) {
            log.info('Recommendations unavailable, showing discovery content')
            setRecommendations([])
        } finally {
            setRecommendationsLoading(false)
        }
    }, [setRecommendationsLoading, setCurrentRecommendedSongId, setRecommendations])

    /**
     * Handle song playback - add to recommender & fetch recommendations
     * This runs EVERY time a song is played, regardless of session history
     */
    const handleSongPlayback = useCallback(async (song) => {
        if (!song?.id) return

        // Add song to user-specific listening history in localStorage and state
        try {
            const user = encryptedGetItem('saafy_user', null)
            const userId = user ? (user.id || user._id) : 'guest'
            const key = `listening_history_${userId}`
            
            let history = []
            try {
                const existing = encryptedGetItem(key, [])
                history = Array.isArray(existing) ? existing : []
            } catch (err) {
                log.warn('Failed to read listening history from storage:', err)
            }
            
            // Normalize song format for history
            const songWithTime = {
                id: String(song.id),
                name: song.name || song.title || 'Unknown',
                title: song.title || song.name || 'Unknown',
                primaryArtists: song.primaryArtists || 'Unknown Artist',
                image: song.image,
                duration: Number(song.duration) || 0,
                album: song.album || {},
                playedAt: Date.now()
            }
            
            const filtered = history.filter(s => String(s.id) !== String(song.id))
            const updated = [songWithTime, ...filtered].slice(0, 10)
            encryptedSetItem(key, updated)
            setListeningHistory(updated)
        } catch (storageErr) {
            log.error('Failed to save to listening history in PlayerContext:', storageErr)
        }

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

        // Auto-cache this song in the background for offline playback
        const audioUrl = song.url || extractAudioUrl(song)
        if (navigator.onLine && audioUrl && !audioUrl.startsWith('data:') && !audioUrl.startsWith('blob:')) {
            const songToCache = {
                ...song,
                url: audioUrl
            }
            log.info('📥 Auto-caching song in the background:', song.name || song.title)
            cacheSong(songToCache).then(success => {
                if (success) {
                    log.info('✅ Song successfully auto-cached:', song.name || song.title)
                } else {
                    log.warn('⚠️ Auto-caching failed for:', song.name || song.title)
                }
            }).catch(cacheError => {
                log.error('❌ Auto-caching error:', cacheError)
            })
        }

        // Fetch recommendations for this song
        log.info('🔍 Fetching recommendations for:', song.id)
        await fetchRecommendations(song.id)
    }, [setListeningHistory, fetchRecommendations])

    const resolveSongDetails = useCallback(async (song) => {
        if (!song) return null
        
        // Check offline cache first
        try {
            const cachedSong = await getCachedSong(song.id)
            if (cachedSong) {
                let audioUrl = null
                if (cachedSong.audioData) {
                    audioUrl = cachedSong.audioData
                } else if (cachedSong.audioBlob) {
                    audioUrl = URL.createObjectURL(cachedSong.audioBlob)
                }

                if (audioUrl) {
                    log.info('Resolved song from offline cache:', song.id)
                    return {
                        ...song,
                        name: song.name || cachedSong.name,
                        primaryArtists: song.primaryArtists || cachedSong.artist,
                        image: song.image || cachedSong.image,
                        url: audioUrl,
                        isOfflineCached: true
                    }
                }
            }
        } catch (cacheErr) {
            log.warn('Offline cache resolve failed:', cacheErr)
        }

        // If it already has an audio URL, return it directly
        if (extractAudioUrl(song)) {
            return song
        }

        log.info('Lazy resolving song details for:', song.id || song.name)
        
        try {
            let resolved = null

            // 1. If it's a standard JioSaavn ID (doesn't start with spotify:)
            if (song.id && typeof song.id === 'string' && !song.id.startsWith('spotify:')) {
                const response = await getSong(song.id)
                if (response.success && response.data) {
                    resolved = response.data
                }
            }

            // 2. If it's a Spotify ID or JioSaavn lookup failed, search fallback
            if (!resolved) {
                const searchTitle = song.name || song.title || ''
                const searchArtist = song.primaryArtists || ''
                if (searchTitle) {
                    const searchResult = await searchSongs(`${searchTitle} ${searchArtist}`, 0, 1)
                    if (searchResult.success && searchResult.data?.results?.[0]) {
                        resolved = searchResult.data.results[0]
                    }
                }
            }

            if (resolved) {
                // Keep the original ID to ensure correct queue and playback states match
                return {
                    ...resolved,
                    id: song.id // preserve the playlist's original ID (spotify:xxx or other)
                }
            }
        } catch (err) {
            log.warn('Failed to resolve song details:', err)
        }

        return song // fallback to the original song object
    }, [])

    // ============================================================================
    // PLAYER ACTIONS
    // ============================================================================

    const setVolume = useCallback((volume) => {
        const safeVolume = Math.max(0, Math.min(1, Number(volume) || 0))
        dispatch({ type: 'SET_VOLUME', payload: safeVolume })
        if (audioRef.current) {
            audioRef.current.volume = safeVolume
        }
    }, [])

    const seekTo = useCallback((time) => {
        if (audioRef.current && !isNaN(time)) {
            audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration))
            dispatch({ type: 'SET_PROGRESS', payload: time })
        }
    }, [state.duration])

    const toggleRepeat = useCallback(() => {
        const modes = ['none', 'all', 'one']
        const currentModeIndex = modes.indexOf(state.repeatMode)
        const nextMode = modes[(currentModeIndex + 1) % modes.length]
        dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode })
    }, [state.repeatMode])

    const toggleShuffle = useCallback(() => {
        dispatch({ type: 'TOGGLE_SHUFFLE' })
    }, [])

    const addToQueue = useCallback((song) => {
        if (!song?.id) return
        const normalized = normalizeImageForSong(song)
        dispatch({ type: 'ADD_TO_QUEUE', payload: normalized })
    }, [])

    const removeFromQueue = useCallback((index) => {
        if (typeof index !== 'number' || index < 0) return
        dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index })
    }, [])

    const reorderQueue = useCallback((startIndex, endIndex) => {
        if (typeof startIndex !== 'number' || typeof endIndex !== 'number') return
        dispatch({ type: 'REORDER_QUEUE', payload: { startIndex, endIndex } })
    }, [])

    const clearQueue = useCallback(() => {
        dispatch({ type: 'CLEAR_QUEUE' })
    }, [])

    const clearError = useCallback(() => {
        dispatch({ type: 'CLEAR_ERROR' })
    }, [])

    const playSong = useCallback(async (song, context = null) => {
        if (!song?.id) {
            log.warn('Invalid song object')
            return
        }

        log.info('Playing:', song.name || song.title)

        try {
            dispatch({ type: 'CLEAR_ERROR' })

            // Lazy resolve details if no audio URL is present
            const songWithUrl = await resolveSongDetails(song)

            const audioUrl = extractAudioUrl(songWithUrl)

            if (!audioUrl) {
                dispatch({ type: 'SET_ERROR', payload: `Cannot play "${songWithUrl.name}" - no audio available` })
                return
            }

            const normalizedSong = normalizeImageForSong(songWithUrl)

            // Update playlist loop songs
            if (context && Array.isArray(context) && context.length > 0) {
                setPlaylistLoopSongs(context)
            } else {
                setPlaylistLoopSongs(null)
            }

            // CHANGE: Always play single song only - context is ignored
            // Users must manually add songs to queue using "Add to Queue" option
            dispatch({
                type: 'PLAY_NOW',
                payload: { song: normalizedSong, context: null }
            })

            // Setup and play audio
            if (audioRef.current) {
                const audio = audioRef.current
                audio.crossOrigin = 'anonymous'
                audio.preload = 'auto'
                audio.src = audioUrl
                audio.load()

                initAudioAnalyser()
                resumeAudioContext()

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
    }, [dispatch, resolveSongDetails, setPlaylistLoopSongs, initAudioAnalyser, resumeAudioContext, handleSongPlayback])

    const togglePlay = useCallback(() => {
        if (!audioRef.current || !state.currentSong) return

        initAudioAnalyser()
        resumeAudioContext()

        if (state.isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(() => {
                dispatch({ type: 'SET_PLAYING', payload: false })
            })
        }

        dispatch({ type: 'SET_PLAYING', payload: !state.isPlaying })
    }, [dispatch, state.isPlaying, state.currentSong, initAudioAnalyser, resumeAudioContext])

    const handleNext = useCallback(async () => {
        if (state.repeatMode === 'one' && state.currentSong) {
            // Repeat current song
            if (audioRef.current) {
                audioRef.current.currentTime = 0
                audioRef.current.play()
            }
            return
        }

        // Playlist loop context takes highest precedence
        if (playlistLoopSongs && playlistLoopSongs.length > 0) {
            const remainingSongs = playlistLoopSongs.filter(s => s.id !== state.currentSong?.id)
            const nextRandomSong = remainingSongs.length > 0
                ? remainingSongs[Math.floor(Math.random() * remainingSongs.length)]
                : playlistLoopSongs[0]
            log.info('Playlist loop active - playing next random song from playlist:', nextRandomSong.name)
            await playSong(nextRandomSong, playlistLoopSongs)
            return
        }

        // Check if we need to extend queue (disabled as per user request to prevent random songs from polluting the queue)
        // await extendQueueIfNeeded()

        if (state.queue.length === 0) {
            // No more songs in queue - play a random song for continuous playback
            log.info('Queue empty - fetching random song for continuous playback')

            try {
                // Try to get a random song from recommendations first
                if (recommendations.length > 0) {
                    const randomRec = recommendations[Math.floor(Math.random() * recommendations.length)]
                    log.info('Playing random recommendation:', randomRec.name)
                    await playSong(randomRec)
                    return
                }

                // Fallback: Fetch a For You mix and play a random song
                const mix = await getForYouMix(10)
                if (mix?.songs?.length > 0) {
                    const randomSong = mix.songs[Math.floor(Math.random() * mix.songs.length)]
                    log.info('Playing random song from For You mix:', randomSong.name)
                    await playSong(randomSong)
                    return
                }

                // Last resort: stop playing
                log.warn('No songs available for continuous playback')
                dispatch({ type: 'SET_PLAYING', payload: false })
                if (audioRef.current) {
                    audioRef.current.pause()
                }
            } catch (error) {
                log.error('Failed to fetch random song:', error)
                dispatch({ type: 'SET_PLAYING', payload: false })
                if (audioRef.current) {
                    audioRef.current.pause()
                }
            }
            return
        }

        // Play next song and update queue
        const rawNextSong = state.queue[0]
        dispatch({ type: 'PLAY_NEXT' })

        try {
            const nextSong = await resolveSongDetails(rawNextSong)
            dispatch({ type: 'UPDATE_CURRENT_SONG', payload: normalizeImageForSong(nextSong) })

            const audioUrl = extractAudioUrl(nextSong)
            if (audioUrl && audioRef.current) {
                const audio = audioRef.current
                audio.src = audioUrl
                audio.load()

                try {
                    await audio.play()
                    dispatch({ type: 'SET_PLAYING', payload: true })

                    // Track song in session and fetch recommendations
                    await handleSongPlayback(normalizeImageForSong(nextSong))
                } catch (error) {
                    log.warn('Failed to play next song:', error)
                    dispatch({ type: 'SET_PLAYING', payload: false })
                }
            } else {
                log.warn('No audio URL found for next song')
                dispatch({ type: 'SET_PLAYING', payload: false })
            }
        } catch (err) {
            log.error('Failed to play next song in handleNext:', err)
            dispatch({ type: 'SET_PLAYING', payload: false })
        }
    }, [dispatch, state.repeatMode, state.currentSong, playlistLoopSongs, state.queue, recommendations, playSong, resolveSongDetails, handleSongPlayback])

    const handlePrevious = useCallback(async () => {
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

        const rawPreviousSong = state.history[state.history.length - 1]
        dispatch({ type: 'PLAY_PREVIOUS' })

        try {
            const previousSong = await resolveSongDetails(rawPreviousSong)
            dispatch({ type: 'UPDATE_CURRENT_SONG', payload: normalizeImageForSong(previousSong) })

            const audioUrl = extractAudioUrl(previousSong)
            if (audioUrl && audioRef.current) {
                const audio = audioRef.current
                audio.src = audioUrl
                audio.load()

                try {
                    await audio.play()
                    dispatch({ type: 'SET_PLAYING', payload: true })
                    await handleSongPlayback(normalizeImageForSong(previousSong))
                } catch (error) {
                    log.warn('Failed to play previous song:', error)
                    dispatch({ type: 'SET_PLAYING', payload: false })
                }
            } else {
                log.warn('No audio URL found for previous song')
                dispatch({ type: 'SET_PLAYING', payload: false })
            }
        } catch (err) {
            log.error('Failed to play previous song in handlePrevious:', err)
            dispatch({ type: 'SET_PLAYING', payload: false })
        }
    }, [dispatch, state.progress, state.history, resolveSongDetails, playSong, handleSongPlayback, seekTo])


    // ============================================================================
    // ELECTRON INTEGRATION
    // ============================================================================

    // Update system tray when song/playing state changes
    useEffect(() => {
        const songName = state.currentSong?.name || state.currentSong?.title || 'Not playing'
        const artist = state.currentSong?.primaryArtists || ''
        const displayName = artist ? `${songName} - ${artist}` : songName

        updateTray(displayName, state.isPlaying)
    }, [state.currentSong, state.isPlaying])

    // Register media control handlers (from global shortcuts/tray)
    useEffect(() => {
        const cleanup = registerMediaControlHandler((action) => {
            switch (action) {
                case 'playpause':
                    togglePlayRef.current?.()
                    break
                case 'next':
                    handleNextRef.current?.()
                    break
                case 'previous':
                    handlePreviousRef.current?.()
                    break
            }
        })

        return cleanup
    }, [])

    useEffect(() => {
        togglePlayRef.current = togglePlay
        handleNextRef.current = handleNext
        handlePreviousRef.current = handlePrevious
    }, [togglePlay, handleNext, handlePrevious])

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
        reorderQueue,
        clearQueue,
        clearError,
        // Recommendations
        recommendations,
        recommendationsLoading,
        currentRecommendedSongId,
        fetchRecommendations,
        dominantColor,
        // Playlists
        playlists,
        playlistsLoading,
        loadPlaylists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        importSpotifyPlaylist,
        // Listening History
        listeningHistory,
        loadListeningHistory,
        // Immersive Player Overlay State
        isImmersiveOpen,
        setIsImmersiveOpen,
        // Global Audio Analyser Node
        analyserNode,
        // DSP & Audio Effects
        eqGains,
        setEqGain,
        eqPreset,
        setEqPreset,
        reverbEnabled,
        toggleReverb,
        reverbMix,
        setReverbMix: setReverbMixValue,
        reverbType,
        setReverbType: updateReverbType,
        vocalReducerEnabled,
        toggleVocalReducer,
        // Premium Settings
        premiumSettings: settings,
        togglePremiumSetting
    }


    return (
        <PlayerContext.Provider value={value}>
            {children}
            <audio
                ref={audioRef}
                crossOrigin="anonymous"
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
