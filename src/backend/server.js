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

let isConnected = false

export async function connectToDatabase() {
  if (isConnected) return
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in the environment variables.")
    return
  }
  try {
    await mongoose.connect(MONGODB_URI)
    isConnected = true
    console.log("Connected to MongoDB successfully!")
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
  }
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
      const { userId, name } = await getJsonBody(req)
      if (!userId || !name) {
        return sendJson(res, { success: false, error: 'User ID and playlist name are required' }, 400)
      }
      const playlist = new Playlist({ userId, name, songs: [] })
      await playlist.save()
      return sendJson(res, { success: true, message: 'Playlist created successfully', playlist }, 201)
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

    // Route not matched
    return sendJson(res, { success: false, error: 'Not found' }, 404)

  } catch (error) {
    console.error('API Error:', error)
    return sendJson(res, { success: false, error: error.message || 'Internal server error' }, 500)
  }
}
