const fs = require('fs')

async function run() {
  const playlistId = '37i9dQZF1DXcBWIGx2xt4s' // Today's Top Hits
  const url = `https://open.spotify.com/playlist/${playlistId}`
  
  console.log("Fetching public playlist page:", url)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!res.ok) {
      console.error("Page fetch failed:", res.status, res.statusText)
      return
    }

    const html = await res.text()
    fs.writeFileSync('scratch/spotify-page.html', html)
    console.log("HTML page saved to scratch/spotify-page.html. Size:", html.length, "bytes")

    // Let's search for JSON data in script tags
    // Spotify often embeds data in a script tag like:
    // <script id="initial-state" type="text/plain">...</script>
    // or <script id="session" type="application/json">...</script>
    // or in window.__initialState or similar.
    
    // Let's print out all script tags in the HTML
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm
    let match
    let scriptCount = 0
    while ((match = scriptRegex.exec(html)) !== null) {
      scriptCount++
      const content = match[1]
      if (content.includes('track') && content.includes('artist')) {
        console.log(`Script tag ${scriptCount} contains 'track' and 'artist'. Length:`, content.length)
        if (content.length < 5000) {
          console.log("Snippet:", content.substring(0, 500))
        } else {
          console.log("Snippet (large):", content.substring(0, 500))
        }
      }
    }
  } catch (err) {
    console.error("Error scraping page:", err)
  }
}

run()
