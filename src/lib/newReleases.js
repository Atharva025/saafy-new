// New Releases functionality using JioSaavn website scraping + our API
import { formatSongs } from './api.js'

const JIOSAAVN_NEW_RELEASES_URLS = {
    hindi: 'https://www.jiosaavn.com/new-releases/hindi',
    english: 'https://www.jiosaavn.com/new-releases/english',
    tamil: 'https://www.jiosaavn.com/new-releases/tamil',
    telugu: 'https://www.jiosaavn.com/new-releases/telugu',
    punjabi: 'https://www.jiosaavn.com/new-releases/punjabi',
    marathi: 'https://www.jiosaavn.com/new-releases/marathi',
    gujarati: 'https://www.jiosaavn.com/new-releases/gujarati',
    bengali: 'https://www.jiosaavn.com/new-releases/bengali',
    kannada: 'https://www.jiosaavn.com/new-releases/kannada',
    malayalam: 'https://www.jiosaavn.com/new-releases/malayalam'
}

// Extract song IDs from JioSaavn URLs
const extractSongId = (url) => {
    // URL format: https://www.jiosaavn.com/song/song-name/SONG_ID
    const parts = url.split('/')
    return parts[parts.length - 1]
}

// Get new releases for a specific language
export const getNewReleasesByLanguage = async (language = 'hindi', limit = 10) => {
    try {
        // Step 1: Scrape JioSaavn new releases page to get actual song names
        const jiosaavnUrl = JIOSAAVN_NEW_RELEASES_URLS[language] || JIOSAAVN_NEW_RELEASES_URLS.hindi

        let songNames = []

        try {
            // Use a CORS proxy to fetch JioSaavn page
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(jiosaavnUrl)}`
            const response = await fetch(proxyUrl)

            if (response.ok) {
                const html = await response.text()

                // Parse HTML to extract song names
                // JioSaavn uses specific patterns for song titles
                const songMatches = html.match(/data-title="([^"]+)"/g) || []
                const songTitleMatches = html.match(/<h3[^>]*>([^<]+)<\/h3>/g) || []
                const linkMatches = html.match(/\/song\/([^\/]+)\//g) || []

                // Extract song names from different patterns
                songMatches.forEach(match => {
                    const title = match.match(/data-title="([^"]+)"/)[1]
                    if (title && title.length > 2) {
                        songNames.push(title)
                    }
                })

                songTitleMatches.forEach(match => {
                    const title = match.match(/<h3[^>]*>([^<]+)<\/h3>/)[1]
                    if (title && title.length > 2) {
                        songNames.push(title.trim())
                    }
                })

                linkMatches.forEach(match => {
                    const songSlug = match.match(/\/song\/([^\/]+)\//)[1]
                    if (songSlug) {
                        // Convert slug to readable name
                        const songName = songSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                        songNames.push(songName)
                    }
                })

                // Remove duplicates and clean up
                songNames = [...new Set(songNames)]
                    .filter(name => name && name.length > 2 && !name.includes('undefined'))
                    .slice(0, 20) // Increase to 20 songs instead of 10
            }
        } catch (scrapeError) {
            // If scraping fails, fallback to recent popular songs for that language
            const fallbackSongs = {
                hindi: ['Kesariya', 'Pal Pal Dil Ke Paas', 'Tum Hi Ho', 'Raabta', 'Channa Mereya'],
                english: ['As It Was', 'Heat Waves', 'Stay', 'Good 4 U', 'Levitating'],
                tamil: ['Naatu Naatu', 'Oo Antava', 'Arabic Kuthu', 'Jimikki Kammal', 'Rowdy Baby'],
                telugu: ['Naatu Naatu', 'Oo Antava', 'Butta Bomma', 'Inkem Inkem', 'Ramuloo Ramulaa'],
                punjabi: ['295', 'Hass Hass', 'Excuses', 'Laung Laachi', 'Qismat']
            }
            songNames = fallbackSongs[language] || fallbackSongs.hindi
        }

        if (songNames.length === 0) {
            return []
        }

        const allSongs = []

        // Step 2: Search each scraped song name in Saafy API
        for (const songName of songNames.slice(0, 15)) { // Increase to 15 searches
            try {
                const response = await fetch(
                    `https://saafy-api.vercel.app/api/search/songs?query=${encodeURIComponent(songName)}&limit=1`
                )

                if (response.ok) {
                    const data = await response.json()
                    if (data.data && data.data.results && data.data.results.length > 0) {
                        // Take the first result from each search
                        allSongs.push(data.data.results[0])
                    }
                }
            } catch (error) {
                // Silent error handling
            }
        }

        // Step 3: Format the songs using our formatSongs function
        const formattedSongs = formatSongs(allSongs)

        // Filter playable songs
        const playableSongs = formattedSongs.filter(song => song.download_url)

        return playableSongs

    } catch (error) {
        return []
    }
}

