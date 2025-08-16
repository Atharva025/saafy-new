const BASE_URL = import.meta.env.VITE_SAAFY_API_URL || 'https://saafy-api.vercel.app'
const JIOSAAVN_URL = import.meta.env.VITE_JIOSAAVN_API_URL || 'https://saavn.dev'

class APIError extends Error {
    constructor(message, status) {
        super(message)
        this.name = 'APIError'
        this.status = status
    }
}

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new APIError(
            errorData.message || `HTTP Error: ${response.status}`,
            response.status
        )
    }
    return response.json()
}

// Format songs from API response to match the working structure
const formatSongs = (songs) => {
    return songs.map(song => {
        // Try to extract download URL from various possible fields
        let downloadUrl = null
        let downloadUrlArray = null

        if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
            // Preserve the full array for quality selection
            downloadUrlArray = song.downloadUrl
            // Array format: get the highest quality (last item) as primary URL
            const urlItem = song.downloadUrl[song.downloadUrl.length - 1]
            downloadUrl = urlItem.url || urlItem.link || urlItem
        } else {
            // Try other possible field names
            downloadUrl = song.download_url ||
                song.downloadLink ||
                song.streamUrl ||
                song.previewUrl ||
                song.url ||
                (song.media && song.media.url) ||
                null
        }

        return {
            id: song.id,
            name: song.name || song.title, // Handle both name and title fields
            title: song.title || song.name, // alias for compatibility
            primaryArtists: song.primaryArtists || (song.artists?.primary ?
                song.artists.primary.map(artist => artist.name).join(', ') : 'Unknown Artist'),
            artists: song.artists && song.artists.primary
                ? song.artists.primary.map(artist => ({
                    id: artist.id,
                    name: artist.name,
                    url: artist.url,
                    image: artist.image && artist.image.length > 0 ? artist.image[1]?.url : ''
                }))
                : song.primaryArtists
                    ? song.primaryArtists.split(',').map(name => ({ name: name.trim() }))
                    : [{ name: 'Unknown Artist' }],
            album: {
                name: song.album?.name || song.album || 'Unknown Album', // Handle both object and string album
                id: song.album?.id,
                url: song.album?.url
            },
            image: song.image ? [
                { link: song.image[2]?.link || song.image[2]?.url || '' },
                { link: song.image[1]?.link || song.image[1]?.url || '' },
                { link: song.image[0]?.link || song.image[0]?.url || '' }
            ] : [{ link: '' }, { link: '' }, { link: '' }],
            duration: song.duration || 0,
            download_url: downloadUrl,
            downloadUrl: downloadUrlArray || song.downloadUrl, // Preserve original array for quality selection
            year: song.year,
            playCount: song.playCount,
            hasLyrics: song.hasLyrics,
            url: song.url
        }
    })
}

const apiCall = async (endpoint) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`)
        return await handleResponse(response)
    } catch (error) {
        if (error instanceof APIError) {
            throw error
        }
        throw new APIError('Network error occurred', 0)
    }
}

// Search endpoints
export const searchAll = async (query) => {
    const data = await apiCall(`/api/search?query=${encodeURIComponent(query)}`)
    return data
}

export const searchSongs = async (query, page = 0, limit = 10) => {
    const data = await apiCall(`/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)

    // Format songs to include download_url
    if (data.data && data.data.results) {
        data.data.results = formatSongs(data.data.results)
    }

    return data
}

export const searchAlbums = async (query, page = 0, limit = 10) => {
    const data = await apiCall(`/api/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
    return data
}

// Format artists from API response
const formatArtists = (artists) => {
    return artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        role: artist.role || 'Artist',
        image: artist.image ? artist.image.map(img => ({
            quality: img.quality,
            url: img.url
        })) : [
            { quality: '50x50', url: '' },
            { quality: '150x150', url: '' },
            { quality: '500x500', url: '' }
        ],
        type: artist.type || 'artist',
        url: artist.url,
        followerCount: artist.followerCount,
        bio: artist.bio,
        dominantLanguage: artist.dominantLanguage,
        dominantType: artist.dominantType
    }))
}

export const searchArtists = async (query, page = 0, limit = 10) => {
    const data = await apiCall(`/api/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)

    // Format artists data
    if (data.data && data.data.results) {
        data.data.results = formatArtists(data.data.results)
    }

    return data
}

