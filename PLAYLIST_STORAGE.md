# Playlist Storage System

## Overview
The Saafy music player uses **localStorage** to persist user playlists and queue data. No cookies or external storage needed - everything is stored locally in the browser.

## Storage Keys

### 1. `saafy_playlists`
Stores all user-created playlists as JSON.

**Structure:**
```json
[
  {
    "id": "1234567890",
    "name": "My Favorites",
    "description": "My favorite songs",
    "songs": [
      {
        "id": "song123",
        "name": "Song Title",
        "primaryArtists": "Artist Name",
        "image": [...],
        "duration": 180,
        ...
      }
    ],
    "createdAt": "2024-11-23T10:30:00.000Z",
    "updatedAt": "2024-11-23T11:45:00.000Z"
  }
]
```

### 2. `saafy_queue`
Stores the current playback queue.

**Structure:**
```json
[
  {
    "id": "song123",
    "queueId": "1234567890_0",
    "name": "Song Title",
    "primaryArtists": "Artist Name",
    ...
  }
]
```

## Features Implemented

### ✅ Playlist Management
- **Create Playlist**: Click "Create New Playlist" in Library
- **View Playlists**: Navigate to Library → Playlists tab
- **Add Songs**: Click ⋮ menu on any song → "Add to Playlist"
- **Delete Playlist**: Open playlist details → Click trash icon
- **Remove Songs**: View playlist → Click delete on individual songs

### ✅ Queue Management
- **Add to Queue**: Click ⋮ menu on any song → "Add to Queue"
- **View Queue**: Navigate to Queue page from sidebar
- **Reorder Queue**: Drag and drop (if implemented)
- **Clear Queue**: Click "Clear Queue" button in Queue page

### ✅ Persistence
- All playlists automatically save to localStorage
- Queue persists between sessions
- Data survives browser refresh
- No data loss on page reload

## How to Access

### View Your Playlists:
1. **Sidebar**: Scroll down to see "Your Playlists" section
   - Shows up to 8 most recent playlists
   - Click any playlist to view songs
   - Click + button to create new

2. **Library Page**: Click "Library" in sidebar
   - Full grid view of all playlists
   - Create new playlists
   - See song counts

3. **Playlist Details**: Click on any playlist
   - View all songs
   - Play all / Shuffle
   - Remove songs
   - Delete entire playlist

### Add Songs to Playlists:
1. Find any song (Home, Search, Albums, etc.)
2. Click the ⋮ (three dots) menu
3. Select "Add to Playlist"
4. Choose existing playlist OR create new

### Manage Queue:
1. Add songs using ⋮ menu → "Add to Queue"
2. View queue from sidebar or player bar queue button
3. Remove songs individually
4. Clear entire queue

## Storage Limits
- **localStorage limit**: ~5-10MB per domain (varies by browser)
- Typical playlist: ~1-2KB per song
- Approximate capacity: 2,500-5,000 songs across all playlists

## Data Privacy
- All data stored **locally** in your browser
- No server uploads
- No tracking
- No cookies needed
- Clear browser data to reset

## Developer Notes

### Adding Data:
```javascript
import { usePlaylist } from '@/context/PlaylistContext'

const { createPlaylist, addToPlaylist } = usePlaylist()

// Create playlist
const newPlaylist = createPlaylist("My Playlist", "Description")

// Add song to playlist
addToPlaylist(newPlaylist.id, songObject)
```

### Reading Data:
```javascript
const { playlists } = usePlaylist()

// Get all playlists
console.log(playlists)

// Find specific playlist
const myPlaylist = playlists.find(p => p.id === playlistId)
```

### Queue Operations:
```javascript
import { usePlaylist } from '@/context/PlaylistContext'

const { addToQueue, clearQueue } = usePlaylist()

// Add to queue
addToQueue(songObject)

// Clear queue
clearQueue()
```

## Troubleshooting

### Playlists not saving?
- Check browser console for errors
- Verify localStorage is enabled
- Check storage quota: `navigator.storage.estimate()`

### Data disappeared?
- Did you clear browser data?
- Are you in incognito/private mode? (localStorage clears on close)
- Check different browser profiles

### Storage full?
- View usage: Open DevTools → Application → Storage
- Delete old playlists to free space
- Clear queue if large

## File Locations

**Context Provider**: `src/context/PlaylistContext.jsx`
**UI Components**:
- Playlist Modal: `src/components/music/PlaylistModal.jsx`
- Library Page: `src/pages/Library.jsx`
- Playlist Details: `src/pages/PlaylistDetails.jsx`
- Sidebar: `src/components/layout/Sidebar.jsx`
