const playlistUrl = 'https://open.spotify.com/playlist/5jYQ4O9Ii3tQcSbJMtVrk8'
const userId = '65c26b3a2a7f5a001fb1e204' // A dummy or test user ID

async function runTest() {
  console.log('Sending import request for:', playlistUrl)
  try {
    const res = await fetch('http://localhost:5173/api/playlists/import-spotify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, playlistUrl })
    })

    console.log('Status:', res.status)
    const json = await res.json()
    console.log('Response JSON:', JSON.stringify(json, null, 2))
  } catch (err) {
    console.error('Error during test:', err)
  }
}

runTest()