export const searchPlaylists = async (query, page = 0, limit = 10) => {
    const data = await apiCall(`/api/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
    return data
}

// Detail endpoints
export const getSong = async (id) => {
    const data = await apiCall(`/api/songs/${id}`)

    console.log('getSong raw response:', data)

    // Fix: Individual song API returns data as an array, not an object
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const formattedSongs = formatSongs([data.data[0]])
        data.data = formattedSongs[0]
        console.log('getSong formatted data:', data.data)
    } else if (data.data && !Array.isArray(data.data)) {
        // Handle case where data is already an object
        const formattedSongs = formatSongs([data.data])
        data.data = formattedSongs[0]
    }

    return data
}

export const getAlbum = (id) =>
    apiCall(`/api/albums?id=${id}`)

export const getArtist = (id) =>
    apiCall(`/api/artists/${id}`)

export const getPlaylist = (id) =>
    apiCall(`/api/playlists?id=${id}`)

// Trending/Featured endpoints (mock for now, can be updated when API provides them)
export const getTrendingSongs = async () => {
    try {
        console.log('Fetching trending songs...')

        // Use multiple trending search terms to get better results
        const trendingTerms = [
            'trending songs 2025',
            'bollywood trending',
            'viral songs hindi',
            'top hindi songs',
            'latest bollywood',
            'arijit singh hits'
        ]

        let bestResults = []

        for (const term of trendingTerms) {
            try {
                const data = await searchSongs(term, 0, 12)
                if (data.data?.results?.length > 0) {
                    bestResults = data.data.results
                    console.log(`Found ${bestResults.length} trending songs for term: ${term}`)
                    break
                }
            } catch (error) {
                console.warn(`Failed to fetch trending results for term: ${term}`, error)
                continue
            }
        }

        // Format the results with detailed song information
        const formattedResults = await Promise.all(
            bestResults.slice(0, 10).map(async (song) => {
                try {
                    // Get detailed song info to ensure we have download URLs
                    const detailedSong = await getSong(song.id)
                    if (detailedSong.success && detailedSong.data && detailedSong.data.length > 0) {
                        return formatSongs([detailedSong.data[0]])[0]
                    }
                    return formatSongs([song])[0]
                } catch (error) {
                    console.warn(`Failed to get detailed info for trending song ${song.id}`, error)
                    return formatSongs([song])[0]
                }
            })
        )

        return {
            success: true,
            data: {
                results: formattedResults.filter(song => song && song.id)
            }
        }
    } catch (error) {
        console.error('Error in getTrendingSongs:', error)

        // Fallback to a reliable search term
        try {
            const fallbackData = await searchSongs('bollywood hits', 0, 10)
            if (fallbackData.data?.results?.length > 0) {
                const formattedFallback = formatSongs(fallbackData.data.results)
                return {
                    success: true,
                    data: {
                        results: formattedFallback
                    }
                }
            }
        } catch (fallbackError) {
            console.error('Trending fallback also failed:', fallbackError)
        }

        return {
            success: false,
            data: {
                results: []
            }
        }
    }
}

export const getNewReleases = async () => {
    try {
        // First, try to fetch trending songs from JioSaavn new releases
        console.log('Fetching from JioSaavn new releases...')

        // Use the Saafy API to search for trending/popular songs
        const trendingTerms = [
            'trending hindi songs',
            'bollywood 2025',
            'latest bollywood hits',
            'hindi top songs',
            'new hindi songs'
        ]

        let bestResults = []

        for (const term of trendingTerms) {
            try {
                const data = await searchSongs(term, 0, 8)
                if (data.data?.results?.length > 0) {
                    bestResults = data.data.results
                    console.log(`Found ${bestResults.length} songs for term: ${term}`)
                    break
                }
            } catch (error) {
                console.warn(`Failed to fetch results for term: ${term}`, error)
                continue
            }
        }

        // Format the results to ensure they have proper download URLs and metadata
        const formattedResults = await Promise.all(
            bestResults.slice(0, 6).map(async (song) => {
                try {
                    // Get detailed song info to ensure we have download URLs
                    const detailedSong = await getSong(song.id)
                    if (detailedSong.success && detailedSong.data && detailedSong.data.length > 0) {
                        return formatSongs([detailedSong.data[0]])[0] // getSong returns array, take first item
                    }
                    return formatSongs([song])[0]
                } catch (error) {
                    console.warn(`Failed to get detailed info for song ${song.id}`, error)
                    return formatSongs([song])[0]
                }
            })
        )

        return {
            success: true,
            data: {
                results: formattedResults.filter(song => song && song.id)
            }
        }
    } catch (error) {
        console.error('Error in getNewReleases:', error)

        // Fallback: get some popular songs
        try {
            const fallbackData = await searchSongs('arijit singh', 0, 6)
            if (fallbackData.data?.results?.length > 0) {
                const formattedFallback = formatSongs(fallbackData.data.results)
                return {
                    success: true,
                    data: {
                        results: formattedFallback
                    }
                }
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError)
        }

        // Ultimate fallback
        return {
            success: false,
            data: {
                results: []
            }
        }
    }
}

export const getFeaturedPlaylists = async () => {
    try {
        console.log('Fetching featured playlists...')

        // Try multiple search terms to get better playlist results
        const playlistTerms = [
            'bollywood hits',
            'hindi songs',
            'top bollywood',
            'best of bollywood',
            'hindi playlist'
        ]

        let bestResults = []

        for (const term of playlistTerms) {
            try {
                const data = await searchPlaylists(term, 0, 12)
                if (data.data?.results?.length > 0) {
                    bestResults = data.data.results
                    console.log(`Found ${bestResults.length} playlists for term: ${term}`)
                    break
                }
            } catch (error) {
                console.warn(`Failed to fetch playlist results for term: ${term}`, error)
                continue
            }
        }

        // Format playlists to ensure consistent structure
        const formattedPlaylists = bestResults.slice(0, 10).map(playlist => ({
            id: playlist.id,
            name: playlist.name || 'Untitled Playlist',
            type: playlist.type || 'playlist',
            image: playlist.image || [],
            url: playlist.url,
            songCount: playlist.songCount || 0,
            language: playlist.language,
            explicitContent: playlist.explicitContent || false
        }))

        return {
            success: true,
            data: {
                results: formattedPlaylists.filter(playlist => playlist && playlist.id)
            }
        }
    } catch (error) {
        console.error('Error in getFeaturedPlaylists:', error)

        // Fallback to a simple search
        try {
            const fallbackData = await searchPlaylists('bollywood', 0, 10)
            if (fallbackData.data?.results?.length > 0) {
                return fallbackData
            }
        } catch (fallbackError) {
            console.error('Playlist fallback also failed:', fallbackError)
        }

        return {
            success: false,
            data: {
                results: []
            }
        }
    }
}

export const getPopularArtists = async () => {
    const data = await searchArtists('arijit singh', 0, 10)
    return data
}

// Get specific artist by name (limit to 1 result)
export const getArtistByName = async (artistName) => {
    const data = await apiCall(`/api/search/artists?query=${encodeURIComponent(artistName)}&page=0&limit=1`)

    // Format artists data
    if (data.data && data.data.results) {
        data.data.results = formatArtists(data.data.results)
    }

    return data
}

// Get songs by artist ID
export const getArtistSongs = async (artistId, page = 0, sortBy = 'popularity', sortOrder = 'desc') => {
    const data = await apiCall(`/api/artists/${artistId}/songs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`)

    // Log raw response to understand structure
    console.log('Raw artist songs API response:', data)

    // Format songs to include download_url
    if (data.data && data.data.results) {
        console.log('Raw songs before formatting:', data.data.results.slice(0, 2))
        data.data.results = formatSongs(data.data.results)
        console.log('Formatted songs:', data.data.results.slice(0, 2))
    }

    return data
}

// Get popular Indian artists for homepage
export const getPopularIndianArtists = async () => {
    const indianArtists = [
        'Arijit Singh',
        'A.R. Rahman',
        'Shreya Ghoshal',
        'Rahat Fateh Ali Khan',
        'Armaan Malik',
        'Atif Aslam',
        'Kishore Kumar',
        'Lata Mangeshkar',
        'Sonu Nigam',
        'Neha Kakkar'
    ]

    try {
        const artistPromises = indianArtists.map(name => getArtistByName(name))
        const results = await Promise.allSettled(artistPromises)

        const artists = results
            .filter(result => result.status === 'fulfilled' && result.value.data?.results?.length > 0)
            .map(result => result.value.data.results[0])

        return {
            status: 'SUCCESS',
            data: {
                results: artists
            }
        }
    } catch (error) {
        console.error('Error fetching Indian artists:', error)
        return {
            status: 'FAILED',
            data: {
                results: []
            }
        }
    }
}

// Export formatSongs and formatArtists for use in other modules
export { formatSongs, formatArtists }
