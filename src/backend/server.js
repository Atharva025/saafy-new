import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// Load .env manually to ensure environment variables are present
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (match) {
        const key = match[1]
        let val = match[2] || ''
        val = val.trim().replace(/(^['"]|['"]$)/g, '')
        process.env[key] = val
      }
    })
  }
} catch (e) {
  console.warn("Failed to load .env file manually:", e)
}

const MONGODB_URI = process.env.MONGODB_URI

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in the environment variables.")
  }

  // If already connecting, wait for it to complete
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (mongoose.connection.readyState !== 2) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    })
    if (mongoose.connection.readyState === 1) return
  }

  console.log("Connecting to MongoDB...")
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Fail fast after 5s instead of hanging
  })
  console.log("Connected to MongoDB successfully!")
}

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Clear cached model to prevent stale schemas when Vite reloads config in the same process
try {
  if (mongoose.models.User) {
    delete mongoose.models.User
  }
  mongoose.deleteModel('User')
} catch (e) {}

export const User = mongoose.model('User', userSchema, 'users')

// Playlist Schema
const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  image: { type: String }, // Optimized Base64 JPEG string
  songs: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    primaryArtists: { type: String },
    image: { type: String },
    duration: { type: Number },
    album: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
})

// Clear cached Playlist model
try {
  if (mongoose.models.Playlist) {
    delete mongoose.models.Playlist
  }
  mongoose.deleteModel('Playlist')
} catch (e) {}

export const Playlist = mongoose.model('Playlist', playlistSchema, 'playlists')

// Body parser helper
async function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (err) {
        reject(err)
      }
    })
  })
}

// JSON responder helper
const sendJson = (res, data, status = 200) => {
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = status
  res.end(JSON.stringify(data))
}

