import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { searchSongs, getSong } from '@/lib/api'
import { usePlayer } from '@/context/PlayerContext'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'

const JIO_NEW_RELEASES_URL = 'https://www.jiosaavn.com/new-releases/hindi'

// CORS-friendly proxy prefixes to try (public proxies; reliability varies)
const PROXIES = [
    'https://r.jina.ai/http://',
    'https://api.allorigins.win/raw?url=',
    'https://r.jina.ai/http://'
]

function extractTitlesFromHTML(html) {
    const titles = new Set()
    let m

    // 1) anchors that likely contain song titles
    const anchorRegex = /<a[^>]+href=["'][^"']*(?:\/s\/|\/song\/|\/track\/|\/lyrics\/)[^"']*["'][^>]*>([^<]+)<\/a>/gi
    while ((m = anchorRegex.exec(html))) {
        const t = m[1].trim()
        if (t && t.length > 1 && t.length < 120) titles.add(t)
    }

    // 2) class-based containers with probable title text
    const classRegex = /<[^>]+class=["'][^"']*(?:song|title|track)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|a|span|li)>/gi
    while ((m = classRegex.exec(html))) {
        const inner = m[1].replace(/<[^>]+>/g, '').trim()
        if (inner && inner.length > 1 && inner.length < 120) titles.add(inner)
    }

    // 3) headings fallback
    const hRegex = /<h[1-6][^>]*>([^<]{2,120})<\/h[1-6]>/gi
    while ((m = hRegex.exec(html))) {
        const t = m[1].trim()
        if (t) titles.add(t)
    }

    return Array.from(titles).slice(0, 12)
}

function chooseBestImage(imageArray) {
    if (!imageArray) return ''
    if (Array.isArray(imageArray) && imageArray.length > 0) {
        // Prefer 500x500, then 300/150, else first
        const prefer = imageArray.find(i => (i.quality || '').includes('500')) || imageArray.find(i => (i.quality || '').includes('300')) || imageArray[0]
        return prefer?.url || prefer?.link || ''
    }
    return typeof imageArray === 'string' ? imageArray : ''
}

function chooseBestAudio(downloads) {
    if (!downloads) return null
    if (typeof downloads === 'string') return { url: downloads, quality: 'standard' }
    if (Array.isArray(downloads) && downloads.length > 0) {
        const order = { '12kbps': 1, '48kbps': 2, '96kbps': 3, '128kbps': 3, '160kbps': 4, '192kbps': 4, '320kbps': 5 }
        const sorted = downloads.slice().sort((a, b) => {
            const aq = order[a.quality] || 0
            const bq = order[b.quality] || 0
            return bq - aq
        })
        const best = sorted[0]
        return { url: best.url || best.link || best, quality: best.quality || 'high' }
    }
    // other shapes
    if (downloads.url || downloads.link) return { url: downloads.url || downloads.link, quality: downloads.quality || 'media' }
    return null
}

export default function NewReleases() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [idx, setIdx] = useState(0)
    const { playSong, currentSong, isPlaying } = usePlayer()

    async function tryFetchTitles() {
        for (const prefix of PROXIES) {
            try {
                const url = prefix + encodeURIComponent(JIO_NEW_RELEASES_URL)
                const res = await fetch(url)
                if (!res.ok) throw new Error('bad status ' + res.status)
                const text = await res.text()
                const titles = extractTitlesFromHTML(text)
                if (titles && titles.length > 0) return titles
            } catch (e) {
                // continue to next proxy
                console.warn('proxy fetch failed', prefix, e.message)
                continue
            }
        }
        return []
    }

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoading(true)
            try {
                const titles = await tryFetchTitles()
                const candidates = titles.length ? titles : [
                    'Doobey', 'Kesariya', 'Jhoome Jo Pathaan', 'Apna Bana Le'
                ]

                const results = []
                for (const t of candidates) {
                    if (results.length >= 8) break
                    try {
                        const res = await searchSongs(t, 0, 4)
                        const hits = res?.data?.results || []
                        if (!hits.length) continue

                        // prefer first with download_url, else first
                        let match = hits.find(h => h.download_url) || hits[0]

                        // if match lacks download_url, try fetching via getSong
                        if (!match.download_url && match.id) {
                            try {
                                const full = await getSong(match.id)
                                match = full?.data || match
                            } catch (e) {
                                // ignore
                            }
                        }

                        const audio = chooseBestAudio(match.download_url || match.downloadUrl || match.media || match.streamUrl || match.url)
                        if (!audio || !audio.url) continue

                        const image = chooseBestImage(match.image)

                        const item = {
                            id: match.id || `${t}-${results.length}`,
                            name: match.name || t,
                            primaryArtists: match.primaryArtists || match.more_info || '',
                            artists: match.primaryArtists || match.more_info || '',
                            // Provide `image` in the same shape other components expect (index 2 used for large art)
                            image: [
                                { link: image || '' },
                                { link: image || '' },
                                { link: image || '', url: image || '' }
                            ],
                            imageUrl: image,
                            download_url: audio.url,
                            audioQuality: audio.quality || null
                        }

                        if (!results.some(r => r.id === item.id)) results.push(item)
                    } catch (e) {
                        console.warn('search failed for', t, e.message)
                        continue
                    }
                }

                if (!cancelled) setItems(results.length ? results : [{ id: 'fallback-1', name: 'Latest Hindi Hits', primaryArtists: 'Various', artists: 'Various', image: [{ link: 'https://via.placeholder.com/500' }, { link: 'https://via.placeholder.com/500' }, { link: 'https://via.placeholder.com/500', url: 'https://via.placeholder.com/500' }], imageUrl: 'https://via.placeholder.com/500', download_url: null }])
            } catch (e) {
                console.error('NewReleases load error', e)
                if (!cancelled) setItems([{ id: 'error-1', name: 'Music Discovery', primaryArtists: 'Various', artists: 'Various', image: [{ link: 'https://via.placeholder.com/500' }, { link: 'https://via.placeholder.com/500' }, { link: 'https://via.placeholder.com/500', url: 'https://via.placeholder.com/500' }], imageUrl: 'https://via.placeholder.com/500', download_url: null }])
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    const current = items[idx] || {}

    const handlePrev = () => setIdx(i => Math.max(0, i - 1))
    const handleNext = () => setIdx(i => Math.min(items.length - 1, i + 1))
    const handlePlay = (item) => {
        if (!item || !item.download_url) return
        playSong(item)
    }

    return (
        <div className="w-full bg-gradient-to-r from-black/70 via-black/40 to-transparent rounded-xl overflow-hidden relative">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold">New Releases</h3>
                        <p className="text-sm text-muted-foreground">Latest Hindi releases (auto-sourced)</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handlePrev} className="p-2 bg-white/10 rounded"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={handleNext} className="p-2 bg-white/10 rounded"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center">Loading new releases…</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {items.map((it, i) => (
                            <div key={it.id} className={`bg-white/5 rounded-lg p-3 flex flex-col items-start space-y-2 ${i === idx ? 'ring-2 ring-white/20' : ''}`}>
                                <img src={it.imageUrl || 'https://via.placeholder.com/300'} alt={it.name} className="w-full h-40 object-cover rounded-md" />
                                <div className="w-full">
                                    <div className="font-semibold truncate">{it.name}</div>
                                    <div className="text-sm text-white/70 truncate">{it.artists}</div>
                                </div>
                                <div className="w-full flex items-center justify-between">
                                    <button onClick={() => handlePlay(it)} disabled={!it.download_url} className="mt-2 px-3 py-2 rounded bg-white text-black flex items-center space-x-2">
                                        <Play className="w-4 h-4" />
                                        <span className="text-sm">Play</span>
                                    </button>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}