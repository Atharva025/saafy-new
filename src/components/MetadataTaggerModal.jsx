import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { searchSongs } from '@/lib/api'
import { writeMusicMetadata } from '@/lib/electron'
import { X, Sparkles, Image, Check, Music, Loader2 } from 'lucide-react'

export default function MetadataTaggerModal({ isOpen, song, onClose, onSaveSuccess }) {
    const { colors, fonts, isDark } = useTheme()
    const toast = useToast()

    const [name, setName] = useState('')
    const [artist, setArtist] = useState('')
    const [album, setAlbum] = useState('')
    const [year, setYear] = useState('')
    const [image, setImage] = useState('')

    const [isSearchingWeb, setIsSearchingWeb] = useState(false)
    const [webResults, setWebResults] = useState([])
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (song) {
            setName(song.name || '')
            setArtist(song.primaryArtists || song.artist || '')
            setAlbum(song.album || '')
            setYear(song.year || '')
            
            let img = ''
            if (Array.isArray(song.image) && song.image.length) {
                img = song.image[song.image.length - 1]?.link || song.image[song.image.length - 1]?.url || ''
            } else {
                img = song.image || song.imageUrl || ''
            }
            setImage(img)
            setWebResults([])
        }
    }, [song, isOpen])

    const handleWebAutotag = async () => {
        if (!name.trim()) return

        setIsSearchingWeb(true)
        setWebResults([])

        try {
            const query = `${name} ${artist}`.trim()
            const response = await searchSongs(query, 0, 4)

            if (response.success && response.data?.results) {
                setWebResults(response.data.results)
                if (toast && toast.show) {
                    toast.show('Matches fetched from JioSaavn!', 'success')
                }
            } else {
                if (toast && toast.show) {
                    toast.show('No matches found online.', 'error')
                }
            }
        } catch (err) {
            console.error('Online metadata search error:', err)
            if (toast && toast.show) {
                toast.show('Error searching tags online.', 'error')
            }
        } finally {
            setIsSearchingWeb(false)
        }
    }

    const selectWebMatch = (match) => {
        setName(match.name)
        setArtist(match.primaryArtists)
        setAlbum(match.album?.name || match.album || '')
        setYear(match.year || '')
        
        let img = ''
        if (Array.isArray(match.image) && match.image.length) {
            img = match.image[match.image.length - 1]?.link || match.image[match.image.length - 1]?.url || ''
        } else {
            img = match.imageUrl || match.image || ''
        }
        setImage(img)
        setWebResults([])
        if (toast && toast.show) {
            toast.show('Auto-filled tags & cover art!', 'success')
        }
    }

    const handleSave = async () => {
        if (!name.trim()) {
            if (toast && toast.show) toast.show('Track title is required!', 'error')
            return
        }

        setIsSaving(true)

        try {
            const tags = {
                title: name,
                artist: artist,
                album: album,
                year: year,
                image: image
            }

            const result = await writeMusicMetadata(song.filePath, tags)

            if (result.success) {
                if (toast && toast.show) toast.show('ID3 Tags written to local file!', 'success')
                
                // Construct updated song object
                const updatedSong = {
                    ...song,
                    name: name,
                    title: name,
                    primaryArtists: artist,
                    artist: artist,
                    album: album,
                    year: year,
                    image: image ? [{ link: image }, { link: image }, { link: image }] : null,
                    imageUrl: image
                }

                if (onSaveSuccess) {
                    onSaveSuccess(updatedSong)
                }
                onClose()
            } else {
                if (toast && toast.show) toast.show(`Failed to write tags: ${result.error || 'Write error'}`, 'error')
            }
        } catch (error) {
            console.error('Save tag error:', error)
            if (toast && toast.show) toast.show('Failed writing metadata.', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen || !song) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(16px)',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: '100%',
                    maxWidth: '560px',
                    background: colors.paper,
                    borderRadius: '24px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '85vh',
                    color: colors.ink
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px 16px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                }}>
                    <div>
                        <h3 style={{
                            margin: 0,
                            fontFamily: fonts?.display || 'sans-serif',
                            fontWeight: 700,
                            fontSize: '16px',
                            letterSpacing: '0.02em'
                        }}>
                            Local Metadata Auto-Tagger
                        </h3>
                        <p style={{ margin: 0, fontSize: '11px', color: colors.inkMuted, marginTop: '2px' }}>
                            Update ID3 tags &amp; album art directly in your local file
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'rgba(0,0,0,0.05)',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: colors.inkMuted,
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px'
                }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        {/* Cover Art Preview */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '130px',
                                height: '130px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {image ? (
                                    <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Music size={32} color={colors.inkMuted} style={{ opacity: 0.3 }} />
                                )}
                            </div>
                            <span style={{ fontSize: '10px', color: colors.inkMuted }}>Cover Art</span>
                        </div>

                        {/* Text Fields */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: colors.inkMuted, display: 'block', marginBottom: '4px' }}>
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter song title..."
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                                        color: colors.ink,
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}`,
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontFamily: fonts.primary,
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: colors.inkMuted, display: 'block', marginBottom: '4px' }}>
                                    Artist
                                </label>
                                <input
                                    type="text"
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    placeholder="Enter artist name..."
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                                        color: colors.ink,
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}`,
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontFamily: fonts.primary,
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 2 }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: colors.inkMuted, display: 'block', marginBottom: '4px' }}>
                                Album
                            </label>
                            <input
                                type="text"
                                value={album}
                                onChange={(e) => setAlbum(e.target.value)}
                                placeholder="Enter album name..."
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                                    color: colors.ink,
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}`,
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontFamily: fonts.primary,
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: colors.inkMuted, display: 'block', marginBottom: '4px' }}>
                                Year
                            </label>
                            <input
                                type="text"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="Year..."
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#fff',
                                    color: colors.ink,
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}`,
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontFamily: fonts.primary,
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.inkMuted }}>
                                Auto-tagging lookup
                            </span>
                            <button
                                onClick={handleWebAutotag}
                                disabled={isSearchingWeb || !name.trim()}
                                style={{
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${colors.accent} 0%, #ff9575 100%)`,
                                    color: '#000',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: name.trim() ? 1 : 0.4
                                }}
                            >
                                {isSearchingWeb ? (
                                    <Loader2 size={11} className="animate-spin" />
                                ) : (
                                    <Sparkles size={11} />
                                )}
                                Auto-tag from Web
                            </button>
                        </div>

                        {/* Search Results list */}
                        {webResults.length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                                borderRadius: '12px',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                padding: '8px',
                                maxHeight: '180px',
                                overflowY: 'auto'
                            }}>
                                {webResults.map((match) => {
                                    let imgUrl = match.imageUrl
                                    if (Array.isArray(match.image) && match.image.length) {
                                        imgUrl = match.image[0]?.link || match.image[0]?.url || ''
                                    }
                                    return (
                                        <div
                                            key={match.id}
                                            onClick={() => selectWebMatch(match)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '6px 10px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                            }}
                                            className="ske-raised-xs"
                                        >
                                            <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                                {imgUrl ? (
                                                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyItem: 'center' }} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {match.name}
                                                </div>
                                                <div style={{ fontSize: '10px', color: colors.inkMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {match.primaryArtists}
                                                </div>
                                            </div>
                                            <Check size={12} style={{ color: colors.accent, opacity: 0.7 }} />
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)'}`,
                            background: 'transparent',
                            color: colors.inkMuted,
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            border: 'none',
                            background: `linear-gradient(135deg, ${colors.accent} 0%, ${isDark ? '#F0956C' : '#A84030'} 100%)`,
                            color: '#fff',
                            padding: '10px 24px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: isSaving ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 15px rgba(224, 115, 86, 0.2)',
                            opacity: isSaving ? 0.6 : 1
                        }}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={13} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={13} />
                                Apply Tags
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
