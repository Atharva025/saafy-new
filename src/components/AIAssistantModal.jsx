import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { searchSongs } from '@/lib/api'
import { Sparkles, X, Play, Plus, Check, Loader2, Music } from 'lucide-react'

export default function AIAssistantModal({ isOpen, onClose }) {
    const { colors, fonts, isDark } = useTheme()
    const { addToQueue, playSong } = usePlayer()
    const toast = useToast()

    const [prompt, setPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [loadingStage, setLoadingStage] = useState('')
    const [generatedSongs, setGeneratedSongs] = useState([])
    const [hasGenerated, setHasGenerated] = useState(false)

    const modalRef = useRef(null)

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    const samplePrompts = [
        "Rainy Sunday afternoon lofi",
        "Arijit Singh unplugged love songs",
        "High energy Punjabi party dance",
        "Deep focus coding session beats",
        "Gym workout energetic pump"
    ]

    const handlePromptSelect = (sample) => {
        setPrompt(sample)
    }

    const parsePromptToSearchQuery = (text) => {
        const lower = text.toLowerCase().trim()
        
        // Artist names detection
        const artists = [
            'arijit singh', 'taylor swift', 'diljit dosanjh', 'sidhu moosewala', 'shreya ghoshal', 
            'pritam', 'ap dhillon', 'karan aujla', 'sonu nigam', 'ar rahman', 'coldplay', 
            'the weeknd', 'ed sheeran', 'dua lipa', 'post malone', 'drake', 'billie eilish', 
            'justin bieber', 'ariana grande', 'bruno mars', 'imagine dragons', 'kishore kumar'
        ]
        
        for (const artist of artists) {
            if (lower.includes(artist)) {
                // If artist matches, customize prompt focusing on that artist
                if (lower.includes('sad') || lower.includes('broken')) {
                    return `${artist} sad hits`
                }
                if (lower.includes('love') || lower.includes('romantic')) {
                    return `${artist} romantic love songs`
                }
                if (lower.includes('unplugged') || lower.includes('acoustic')) {
                    return `${artist} unplugged acoustic`
                }
                if (lower.includes('party') || lower.includes('dance')) {
                    return `${artist} party dance hits`
                }
                return `${artist} best hits`
            }
        }

        // Language matches
        let lang = ''
        if (lower.includes('hindi')) lang = 'hindi'
        else if (lower.includes('punjabi')) lang = 'punjabi'
        else if (lower.includes('marathi')) lang = 'marathi'
        else if (lower.includes('english') || lower.includes('western') || lower.includes('pop')) lang = 'english'

        // Mood/Vibe matches
        let mood = ''
        if (lower.includes('lofi') || lower.includes('chill') || lower.includes('relax') || lower.includes('sleep')) {
            mood = 'lofi chill'
        } else if (lower.includes('party') || lower.includes('dance') || lower.includes('club') || lower.includes('banger')) {
            mood = 'party dance hits'
        } else if (lower.includes('workout') || lower.includes('gym') || lower.includes('exercise') || lower.includes('energy') || lower.includes('energetic')) {
            mood = 'workout gym energy'
        } else if (lower.includes('focus') || lower.includes('study') || lower.includes('coding') || lower.includes('ambient')) {
            mood = 'ambient study focus'
        } else if (lower.includes('romantic') || lower.includes('love')) {
            mood = 'romantic love hits'
        } else if (lower.includes('sad') || lower.includes('broken') || lower.includes('crying') || lower.includes('pain')) {
            mood = 'sad acoustic heartbreaks'
        } else if (lower.includes('retro') || lower.includes('old') || lower.includes('90s') || lower.includes('80s') || lower.includes('classic')) {
            mood = '90s classics old hits'
        } else if (lower.includes('acoustic') || lower.includes('guitar') || lower.includes('unplugged')) {
            mood = 'acoustic guitar unplugged'
        }

        // Construct Query
        if (lang && mood) {
            return `${lang} ${mood}`
        }
        if (lang) {
            return `${lang} latest hits`
        }
        if (mood) {
            return mood
        }

        // Fallback directly to text query if no keywords matched
        return text
    }

    const generateVibePlaylist = async () => {
        if (!prompt.trim()) return

        setIsGenerating(true)
        setGeneratedSongs([])
        setHasGenerated(false)

        const stages = [
            "Parsing vibe syntax...",
            "Analyzing acoustic attributes...",
            "Querying recommendation databases...",
            "Filtering optimal bitrates...",
            "Compiling premium playlist..."
        ]

        // Loop through stages to create AI generation experience
        for (let i = 0; i < stages.length; i++) {
            setLoadingStage(stages[i])
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
        }

        try {
            const query = parsePromptToSearchQuery(prompt)
            console.log(`🤖 AI Assistant Query parsed to: "${query}"`)
            const response = await searchSongs(query, 0, 10)

            if (response.success && response.data?.results && response.data.results.length > 0) {
                // Format results
                const songs = response.data.results.map(s => {
                    // Ensure normal image structure
                    let img = s.image
                    if (Array.isArray(s.image) && s.image.length) {
                        img = s.image
                    } else if (s.imageUrl) {
                        img = [{ link: s.imageUrl }, { link: s.imageUrl }, { link: s.imageUrl }]
                    }
                    return {
                        ...s,
                        image: img
                    }
                })
                setGeneratedSongs(songs)
                setHasGenerated(true)
                if (toast && toast.show) {
                    toast.show('Vibe Playlist Generated Successfully!', 'success')
                }
            } else {
                setGeneratedSongs([])
                setHasGenerated(true)
                if (toast && toast.show) {
                    toast.show('Failed to find matching tracks for this vibe.', 'error')
                }
            }
        } catch (err) {
            console.error('Error generating AI playlist:', err)
            if (toast && toast.show) {
                toast.show('Error connecting to music recommendation server.', 'error')
            }
        } finally {
            setIsGenerating(false)
        }
    }

    const playAllGenerated = () => {
        if (generatedSongs.length === 0) return
        
        // Play first song
        playSong(generatedSongs[0])
        
        // Add others to queue
        for (let i = 1; i < generatedSongs.length; i++) {
            addToQueue(generatedSongs[i])
        }

        if (toast && toast.show) {
            toast.show(`Playing ${generatedSongs.length} vibe tracks!`, 'success')
        }
        onClose()
    }

    const addAllToQueue = () => {
        if (generatedSongs.length === 0) return
        
        generatedSongs.forEach(song => addToQueue(song))
        
        if (toast && toast.show) {
            toast.show(`Added ${generatedSongs.length} tracks to queue!`, 'success')
        }
        onClose()
    }

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(16px)',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: '100%',
                    maxWidth: '540px',
                    background: 'linear-gradient(135deg, rgba(30, 25, 23, 0.85) 0%, rgba(15, 12, 10, 0.95) 100%)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '85vh'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(145deg, var(--color-accent) 0%, #ff9575 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(224, 115, 86, 0.4)'
                        }}>
                            <Sparkles size={16} color="#000" />
                        </div>
                        <div>
                            <h3 style={{
                                margin: 0,
                                fontFamily: fonts?.display || 'sans-serif',
                                fontWeight: 700,
                                fontSize: '16px',
                                color: '#fff',
                                letterSpacing: '0.02em'
                            }}>
                                AI Vibe Playlist Generator
                            </h3>
                            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                Instant music matching powered by acoustic vector intelligence
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.5)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#fff'
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Body Area */}
                <div style={{
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    {!hasGenerated && !isGenerating && (
                        <>
                            {/* Input Prompt Box */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                                    Describe the vibe you want:
                                </label>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px',
                                    padding: '6px 6px 6px 12px',
                                    alignItems: 'center',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                                }}>
                                    <input
                                        type="text"
                                        placeholder="e.g., Chill lofi tracks for studying in the evening..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && generateVibePlaylist()}
                                        style={{
                                            flex: 1,
                                            background: 'none',
                                            border: 'none',
                                            color: '#fff',
                                            outline: 'none',
                                            fontSize: '13.5px',
                                            fontFamily: fonts?.primary
                                        }}
                                    />
                                    <button
                                        disabled={!prompt.trim()}
                                        onClick={generateVibePlaylist}
                                        style={{
                                            border: 'none',
                                            background: 'linear-gradient(135deg, var(--color-accent) 0%, #ff9575 100%)',
                                            color: '#000',
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            cursor: prompt.trim() ? 'pointer' : 'default',
                                            opacity: prompt.trim() ? 1 : 0.4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'transform 0.1s'
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <Sparkles size={13} />
                                        Generate
                                    </button>
                                </div>
                            </div>

                            {/* Floating prompts */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                    Or try starting with these templates:
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {samplePrompts.map(sample => (
                                        <button
                                            key={sample}
                                            onClick={() => handlePromptSelect(sample)}
                                            style={{
                                                border: 'none',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                color: 'rgba(255,255,255,0.65)',
                                                borderRadius: '10px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontFamily: fonts?.primary
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--color-accent)'
                                                e.currentTarget.style.color = '#fff'
                                                e.currentTarget.style.background = 'rgba(224, 115, 86, 0.05)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                                                e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                            }}
                                        >
                                            {sample}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Generating Loader stage */}
                    {isGenerating && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px 0',
                            gap: '16px'
                        }}>
                            <Loader2 size={38} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
                                    {loadingStage}
                                </span>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                    Synthesizing vibe recommendations
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Results list */}
                    {hasGenerated && !isGenerating && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'cardFadeIn 0.3s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                    MATCHING TRACKS FOUND ({generatedSongs.length})
                                </span>
                                <button
                                    onClick={() => {
                                        setHasGenerated(false)
                                        setPrompt('')
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        color: 'var(--color-accent)',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    New Vibe
                                </button>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                paddingRight: '4px'
                            }}>
                                {generatedSongs.length > 0 ? (
                                    generatedSongs.map((song, i) => {
                                        let imgUrl = ''
                                        if (Array.isArray(song.image) && song.image.length) {
                                            imgUrl = song.image[0]?.link || song.image[0]?.url || ''
                                        } else {
                                            imgUrl = song.imageUrl || ''
                                        }

                                        return (
                                            <div key={song.id || i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '8px 12px',
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.04)',
                                                borderRadius: '10px'
                                            }}>
                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', width: '16px', fontFamily: fonts?.mono }}>
                                                    {i + 1}
                                                </span>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                                    {imgUrl ? (
                                                        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Music size={12} color="rgba(255,255,255,0.2)" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {song.name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                                                        {song.primaryArtists}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div style={{ padding: '30px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                                        No songs matched this vibe query. Try different words.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    {hasGenerated && generatedSongs.length > 0 ? (
                        <>
                            <button
                                onClick={addAllToQueue}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#fff',
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                            >
                                <Plus size={14} />
                                Add to Queue
                            </button>

                            <button
                                onClick={playAllGenerated}
                                style={{
                                    border: 'none',
                                    background: 'linear-gradient(135deg, var(--color-accent) 0%, #ff9575 100%)',
                                    color: '#000',
                                    padding: '10px 24px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 15px rgba(224, 115, 86, 0.25)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(224, 115, 86, 0.4)'}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(224, 115, 86, 0.25)'}
                            >
                                <Play size={14} fill="#000" />
                                Play Vibe Playlist
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            style={{
                                border: 'none',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.6)',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
