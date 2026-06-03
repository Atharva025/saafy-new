const fs = require('fs')
require('dotenv').config()

async function testApi() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const playlistId = '5jYQ4O9Ii3tQcSbJMtVrk8'

  if (!clientId || !clientSecret) {
    console.error('No credentials in .env!')
    return
  }

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

    if (!tokenResponse.ok) {
      console.error('Failed to get token:', tokenResponse.status, await tokenResponse.text())
      return
    }

    const { access_token } = await tokenResponse.json()
    console.log('Successfully got client credentials token.')

    // Fetch playlist details
    const playlistUrl = `https://api.spotify.com/v1/playlists/${playlistId}`
    console.log('Fetching:', playlistUrl)
    const playlistResponse = await fetch(playlistUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

    console.log('Playlist Response Status:', playlistResponse.status)
    const responseData = await playlistResponse.json()
    console.log('Playlist Response Keys:', Object.keys(responseData))
    if (responseData.name) {
      console.log('Playlist Name:', responseData.name)
      console.log('Images:', responseData.images)
      console.log('Tracks Object Keys:', responseData.tracks ? Object.keys(responseData.tracks) : 'No tracks object')
      if (responseData.tracks) {
        console.log('Tracks items length:', responseData.tracks.items?.length)
        console.log('Tracks items:', responseData.tracks.items)
      }
    } else {
      console.log('Error/Response Details:', JSON.stringify(responseData))
    }
  } catch (err) {
    console.error('Error testing API:', err)
  }
}

testApi()