// Get new releases for all languages
export const getAllNewReleases = async (limitPerLanguage = 8) => {
    const languages = ['hindi', 'english', 'tamil', 'telugu', 'punjabi']
    const results = {}

    console.log('🌍 Fetching new releases for all languages...')

    // Fetch new releases for each language in parallel
    const promises = languages.map(async (language) => {
        const songs = await getNewReleasesByLanguage(language, limitPerLanguage)
        return { language, songs }
    })

    const languageResults = await Promise.all(promises)

    languageResults.forEach(({ language, songs }) => {
        results[language] = songs
    })

    console.log('✅ All new releases fetched')
    return results
}

// Get a mixed new releases playlist
export const getMixedNewReleases = async (limit = 20) => {
    try {
        // Scrape multiple language pages to get mixed new releases
        const languages = ['hindi', 'english', 'tamil', 'punjabi']
        const allSongNames = []

        // Get songs from multiple languages
        for (const lang of languages) {
            try {
                const jiosaavnUrl = JIOSAAVN_NEW_RELEASES_URLS[lang]
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(jiosaavnUrl)}`
                const response = await fetch(proxyUrl)

                if (response.ok) {
                    const html = await response.text()

                    // Extract song names using multiple patterns
                    const songMatches = html.match(/data-title="([^"]+)"/g) || []
                    const linkMatches = html.match(/\/song\/([^\/]+)\//g) || []

                    // Extract from data-title attributes
                    songMatches.forEach(match => {
                        const title = match.match(/data-title="([^"]+)"/)[1]
                        if (title && title.length > 2) {
                            allSongNames.push(title)
                        }
                    })

                    // Extract from song URLs
                    linkMatches.slice(0, 8).forEach(match => { // Increase to 8 songs per language
                        const songSlug = match.match(/\/song\/([^\/]+)\//)[1]
                        if (songSlug) {
                            const songName = songSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                            allSongNames.push(songName)
                        }
                    })
                }
            } catch (error) {
                // Silent error for individual language failures
            }
        }

        // If scraping fails, use fallback
        if (allSongNames.length === 0) {
            allSongNames.push(
                'Kesariya', 'As It Was', 'Naatu Naatu', 'Hass Hass',
                'Pal Pal Dil Ke Paas', 'Heat Waves', 'Arabic Kuthu', '295'
            )
        }

        // Remove duplicates and limit
        const uniqueSongNames = [...new Set(allSongNames)]
            .filter(name => name && name.length > 2)
            .slice(0, 15) // Increase to 15 for mixed

        const allSongs = []

        // Search each scraped song name in Saafy API
        for (const songName of uniqueSongNames) {
            try {
                const response = await fetch(
                    `https://saafy-api.vercel.app/api/search/songs?query=${encodeURIComponent(songName)}&limit=1`
                )

                if (response.ok) {
                    const data = await response.json()
                    if (data.data && data.data.results && data.data.results.length > 0) {
                        allSongs.push(data.data.results[0])
                    }
                }
            } catch (error) {
                // Silent error handling
            }
        }

        // Format and filter songs
        const formattedSongs = formatSongs(allSongs)
        const playableSongs = formattedSongs.filter(song => song.download_url)

        return playableSongs

    } catch (error) {
        return []
    }
}

export { JIOSAAVN_NEW_RELEASES_URLS }
