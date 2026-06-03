const fs = require('fs')
const path = require('path')

// Load environment variables from .env
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
  console.error("Failed to load .env file:", e)
}

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

async function run() {
  try {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    const { access_token } = await tokenResponse.json()

    // Search for public playlists
    const searchRes = await fetch('https://api.spotify.com/v1/search?q=lofi&type=playlist&limit=1', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    })

    const searchData = await searchRes.json()
    const playlistId = searchData.playlists?.items?.[0]?.id
    console.log("Querying Playlist ID:", playlistId)

    // Fetch with explicit fields
    const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name,images,tracks.items(track(id,name,artists,album(name,images),duration_ms))`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    })

    const data = await playlistResponse.json()
    console.log("Response Keys:", Object.keys(data))
    if (data.error) {
      console.log("Error returned:", data.error)
    } else {
      console.log("Playlist Name:", data.name)
      console.log("Has tracks property:", !!data.tracks)
      if (data.tracks) {
        console.log("Tracks items count:", data.tracks.items?.length)
        if (data.tracks.items && data.tracks.items.length > 0) {
          console.log("First track:", data.tracks.items[0].track)
        }
      }
    }
  } catch (err) {
    console.error("Execution error:", err)
  }
}

run()
