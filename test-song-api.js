// Test the song API to see the structure
const BASE_URL = 'https://saafy-api.vercel.app'

// Copy formatSongs function for testing
const formatSongs = (songs) => {
    return songs.map(song => {
        console.log('Formatting song:', song.name, 'downloadUrl:', song.downloadUrl)

        // Try to extract download URL from various possible fields
        let downloadUrl = null
        let downloadUrlArray = null

        if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
            // Preserve the full array for quality selection
            downloadUrlArray = song.downloadUrl
            // Array format: get the highest quality (last item) as primary URL
            const urlItem = song.downloadUrl[song.downloadUrl.length - 1]
            downloadUrl = urlItem.url || urlItem.link || urlItem
            console.log('Using downloadUrl array, highest quality:', downloadUrl)
        } else {
            // Try other possible field names
            downloadUrl = song.download_url ||
                song.downloadLink ||
                song.streamUrl ||
                song.previewUrl ||
                song.url ||
                (song.media && song.media.url) ||
                null
            console.log('Using fallback downloadUrl:', downloadUrl)
        }

        return {
            id: song.id,
            name: song.name || song.title,
            title: song.title || song.name,
            primaryArtists: song.primaryArtists || (song.artists?.primary ?
                song.artists.primary.map(artist => artist.name).join(', ') : 'Unknown Artist'),
            download_url: downloadUrl,
            downloadUrl: downloadUrlArray || song.downloadUrl,
            hasLyrics: song.hasLyrics,
            duration: song.duration || 0,
            image: song.image ? [
                { link: song.image[2]?.url || '' },
                { link: song.image[1]?.url || '' },
                { link: song.image[0]?.url || '' }
            ] : [{ link: '' }, { link: '' }, { link: '' }]
        }
    })
}

async function testSongAPI() {
    try {
        // Test search
        console.log('🔍 Testing search API...')
        const searchResponse = await fetch(`${BASE_URL}/api/search/songs?query=arijit&page=0&limit=2`)
        const searchData = await searchResponse.json()

        if (searchData.success && searchData.data.results.length > 0) {
            const firstSong = searchData.data.results[0]
            console.log('\n🎵 First song from search:')
            console.log('Song ID:', firstSong.id)
            console.log('Song Name:', firstSong.name)
            console.log('Download URL Array:', firstSong.downloadUrl)

            // Test formatting search results
            const formattedSearchSongs = formatSongs([firstSong])
            console.log('\n✅ Formatted search song:')
            console.log('ID:', formattedSearchSongs[0].id)
            console.log('Name:', formattedSearchSongs[0].name)
            console.log('download_url:', formattedSearchSongs[0].download_url)
            console.log('downloadUrl array:', formattedSearchSongs[0].downloadUrl)

            // Test getting individual song details
            console.log('\n📥 Testing individual song API...')
            const songResponse = await fetch(`${BASE_URL}/api/songs/${firstSong.id}`)
            const songData = await songResponse.json()

            if (songData.success && songData.data && Array.isArray(songData.data) && songData.data.length > 0) {
                const individualSong = songData.data[0]
                console.log('\n🎵 Individual song details:')
                console.log('Song ID:', individualSong.id)
                console.log('Song Name:', individualSong.name)
                console.log('Download URL Array:', individualSong.downloadUrl)

                // Test formatting individual song
                const formattedIndividualSongs = formatSongs([individualSong])
                console.log('\n✅ Formatted individual song:')
                console.log('ID:', formattedIndividualSongs[0].id)
                console.log('Name:', formattedIndividualSongs[0].name)
                console.log('download_url:', formattedIndividualSongs[0].download_url)
                console.log('downloadUrl array:', formattedIndividualSongs[0].downloadUrl)
            } else {
                console.log('❌ Individual song API failed or returned unexpected format')
                console.log('Response data:', songData.data)
            }
        }

    } catch (error) {
        console.error('❌ Error testing API:', error)
    }
}

testSongAPI()
