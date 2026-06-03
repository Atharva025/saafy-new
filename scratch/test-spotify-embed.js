const fs = require('fs')

async function run() {
  const playlistId = '5jYQ4O9Ii3tQcSbJMtVrk8'
  const url = `https://open.spotify.com/embed/playlist/${playlistId}`
  
  console.log("Fetching Spotify Embed page:", url)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!res.ok) {
      console.error("Embed page fetch failed:", res.status, res.statusText)
      return
    }

    const html = await res.text()
    fs.writeFileSync('scratch/spotify-embed.html', html)
    console.log("HTML page saved to scratch/spotify-embed.html. Size:", html.length, "bytes")

    // Look for track data inside __NEXT_DATA__
    const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1])
      console.log("__NEXT_DATA__ status:", data.props?.pageProps?.status)
      console.log("__NEXT_DATA__ pageProps keys:", Object.keys(data.props?.pageProps || {}))
      
      const playlist = data.props?.pageProps?.state?.playlist || data.props?.pageProps?.playlist
      if (playlist) {
        console.log("Playlist name in Embed:", playlist.name)
        console.log("Track list items count in Embed:", playlist.tracks?.items?.length)
      } else {
        console.log("Playlist object not found. pageProps keys:", Object.keys(data.props?.pageProps || {}))
        // Write pageProps to file for debugging
        fs.writeFileSync('scratch/page-props.json', JSON.stringify(data.props?.pageProps, null, 2))
      }
    }
  } catch (err) {
    console.error("Error fetching embed page:", err)
  }
}

run()