// Middleware handler for Vite
export async function viteBackendMiddleware(req, res, next) {
  // Only intercept /api/users and /api/playlists routes
  if (!req.url.startsWith('/api/users') && !req.url.startsWith('/api/playlists')) {
    return next()
  }

  // Ensure DB is connected
  await connectToDatabase()

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname
  const method = req.method

  try {
    // 1. Register User: POST /api/users/register
    if (method === 'POST' && pathname === '/api/users/register') {
      const { username, email, password } = await getJsonBody(req)

      if (!username || !email || !password) {
        return sendJson(res, { success: false, error: 'All fields are required' }, 400)
      }

      // Check if email or username already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] })
      if (existingUser) {
        const errorField = existingUser.email === email ? 'Email' : 'Username'
        return sendJson(res, { success: false, error: `${errorField} is already registered` }, 400)
      }

      // Create new user
      const user = new User({ username, email, password })
      await user.save()

      return sendJson(res, {
        success: true,
        message: 'User registered successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      }, 201)
    }

    // 2. Login User: POST /api/users/login
    if (method === 'POST' && pathname === '/api/users/login') {
      const { emailOrUsername, password } = await getJsonBody(req)

      if (!emailOrUsername || !password) {
        return sendJson(res, { success: false, error: 'All fields are required' }, 400)
      }

      // Find user by email or username
      const user = await User.findOne({
        $or: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername }
        ]
      })

      if (!user) {
        return sendJson(res, { success: false, error: 'Invalid credentials' }, 400)
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return sendJson(res, { success: false, error: 'Invalid credentials' }, 400)
      }

      return sendJson(res, {
        success: true,
        message: 'Logged in successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      }, 200)
    }

    // 3. Get All Users (for testing/debug connectivity): GET /api/users
    if (method === 'GET' && pathname === '/api/users') {
      const users = await User.find({}, '-password').sort({ createdAt: -1 })
      return sendJson(res, { success: true, users }, 200)
    }

    // 4. Get User Playlists: GET /api/playlists?userId=...
    if (method === 'GET' && pathname === '/api/playlists') {
      const userId = url.searchParams.get('userId')
      if (!userId) {
        return sendJson(res, { success: false, error: 'User ID is required' }, 400)
      }
      const playlists = await Playlist.find({ userId }).sort({ createdAt: -1 })
      return sendJson(res, { success: true, playlists }, 200)
    }

    // 5. Create Playlist: POST /api/playlists/create
    if (method === 'POST' && pathname === '/api/playlists/create') {
      const { userId, name, image } = await getJsonBody(req)
      if (!userId || !name) {
        return sendJson(res, { success: false, error: 'User ID and playlist name are required' }, 400)
      }
      const playlist = new Playlist({ userId, name, image, songs: [] })
      await playlist.save()
      return sendJson(res, { success: true, message: 'Playlist created successfully', playlist }, 201)
    }

    // 5b. Update Playlist: POST /api/playlists/update
    if (method === 'POST' && pathname === '/api/playlists/update') {
      const { userId, playlistId, name, image } = await getJsonBody(req)
      if (!userId || !playlistId) {
        return sendJson(res, { success: false, error: 'User ID and Playlist ID are required' }, 400)
      }
      const playlist = await Playlist.findOne({ _id: playlistId, userId })
      if (!playlist) {
        return sendJson(res, { success: false, error: 'Playlist not found' }, 404)
      }
      if (name !== undefined) playlist.name = name
      if (image !== undefined) playlist.image = image
      await playlist.save()
      return sendJson(res, { success: true, message: 'Playlist updated successfully', playlist }, 200)
    }

    // 6. Delete Playlist: POST /api/playlists/delete
    if (method === 'POST' && pathname === '/api/playlists/delete') {
      const { userId, playlistId } = await getJsonBody(req)
      if (!userId || !playlistId) {
        return sendJson(res, { success: false, error: 'User ID and Playlist ID are required' }, 400)
      }
      const deleted = await Playlist.findOneAndDelete({ _id: playlistId, userId })
      if (!deleted) {
        return sendJson(res, { success: false, error: 'Playlist not found' }, 404)
      }
      return sendJson(res, { success: true, message: 'Playlist deleted successfully' }, 200)
    }

    // 7. Add Song to Playlist: POST /api/playlists/add-song
    if (method === 'POST' && pathname === '/api/playlists/add-song') {
      const { userId, playlistId, song } = await getJsonBody(req)
      if (!userId || !playlistId || !song || !song.id) {
        return sendJson(res, { success: false, error: 'Missing required parameters' }, 400)
      }
      
      const playlist = await Playlist.findOne({ _id: playlistId, userId })
      if (!playlist) {
        return sendJson(res, { success: false, error: 'Playlist not found' }, 404)
      }

      // Check if song already exists in playlist
      const exists = playlist.songs.some(s => s.id === song.id)
      if (exists) {
        return sendJson(res, { success: false, error: 'Song is already in this playlist' }, 400)
      }

      // Extract details
      const imageUrl = song.image?.[2]?.link || song.image?.[2]?.url ||
                       song.image?.[1]?.link || song.image?.[1]?.url ||
                       song.image?.[0]?.link || song.image?.[0]?.url ||
                       song.imageUrl || ''

      const cleanSong = {
        id: String(song.id),
        name: song.name || song.title,
        primaryArtists: song.primaryArtists || '',
        image: imageUrl,
        duration: Number(song.duration) || 0,
        album: song.album?.name || song.album || ''
      }

      playlist.songs.push(cleanSong)
      await playlist.save()

      return sendJson(res, { success: true, message: 'Song added to playlist', playlist }, 200)
    }

    // 8. Remove Song from Playlist: POST /api/playlists/remove-song
    if (method === 'POST' && pathname === '/api/playlists/remove-song') {
      const { userId, playlistId, songId } = await getJsonBody(req)
      if (!userId || !playlistId || !songId) {
        return sendJson(res, { success: false, error: 'Missing required parameters' }, 400)
      }

      const playlist = await Playlist.findOne({ _id: playlistId, userId })
      if (!playlist) {
        return sendJson(res, { success: false, error: 'Playlist not found' }, 404)
      }

      playlist.songs = playlist.songs.filter(s => s.id !== songId)
      await playlist.save()

      return sendJson(res, { success: true, message: 'Song removed from playlist', playlist }, 200)
    }

    // 9. Import Spotify Playlist: POST /api/playlists/import-spotify
    if (method === 'POST' && pathname === '/api/playlists/import-spotify') {
      const { userId, playlistUrl } = await getJsonBody(req)
      if (!userId || !playlistUrl) {
        return sendJson(res, { success: false, error: 'User ID and Spotify Playlist URL/ID are required' }, 400)
      }

      // Reload .env manually to ensure fresh variables are present
      try {
        const envPath = path.resolve(process.cwd(), '.env')
        if (fs.existsSync(envPath)) {
          const envConfig = fs.readFileSync(envPath, 'utf8')
          envConfig.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
            if (match) {
              const key = match[1]
              let val = match[2] || ''
              val = val.trim().replace(/(^['"]|['"]$)/g, '')
              process.env[key] = val
            }
          })
        }
      } catch (e) {
        console.warn("Failed to reload .env dynamically inside handler:", e)
      }

      // Extract playlist ID
      let playlistId = playlistUrl.trim()
      if (playlistId.includes('spotify.com') || playlistId.includes('open.spotify')) {
        const urlMatch = playlistId.match(/playlist\/([a-zA-Z0-9]+)/)
        if (urlMatch) {
          playlistId = urlMatch[1]
        } else {
          return sendJson(res, { success: false, error: 'Invalid Spotify playlist URL format' }, 400)
        }
      } else if (playlistId.startsWith('spotify:playlist:')) {
        playlistId = playlistId.replace('spotify:playlist:', '')
      }

      // Check if credentials are present
      const clientId = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

      if (!clientId || !clientSecret || clientId === 'your_spotify_client_id_here' || clientSecret === 'your_spotify_client_secret_here') {
        return sendJson(res, { 
          success: false, 
          error: 'Spotify API credentials are not configured on the server. Please add your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to the .env file.' 
        }, 500)
      }

      try {
        let playlistName = 'Imported Spotify Playlist'
        let playlistCoverUrl = null
        let songs = []
        let importedVia = 'api'

        const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
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

            // Fetch playlist items (tracks) with pagination support
            console.log(`Fetching playlist items for ${playlistId} from API...`)
            let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`
            let pageCount = 0

            while (nextUrl && pageCount < 5) {
              pageCount++
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
              image: playlistCoverUrl, // Scraper doesn't have per-track images, fall back to playlist cover
              duration,
              album: albumName
            }
          })

          console.log(`Successfully scraped ${songs.length} tracks from public Spotify embed page.`)
        }

        // Convert cover image to base64 if url is present
        let playlistBase64Image = null
        if (playlistCoverUrl) {
          try {
            const imgRes = await fetch(playlistCoverUrl)
            if (imgRes.ok) {
              const buffer = await imgRes.arrayBuffer()
              const base64 = Buffer.from(buffer).toString('base64')
              playlistBase64Image = `data:image/jpeg;base64,${base64}`
            }
          } catch (imgErr) {
            console.warn('Failed to convert playlist cover image to base64:', imgErr)
          }
        }

        // Save imported playlist to Saafy DB
        const playlist = new Playlist({
          userId,
          name: playlistName,
          image: playlistBase64Image,
          songs
        })

        await playlist.save()

        return sendJson(res, {
          success: true,
          message: `Spotify playlist imported successfully via ${importedVia}!`,
          playlist
        }, 201)

      } catch (spotifyErr) {
        console.error('Spotify import error:', spotifyErr)
        return sendJson(res, { success: false, error: `Spotify API Error: ${spotifyErr.message}` }, 500)
      }
    }

    // Route not matched
    return sendJson(res, { success: false, error: 'Not found' }, 404)

  } catch (error) {
    console.error('API Error:', error)
    return sendJson(res, { success: false, error: error.message || 'Internal server error' }, 500)
  }
}
