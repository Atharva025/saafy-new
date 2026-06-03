const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

// Parse .env manually
function loadEnv() {
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
}

loadEnv()

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
const port = 8888
const redirectUri = `http://127.0.0.1:${port}/callback`

if (!clientId || !clientSecret || clientId === 'your_spotify_client_id_here' || clientSecret === 'your_spotify_client_secret_here') {
  console.error('\x1b[31mError: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be configured in your .env file before running this script.\x1b[0m')
  process.exit(1)
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`)
  
  if (reqUrl.pathname === '/') {
    // Landing page with instructions
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`
      <html>
        <head>
          <title>Saafy Spotify Auth</title>
          <style>
            body { font-family: 'Outfit', -apple-system, sans-serif; background: #0b0f19; color: #f3f4f6; text-align: center; padding: 50px; }
            .card { background: #111827; border-radius: 12px; padding: 40px; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-width: 500px; border: 1px solid #1f2937; }
            h1 { color: #10b981; }
            a.btn { background: #1db954; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 20px; transition: transform 0.2s; }
            a.btn:hover { transform: scale(1.05); }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Spotify Playlist Import Authorization</h1>
            <p>Connect your Spotify account to enable importing playlists including all tracks using the Spotify Web API.</p>
            <a href="/login" class="btn">Log In with Spotify</a>
          </div>
        </body>
      </html>
    `)
  } else if (reqUrl.pathname === '/login') {
    // Redirect to Spotify accounts authorize endpoint
    const scope = encodeURIComponent('playlist-read-private playlist-read-collaborative')
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`
    res.writeHead(302, { 'Location': spotifyAuthUrl })
    res.end()
  } else if (reqUrl.pathname === '/callback') {
    const code = reqUrl.searchParams.get('code')
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('Missing authorization code.')
      return
    }

    try {
      // Exchange code for tokens
      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        })
      })

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text()
        throw new Error(`Failed token exchange: ${tokenRes.status} ${errorText}`)
      }

      const tokenData = await tokenRes.json()
      const refreshToken = tokenData.refresh_token

      if (!refreshToken) {
        throw new Error('No refresh token returned by Spotify.')
      }

      // Update .env file
      const envPath = path.resolve(process.cwd(), '.env')
      let envContent = ''
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8')
      }

      const tokenLine = `SPOTIFY_REFRESH_TOKEN=${refreshToken}`
      if (envContent.includes('SPOTIFY_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/SPOTIFY_REFRESH_TOKEN\s*=\s*[^\r\n]*/g, tokenLine)
      } else {
        envContent += `\n# Spotify User Refresh Token (Generated via get-spotify-token.js)\n${tokenLine}\n`
      }

      fs.writeFileSync(envPath, envContent, 'utf8')
      console.log('\n\x1b[32mSuccessfully authenticated! SPOTIFY_REFRESH_TOKEN has been saved to your .env file.\x1b[0m')
      console.log('You can now close your browser tab and stop the token script.\n')

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`
        <html>
          <head>
            <title>Success</title>
            <style>
              body { font-family: 'Outfit', -apple-system, sans-serif; background: #0b0f19; color: #f3f4f6; text-align: center; padding: 50px; }
              .card { background: #111827; border-radius: 12px; padding: 40px; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-width: 500px; border: 1px solid #1f2937; }
              h1 { color: #10b981; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Authentication Successful!</h1>
              <p>The <strong>SPOTIFY_REFRESH_TOKEN</strong> has been successfully added to your <strong>.env</strong> file.</p>
              <p>You can close this tab now. The local script will now exit.</p>
            </div>
          </body>
        </html>
      `)

      // Gracefully shut down the server and exit
      setTimeout(() => {
        server.close()
        process.exit(0)
      }, 2000)

    } catch (err) {
      console.error('Error during authentication callback:', err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end(`Authentication Error: ${err.message}`)
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
})

server.listen(port, () => {
  console.log(`\n\x1b[36mSpotify Authorization Server running at http://127.0.0.1:${port}\x1b[0m`)
  console.log('Please open this URL in your web browser to link your Spotify account.\n')
})
