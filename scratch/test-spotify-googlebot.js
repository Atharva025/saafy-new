const fs = require('fs')

async function run() {
  const playlistId = '37i9dQZF1DXcBWIGx2xt4s' // Today's Top Hits
  const url = `https://open.spotify.com/playlist/${playlistId}`
  
  console.log("Fetching playlist page with Googlebot User-Agent:", url)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/intl/bot.html)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    if (!res.ok) {
      console.error("Page fetch failed:", res.status, res.statusText)
      return
    }

    const html = await res.text()
    fs.writeFileSync('scratch/spotify-googlebot.html', html)
    console.log("HTML page saved to scratch/spotify-googlebot.html. Size:", html.length, "bytes")

    // Let's check if the HTML contains the track name "Ferrari" (which is in Today's Top Hits / search results)
    // or common keywords
    if (html.toLowerCase().includes('ferrari') || html.toLowerCase().includes('music') || html.toLowerCase().includes('artists')) {
      console.log("Page contains track/artist keywords!")
    }

    // Check for JSON inside the page
    const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) ||
                      html.match(/<script id="initial-state" type="text\/plain">([\s\S]*?)<\/script>/)
    if (jsonMatch) {
      console.log("Found structured script tag! Length:", jsonMatch[1].length)
      fs.writeFileSync('scratch/googlebot-json.txt', jsonMatch[1])
    } else {
      console.log("No NEXT_DATA or initial-state script tag found.")
    }
  } catch (err) {
    console.error("Error scraping page:", err)
  }
}

run()
