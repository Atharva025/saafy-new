const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config()

// Load Playlist Schema or Mock DB Save
const MONGODB_URI = process.env.MONGODB_URI

// Mock Playlist Model
const playlistSchema = new mongoose.Schema({
  userId: String,
  name: String,
  image: String,
  songs: [Object]
})
const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema)

const playlistUrl = 'https://open.spotify.com/playlist/5jYQ4O9Ii3tQcSbJMtVrk8'
const userId = '65c26b3a2a7f5a001fb1e204'

async function runDirectTest() {
  console.log('Connecting to DB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected!')

  let playlistId = playlistUrl.trim()
  if (playlistId.includes('spotify.com') || playlistId.includes('open.spotify')) {
    const urlMatch = playlistId.match(/playlist\/([a-zA-Z0-9]+)/)
    if (urlMatch) {
      playlistId = urlMatch[1]
    }
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  console.log('Client ID:', clientId ? 'Found' : 'Missing')
  console.log('Client Secret:', clientSecret ? 'Found' : 'Missing')
  console.log('Refresh Token:', refreshToken ? 'Found' : 'Missing')

  try {
    let playlistName = 'Imported Spotify Playlist'
    let playlistCoverUrl = null
    let songs = []
    let importedVia = 'api'

    const hasRefreshToken = refreshToken && refreshToken !== 'your_spotify_refresh_token_here'

    if (hasRefreshToken) {
      try {
        console.log('Using SPOTIFY_REFRESH_TOKEN to authenticate with Spotify API...')
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          })
        })

        if (!tokenResponse.ok) {
          const errData = await tokenResponse.json().catch(() => ({}))
          throw new Error(`Failed to refresh access token: ${errData.error_description || tokenResponse.statusText}`)
        }

        const { access_token } = await tokenResponse.json()
        console.log('Successfully refreshed user access token.')

        // Fetch playlist details from Spotify API
        console.log(`Fetching playlist metadata for ${playlistId} from API...`)
        const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        })

        if (!playlistResponse.ok) {
          throw new Error(`Failed to fetch playlist details: ${playlistResponse.statusText}`)
        }

        const spotifyPlaylist = await playlistResponse.json()
        playlistName = spotifyPlaylist.name || 'Imported Spotify Playlist'
        if (spotifyPlaylist.images && spotifyPlaylist.images.length > 0) {
          playlistCoverUrl = spotifyPlaylist.images[0].url
        }
        console.log('Playlist details fetched successfully. Name:', playlistName)

        // Fetch playlist items (tracks) with pagination support
        console.log(`Fetching playlist items for ${playlistId} from API...`)
        let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`
        let pageCount = 0

        while (nextUrl && pageCount < 5) {
          pageCount++
          console.log(`Fetching tracks page ${pageCount}:`, nextUrl)
          const itemsResponse = await fetch(nextUrl, {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          })

          if (!itemsResponse.ok) {
            throw new Error(`Failed to fetch playlist items on page ${pageCount}: ${itemsResponse.statusText} (${itemsResponse.status})`)
          }

          const itemsData = await itemsResponse.json()
          const items = itemsData.items || []
          console.log(`Page ${pageCount} returned ${items.length} items.`)

          const mappedTracks = items
            .filter(item => item && item.track)
            .map(item => {
              const track = item.track
              const artistNames = track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown Artist'
              const albumName = track.album ? track.album.name : ''
              const imageUrl = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || ''

              return {
                id: `spotify:${track.id}`,
                name: track.name || 'Unknown Track',
                primaryArtists: artistNames,
                image: imageUrl,
                duration: Math.round((track.duration_ms || 0) / 1000),
                album: albumName
              }
            })

          songs.push(...mappedTracks)
          nextUrl = itemsData.next
        }

        console.log(`Successfully fetched ${songs.length} tracks via Spotify Web API.`)

      } catch (apiErr) {
        console.warn('Spotify API call failed, falling back to scraper path:', apiErr.message)
        importedVia = 'scraper'
      }
    } else {
      console.log('No SPOTIFY_REFRESH_TOKEN found in .env, using scraper path...')
      importedVia = 'scraper'
    }

    // Scraper Path
    if (importedVia === 'scraper') {
      console.log(`Scraping public Spotify embed page for playlist ${playlistId}...`)
      const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`
      const embedRes = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })

      if (!embedRes.ok) {
        throw new Error(`Failed to fetch public Spotify playlist embed page: ${embedRes.status} ${embedRes.statusText}`)
      }

      const html = await embedRes.text()
      const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
      if (!jsonMatch) {
        throw new Error('Could not parse playlist tracks from public embed page.')
      }

      const data = JSON.parse(jsonMatch[1])
      const entity = data.props?.pageProps?.state?.data?.entity || data.props?.pageProps?.playlist
      if (!entity) {
        throw new Error('Spotify playlist data not found in embed page.')
      }

      playlistName = entity.name || entity.title || 'Imported Spotify Playlist'
      playlistCoverUrl = entity.coverArt?.sources?.[0]?.url || entity.images?.[0]?.url || ''

      const trackList = entity.trackList || entity.tracks?.items || []
      songs = trackList.map(item => {
        const trackId = item.uri ? item.uri.split(':').pop() : ''
        const trackName = item.title || item.name || 'Unknown Track'
        
        let artistNames = 'Unknown Artist'
        if (item.subtitle) {
          artistNames = item.subtitle.replace(/\u00a0/g, ' ')
        } else if (item.artists) {
          artistNames = item.artists.map(a => a.name).join(', ')
        } else if (item.track?.artists) {
          artistNames = item.track.artists.map(a => a.name).join(', ')
        }

        const duration = item.duration ? Math.round(item.duration / 1000) : 
                        (item.track?.duration_ms ? Math.round(item.track.duration_ms / 1000) : 0)

        const albumName = item.album?.name || playlistName

        return {
          id: `spotify:${trackId}`,
          name: trackName,
          primaryArtists: artistNames,
          image: playlistCoverUrl,
          duration,
          album: albumName
        }
      })

      console.log(`Successfully scraped ${songs.length} tracks from public Spotify embed page.`)
    }

    console.log('Import Finished. Total Songs:', songs.length)
    if (songs.length > 0) {
      console.log('First Song:', songs[0])
    }
  } catch (err) {
    console.error('API Error details:', err)
  } finally {
    await mongoose.disconnect()
  }
}

runDirectTest()
