# Saafy — React Native Mobile App (Full Agent Specification)

> **This document is the single source of truth for building the Saafy music streaming app for iOS and Android using React Native + Expo + TypeScript. Read every section in full before writing a single line of code.**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Development Environment & Constraints](#2-development-environment--constraints)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Project Structure](#4-project-structure)
5. [Design System — Colors, Typography, Tokens](#5-design-system--colors-typography-tokens)
6. [Backend & API Architecture](#6-backend--api-architecture)
7. [Database Schema (MongoDB)](#7-database-schema-mongodb)
8. [State Management Architecture](#8-state-management-architecture)
9. [Screen-by-Screen UI Specification](#9-screen-by-screen-ui-specification)
10. [Component Specifications](#10-component-specifications)
11. [Audio Player Logic](#11-audio-player-logic)
12. [Discovery & Recommendations Engine](#12-discovery--recommendations-engine)
13. [Authentication System](#13-authentication-system)
14. [Playlist Management](#14-playlist-management)
15. [Local Storage & Encryption Strategy](#15-local-storage--encryption-strategy)
16. [Navigation Architecture](#16-navigation-architecture)
17. [Animations & Micro-interactions](#17-animations--micro-interactions)
18. [Expo Go Compatibility & Known Constraints](#18-expo-go-compatibility--known-constraints)
19. [Environment Variables](#19-environment-variables)
20. [Step-by-Step Build Order](#20-step-by-step-build-order)

---

## 1. Project Overview

**App Name:** Saafy  
**Type:** Music streaming app (Bollywood, Hindi, Punjabi, Marathi, English)  
**Platform:** iOS (primary) + Android (secondary)  
**Framework:** React Native + Expo (managed workflow)  
**Language:** TypeScript (strict, everywhere)  
**Music Source:** JioSaavn API (via a custom reverse-proxy at `https://saafy-api.vercel.app`)  
**AI Recommendations:** Custom HuggingFace Space at `https://atharva025-saafy-music-recommender.hf.space/api`  
**User Backend:** MongoDB Atlas via REST API calls to Vercel serverless functions  

### What the app does

- Stream millions of songs from JioSaavn at up to 320 kbps
- Smart home feed: "For You" mix, language sections (Hindi, English, Punjabi, Marathi), and themed sections (Trending, Party, Chill, Romantic, Workout)
- Full-featured audio player: play/pause, prev/next, seek, volume, shuffle, repeat (none/one/all)
- Play queue: add songs, reorder, remove, view "Now Playing"
- Search: instant type-ahead suggestions + full results page
- Artist pages: bio, top songs, discography browsing
- User authentication: register/login, sessions encrypted in AsyncStorage
- Playlist management: create, rename, add/remove songs, custom cover images, Spotify import
- Listening history: tracks last 50 played songs per user (guest or logged in)
- AI-powered recommendations: feeds played songs to a vector-similarity model, returns "More Like This"
- Dynamic theming: warm terracotta color scheme, full dark/light mode toggle

---

## 2. Development Environment & Constraints

### Developer Machine

- **OS:** Windows 11 Home Single Language (ARM64)
- **CPU:** Snapdragon X Plus X1P42-100
- **RAM:** 16 GB
- **GPU:** Qualcomm Adreno X1
- **IDE:** Visual Studio Code on Windows ARM

### Hard Constraints (NON-NEGOTIABLE)

| Constraint | Detail |
|---|---|
| ❌ No Android Studio | Cannot install / use Android Emulator |
| ❌ No Xcode / Mac | No iOS Simulator |
| ✅ Expo Go only | ALL testing via Expo Go on physical iOS + Android devices |
| ✅ Windows ARM dev | Every build script must run on Windows ARM via PowerShell |
| ✅ Expo managed | No `expo eject` or `expo prebuild` unless absolutely unavoidable |
| ✅ TypeScript everywhere | `.ts` / `.tsx` only — no `.js` files in `src/` |

### Target Devices

- **Primary:** iPhone running Expo Go (iOS 16+)
- **Secondary:** Android phone running Expo Go (Android 10+)

### Audio Playback

Use `expo-av` (Audio) for all audio playback. This works inside Expo Go on both platforms without any native build step.

---

## 3. Tech Stack & Dependencies

### Core

```json
{
  "expo": "~52.x",
  "react": "18.3.x",
  "react-native": "0.76.x",
  "typescript": "~5.3.x"
}
```

### Navigation

```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "@react-navigation/stack": "^6.x",
  "react-native-screens": "~3.34.x",
  "react-native-safe-area-context": "^4.x"
}
```

### Audio & Media

```json
{
  "expo-av": "~14.x"
}
```

### UI & Animations

```json
{
  "react-native-reanimated": "~3.16.x",
  "react-native-gesture-handler": "~2.20.x",
  "expo-linear-gradient": "~14.x",
  "expo-blur": "~14.x",
  "@expo/vector-icons": "^14.x"
}
```

### Storage & Utilities

```json
{
  "@react-native-async-storage/async-storage": "^2.x",
  "expo-image-picker": "~15.x",
  "expo-image-manipulator": "~12.x",
  "expo-file-system": "~17.x",
  "expo-sharing": "~12.x"
}
```

### HTTP & State

```json
{
  "axios": "^1.x",
  "zustand": "^4.x"
}
```

### Typography (Google Fonts via Expo)

```json
{
  "@expo-google-fonts/sora": "^0.x",
  "@expo-google-fonts/space-grotesk": "^0.x",
  "@expo-google-fonts/syne": "^0.x",
  "expo-font": "~12.x"
}
```

> **Note:** Do NOT use Tailwind CSS. Use React Native StyleSheet objects for all styling.

---

## 4. Project Structure

```
saafy-mobile/
├── app.json
├── tsconfig.json
├── .env                          # Environment variables
├── assets/
│   ├── fonts/                    # If local font files needed
│   └── images/
│       └── logo.png
├── src/
│   ├── api/                      # API client layer
│   │   ├── client.ts             # Axios instance with base URL, interceptors
│   │   ├── songs.ts              # Song search, get, suggestions
│   │   ├── artists.ts            # Artist API calls
│   │   ├── auth.ts               # Register, login
│   │   ├── playlists.ts          # Playlist CRUD
│   │   └── recommender.ts        # HuggingFace recommender API
│   ├── components/               # Reusable UI components
│   │   ├── Player/
│   │   │   ├── MiniPlayer.tsx    # Bottom mini player bar
│   │   │   ├── FullPlayer.tsx    # Expanded full-screen player
│   │   │   └── PlayerControls.tsx
│   │   ├── Song/
│   │   │   ├── SongCard.tsx      # Square card for carousels
│   │   │   ├── SongRow.tsx       # List row item
│   │   │   └── SongImage.tsx     # Lazy-loading image with fallback
│   │   ├── Playlist/
│   │   │   ├── PlaylistCard.tsx
│   │   │   └── PlaylistRow.tsx
│   │   ├── Queue/
│   │   │   └── QueueSheet.tsx    # Bottom sheet for queue
│   │   ├── Search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchSuggestions.tsx
│   │   ├── Auth/
│   │   │   ├── AuthModal.tsx
│   │   │   └── AuthForm.tsx
│   │   ├── Skeleton.tsx          # Loading skeleton shimmer
│   │   ├── Toast.tsx             # Toast notification
│   │   └── Layout/
│   │       ├── Screen.tsx        # Safe area wrapper
│   │       └── Header.tsx
│   ├── contexts/
│   │   ├── PlayerContext.tsx     # Audio state, current song, queue
│   │   ├── ThemeContext.tsx      # Light/dark mode, color tokens
│   │   └── ToastContext.tsx      # Global toast messages
│   ├── hooks/
│   │   ├── usePlayer.ts          # Access player context safely
│   │   ├── useTheme.ts           # Access theme context
│   │   ├── useToast.ts           # Access toast context
│   │   ├── useDiscovery.ts       # Discovery content fetching
│   │   ├── useAuth.ts            # Current user + auth state
│   │   └── useDebounce.ts        # Debounce hook for search
│   ├── screens/
│   │   ├── HomeScreen.tsx        # Main feed / discovery
│   │   ├── SearchScreen.tsx      # Search + results
│   │   ├── LibraryScreen.tsx     # Playlists + history
│   │   ├── ArtistScreen.tsx      # Artist detail page
│   │   ├── PlaylistScreen.tsx    # Single playlist detail
│   │   └── SettingsScreen.tsx    # App settings
│   ├── store/
│   │   └── playerStore.ts        # Zustand store for player state
│   ├── lib/
│   │   ├── discovery.ts          # Discovery pools + seeded randomness
│   │   ├── security.ts           # Input sanitization, rate limiting
│   │   ├── storage.ts            # AsyncStorage encrypted wrapper
│   │   └── utils.ts              # Time formatting, image URL helpers
│   ├── constants/
│   │   ├── colors.ts             # Light and dark color palettes
│   │   ├── fonts.ts              # Font family names
│   │   └── tokens.ts             # Spacing, radius, z-index
│   └── types/
│       ├── song.ts               # Song, Artist, Album interfaces
│       ├── playlist.ts           # Playlist, PlaylistSong interfaces
│       ├── user.ts               # User interface
│       └── navigation.ts         # Navigation param types
└── App.tsx                       # Root component with providers
```

---

## 5. Design System — Colors, Typography, Tokens

### Brand Identity

Saafy uses a **warm terracotta rust** accent color as its brand identity, layered over a skeuomorphic surface design system. The aesthetic is premium — think Apple Music meets Notion: clean, tactile, warm.

### Color Palettes

#### Light Mode

```typescript
// src/constants/colors.ts
export const lightColors = {
  // Surfaces (light → dark layering)
  paper: '#FDFBF9',          // Main background
  paperDark: '#F5F2EB',      // Cards, elevated surfaces
  paperDarker: '#EAE5DB',    // Inputs, recessed wells

  // Text hierarchy
  ink: '#1A1614',            // Primary text
  inkMuted: '#6B635B',       // Secondary text / subtitles
  inkLight: '#9C948B',       // Tertiary / disabled / placeholder

  // Accent (terra-cotta rust) — the brand color
  accent: '#C45C3E',
  accentHover: '#A94E34',
  accentActive: '#8C3F28',
  accentSubtle: 'rgba(196, 92, 62, 0.08)',
  accentBorder: 'rgba(196, 92, 62, 0.18)',

  // Structure
  rule: '#EAE5DB',           // Dividers
  border: 'rgba(26, 22, 20, 0.09)',

  // Overlays
  overlay: 'rgba(253, 251, 249, 0.88)',
  overlayDeep: 'rgba(253, 251, 249, 0.96)',

  // Shadows (warm-toned)
  shadowSm: '0 1px 3px rgba(26, 22, 20, 0.07)',
  shadowMd: '0 4px 14px rgba(26, 22, 20, 0.09)',
  shadowLg: '0 12px 36px rgba(26, 22, 20, 0.13)',
  shadowXl: '0 24px 64px rgba(26, 22, 20, 0.16)',
}
```

#### Dark Mode

```typescript
export const darkColors = {
  // Surfaces
  paper: '#1A1614',          // Main background (very dark brown-black)
  paperDark: '#252220',      // Cards, elevated surfaces
  paperDarker: '#2F2B28',    // Inputs, recessed

  // Text hierarchy
  ink: '#FAF7F2',            // Primary text (warm white)
  inkMuted: '#A8A19A',       // Secondary text
  inkLight: '#6B635B',       // Tertiary / disabled

  // Accent (slightly warmer/brighter for dark mode)
  accent: '#E07356',
  accentHover: '#C45C3E',
  accentActive: '#A84E33',
  accentSubtle: 'rgba(224, 115, 86, 0.12)',
  accentBorder: 'rgba(224, 115, 86, 0.22)',

  // Structure
  rule: '#3A3633',
  border: 'rgba(255, 255, 255, 0.07)',

  // Overlays
  overlay: 'rgba(26, 22, 20, 0.88)',
  overlayDeep: 'rgba(26, 22, 20, 0.96)',

  // Shadows
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.22)',
  shadowMd: '0 4px 14px rgba(0, 0, 0, 0.30)',
  shadowLg: '0 12px 36px rgba(0, 0, 0, 0.40)',
  shadowXl: '0 24px 64px rgba(0, 0, 0, 0.50)',
}
```

### Typography

The app uses **3 font families** loaded via `@expo-google-fonts`:

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display | **Syne** | 600, 700, 800 | Section headings, screen titles, artist names |
| Primary | **Sora** | 300, 400, 500, 600, 700 | Body text, song titles, UI copy, button labels |
| Mono / Label | **Space Grotesk** | 300, 400, 500, 600, 700 | Badges, timestamps, metadata, uppercase labels, track counters |

```typescript
// src/constants/fonts.ts
export const fonts = {
  display: 'Syne_800ExtraBold',   // For headings
  displayBold: 'Syne_700Bold',
  primary: 'Sora_400Regular',     // Default body
  primaryMedium: 'Sora_500Medium',
  primarySemiBold: 'Sora_600SemiBold',
  primaryBold: 'Sora_700Bold',
  mono: 'SpaceGrotesk_400Regular',
  monoMedium: 'SpaceGrotesk_500Medium',
  monoSemiBold: 'SpaceGrotesk_600SemiBold',
}
```

### Spacing System (4px grid)

```typescript
// src/constants/tokens.ts
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
}
```

### Border Radius

```typescript
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
}
```

### Z-Index Scale

```typescript
export const zIndex = {
  base: 1,
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
  player: 70,
}
```

### Toast Colors (from web implementation)

```typescript
export const toastColors = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#E07356', // uses accent
}
```

---

## 6. Backend & API Architecture

### External APIs

#### 1. JioSaavn API (Primary Music Source)

**Base URL:** `https://saafy-api.vercel.app`  
All music content (search, songs, artists, albums) comes from this reverse-proxy.

```
GET /api/search/songs?query={q}&page={p}&limit={n}
GET /api/search/albums?query={q}&page={p}&limit={n}
GET /api/search/artists?query={q}&page={p}&limit={n}
GET /api/search/playlists?query={q}&page={p}&limit={n}
GET /api/songs/{id}
GET /api/songs/{id}/suggestions?limit={n}
GET /api/albums?id={id}
GET /api/artists/{id}
GET /api/artists/{id}/songs?page={p}&sortBy=popularity&sortOrder=desc
```

**Response structure example (searchSongs):**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "abc123",
        "name": "Tum Hi Ho",
        "primaryArtists": "Arijit Singh",
        "artists": {
          "primary": [
            { "id": "art1", "name": "Arijit Singh", "image": [...], "url": "" }
          ]
        },
        "album": { "name": "Aashiqui 2", "id": "alb1", "url": "" },
        "image": [
          { "quality": "50x50", "url": "https://..." },
          { "quality": "150x150", "url": "https://..." },
          { "quality": "500x500", "url": "https://..." }
        ],
        "downloadUrl": [
          { "quality": "96kbps", "url": "https://..." },
          { "quality": "160kbps", "url": "https://..." },
          { "quality": "320kbps", "url": "https://..." }
        ],
        "duration": 261,
        "year": "2013",
        "hasLyrics": true,
        "language": "hindi",
        "playCount": "120000000"
      }
    ],
    "total": 500,
    "start": 0
  }
}
```

**IMPORTANT: Always use the LAST element of `downloadUrl` array for highest audio quality (320 kbps).**

**IMPORTANT: For images, always use `image[2].url` (500×500) for cards, `image[1].url` (150×150) for thumbnails, `image[0].url` (50×50) for tiny icons.**

#### 2. HuggingFace Recommender API

**Base URL:** `https://atharva025-saafy-music-recommender.hf.space/api`

```
POST /add-song?song_name={name}&artist={artist}
    → Adds a played song to the vector database

GET /recommend/{songId}?limit={n}
    → Returns similar songs with scores
```

**Add song response:**
```json
{ "success": true, "song_id": "abc123", ... }
```

**Recommend response:**
```json
{
  "success": true,
  "query_song": { "id": "abc123", "name": "..." },
  "recommendations": [
    { "song_id": "xyz456", "score": 0.94 },
    { "song_id": "def789", "score": 0.89 }
  ],
  "count": 10
}
```

#### 3. User & Playlist Backend (Vercel Serverless / MongoDB)

**Base URL:** Same as the music API: `https://saafy-api.vercel.app` (Vercel hosts both)

```
POST /api/users/register       body: { username, email, password }
POST /api/users/login          body: { emailOrUsername, password }
GET  /api/playlists?userId={id}
POST /api/playlists/create     body: { userId, name, image }
POST /api/playlists/update     body: { userId, playlistId, name, image }
POST /api/playlists/delete     body: { userId, playlistId }
POST /api/playlists/add-song   body: { userId, playlistId, song }
POST /api/playlists/remove-song body: { userId, playlistId, songId }
POST /api/playlists/import-spotify body: { userId, playlistUrl }
```

> **Note:** The backend itself (the serverless functions that handle `/api/users` and `/api/playlists`) is already deployed on Vercel. The mobile app only needs to make HTTP calls to it — do NOT try to run a local server.

### API Client Setup

```typescript
// src/api/client.ts
import axios from 'axios'

const MUSIC_BASE = 'https://saafy-api.vercel.app'

export const apiClient = axios.create({
  baseURL: MUSIC_BASE,
  timeout: 15000,
  headers: { 'Accept': 'application/json' },
})

// Response cache (in-memory, 15-min TTL, max 200 items)
class ResponseCache {
  private cache = new Map<string, { data: unknown; expires: number }>()
  private maxSize = 200

  get(key: string) {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) { this.cache.delete(key); return null }
    return entry.data
  }

  set(key: string, data: unknown, ttl = 15 * 60 * 1000) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, { data, expires: Date.now() + ttl })
  }
}

export const responseCache = new ResponseCache()
```

### HTML Entity Decoding

JioSaavn returns HTML-encoded strings (e.g., `&amp;`, `&quot;`). Always decode song names and artist names:

```typescript
export function decodeHtmlEntities(str: string): string {
  if (!str) return str
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}
```

### Input Sanitization

All user-typed search queries must be sanitized before use in API calls:

```typescript
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return ''
  return query
    .trim()
    .replace(/[<>"']/g, '')   // Remove HTML chars
    .replace(/[^\w\s\-.,!?@#]/g, '') // Only safe chars
    .slice(0, 150)
}
```

---

## 7. Database Schema (MongoDB)

The MongoDB database is at: `mongodb+srv://...@saafy-users-db.tuakqpu.mongodb.net/saafy`

### Collections

#### `users`

```typescript
interface UserDocument {
  _id: ObjectId
  username: string        // unique, trimmed
  email: string           // unique, lowercased, trimmed
  password: string        // bcrypt hashed (10 rounds)
  createdAt: Date
}
```

#### `playlists`

```typescript
interface PlaylistDocument {
  _id: ObjectId
  userId: ObjectId         // references users._id
  name: string
  image?: string           // base64 JPEG string (compressed)
  songs: PlaylistSong[]
  createdAt: Date
}

interface PlaylistSong {
  id: string               // JioSaavn song ID (string)
  name: string
  primaryArtists: string
  image: string            // single best image URL (string, NOT array)
  duration: number         // seconds
  album: string            // album name string
}
```

> **Note:** Songs stored in MongoDB only have a single image URL string (the best available), unlike the full song objects from the API which have `image[]` arrays. When displaying playlist songs, normalize the image field back to the `[{url: ...}, {url: ...}, {url: ...}]` format expected by components.

---

## 8. State Management Architecture

### Context Architecture

Replicate the web app's three-context system in React Native:

#### PlayerContext (most complex)

```typescript
// src/contexts/PlayerContext.tsx

interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  queue: Song[]             // upcoming songs
  history: Song[]           // previously played songs
  originalQueue: Song[]     // pre-shuffle order
  volume: number            // 0-1
  progress: number          // seconds elapsed
  duration: number          // total seconds
  repeatMode: 'none' | 'one' | 'all'
  shuffleMode: boolean
  contextQueue: Song[]      // source list that was played
  error: string | null
}
```

**Key actions exposed from context:**
- `playSong(song, contextSongs?)` — play a song immediately; optionally set a context queue
- `togglePlay()` — play/pause
- `handleNext()` — advance to next in queue; auto-fetch more if queue runs dry
- `handlePrevious()` — go back in history or restart current song if >3s played
- `seekTo(seconds)` — seek audio to position
- `setVolume(level)` — 0–1 range
- `addToQueue(song)` — add to end of queue
- `addToQueueNext(song)` — insert as next song
- `removeFromQueue(index)` — remove by index
- `reorderQueue(from, to)` — drag-and-drop reorder
- `clearQueue()` — empty queue
- `toggleShuffle()` — enable/disable shuffle
- `toggleRepeat()` — cycle: none → one → all → none
- `dominantColor` — extracted dominant color from album art (for dynamic theming)
- `recommendations` — list of recommended Song objects
- `recommendationsLoading` — boolean
- `playlists` — user's playlists array
- `playlistsLoading` — boolean
- `loadPlaylists(userId)` — fetch user playlists
- `createPlaylist(userId, name, image?)` — create new playlist
- `updatePlaylist(userId, playlistId, name, image?)` — rename or change cover
- `deletePlaylist(userId, playlistId)` — delete playlist
- `addSongToPlaylist(userId, playlistId, song)` — add song
- `removeSongFromPlaylist(userId, playlistId, songId)` — remove song
- `importSpotifyPlaylist(userId, playlistUrl)` — import from Spotify URL/ID
- `listeningHistory` — last 50 songs (Song[])
- `loadListeningHistory(userId)` — load from AsyncStorage

#### ThemeContext

```typescript
interface ThemeContextValue {
  isDark: boolean
  colors: typeof lightColors | typeof darkColors
  fonts: typeof fonts
  tokens: typeof tokens
  toggleTheme: () => void
}
```

- Default theme: `dark`
- Persisted to AsyncStorage key `'theme'`

#### ToastContext

```typescript
interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  addToast: (message: string, options?: ToastOptions) => string
  removeToast: (id: string) => void
}
```

### Audio Engine (expo-av)

```typescript
// In PlayerContext — Audio setup with expo-av

import { Audio } from 'expo-av'

// On mount, configure audio session:
await Audio.setAudioModeAsync({
  staysActiveInBackground: true,       // Essential: music plays when app is backgrounded
  interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
  playsInSilentModeIOS: true,          // Essential: play even in iOS silent mode
  interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
  shouldDuckAndroid: true,
  allowsRecordingIOS: false,
})
```

**Song playback flow:**

1. `playSong(song)` is called
2. Extract highest-quality audio URL: `song.downloadUrl[song.downloadUrl.length - 1]?.url`
3. If an existing `soundObject` exists, call `soundObject.unloadAsync()`
4. Create new `Audio.Sound` and call `sound.loadAsync({ uri: audioUrl }, { shouldPlay: true })`
5. Set progress callback: `sound.setOnPlaybackStatusUpdate(status => { ... })`
6. On `status.didJustFinish`, call `handleNext()`
7. Normalize song images before storing in state (convert any string images to `[{url:...}]` arrays)
8. Add song to listening history in AsyncStorage
9. Call `addSongToRecommender(song.name, song.primaryArtists)` in background (non-blocking)
10. If recommendations for this song haven't been fetched yet, call `fetchRecommendations(song.id)`

**Auto-queue logic:** When `handleNext()` is called and the queue is empty, automatically fetch the "For You" mix and add those songs to the queue.

---

## 9. Screen-by-Screen UI Specification

### Screen 1: HomeScreen (Discovery Feed)

**Route:** Tab 1 (home icon)  
**Purpose:** Personalized music discovery

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ STATUS BAR                                                    │
├─────────────────────────────────────────────────────────────┤
│ HEADER (fixed/sticky at top)                                  │
│  [🎵 SAAFY logo] [Greeting + date]       [🔔][👤][⚙️]      │
├─────────────────────────────────────────────────────────────┤
│ CATEGORY NAV RIBBON (horizontal scroll, sticky below header) │
│  [✨ For You] [📈 Trending] [🌍 Hindi] [📖 English] [🥁 Punjabi] [🏛 Marathi] [🎉 Party] [🌙 Chill] [❤️ Romantic] [💪 Workout] │
├─────────────────────────────────────────────────────────────┤
│ SCROLLABLE MAIN CONTENT (changes based on active category)   │
│                                                               │
│ ── SECTION: For You ─────────────────────────────────────── │
│  Greeting header: "Good evening, [username]!"                 │
│  Sub: "Based on your listening history"                       │
│                                                               │
│  [Horizontal scroll: 12 × SongCard (120×120 art)]            │
│                                                               │
│ ── SECTION: Hindi ───────────────────────────────────────── │
│  "01 · Hindi" heading                                         │
│  [Horizontal scroll: 10 × SongCard]                           │
│                                                               │
│ ── SECTION: English ─────────────────────────────────────── │
│  "02 · English" heading                                        │
│  [Horizontal scroll: 10 × SongCard]                           │
│                                                               │
│ ── SECTION: Punjabi ─────────────────────────────────────── │
│  [Horizontal scroll: 10 × SongCard]                           │
│                                                               │
│ ── SECTION: Marathi ─────────────────────────────────────── │
│  [Horizontal scroll: 10 × SongCard]                           │
│                                                               │
│ ── SECTION: Themed (Trending, Party, Chill...) ──────────── │
│  [Horizontal scroll: 10 × SongCard each]                      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ MINI PLAYER (fixed bottom, above tab bar)                     │
│  [Art 40x40] [Title / Artist]  [Prev] [Play/Pause] [Next]   │
├─────────────────────────────────────────────────────────────┤
│ TAB BAR                                                       │
│  [Home]   [Search]   [Library]   [Settings]                  │
└─────────────────────────────────────────────────────────────┘
```

#### Category Nav Ribbon

- Horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}`
- Each tab: pill shape, `borderRadius: 999`, height 34
- Default (inactive): `backgroundColor: paperDark`, `borderWidth: 1`, `borderColor: border`
- Active: `backgroundColor: accent`, `color: white`, no border
- Icons from `@expo/vector-icons` (Feather or Ionicons)
- Tab items: `For You | Trending Now | Hindi | English | Punjabi | Marathi | Party Hits | Chill Vibes | Romantic | Workout Energy`

#### Category Section Songs (When a category tab is selected other than "For You")

- Replace the stacked carousels with a 2-column grid of `SongCard` components
- "Load More" button at bottom
- Show shimmer skeletons while loading

#### Header

- App logo: music note SVG icon (26×26) in a terracotta gradient square (borderRadius 8) + "SAAFY" text in Syne font, weight 800
- Greeting: "Good morning/afternoon/evening/Late night vibes" (time-based)
- Date: "Wednesday, Jun 11" in Space Grotesk uppercase
- Right actions: theme toggle moon/sun icon, user avatar or login icon

#### Ambient Background Effect (Dark mode)

When a song is playing, add a very subtle blurred album art in the background:
```typescript
// Use expo-blur BlurView or just an Image with very low opacity (0.08-0.15)
// Position: absolute, full screen, blurred via style opacity + tint
```

---

### Screen 2: SearchScreen

**Route:** Tab 2 (search icon)  
**Purpose:** Search songs, artists, albums

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ SEARCH BAR (at top, auto-focused on tab press)               │
│  🔍 [type-ahead text input]                        [×]       │
├─────────────────────────────────────────────────────────────┤
│ CONTENT AREA                                                  │
│                                                               │
│ [If no query typed]                                           │
│   "You were exploring..."                                     │
│   [Listening history trail rows — 4 songs max]                │
│                                                               │
│ [If typing — suggestions dropdown]                            │
│   [Up to 8 song rows with art, title, artist, play/queue btn]│
│                                                               │
│ [After search submitted — full results]                       │
│   [20 SongRow items]                                          │
│   [Load More button]                                          │
├─────────────────────────────────────────────────────────────┤
│ MINI PLAYER                                                   │
├─────────────────────────────────────────────────────────────┤
│ TAB BAR                                                       │
└─────────────────────────────────────────────────────────────┘
```

#### Search Bar Behavior

- Auto-debounce: 300ms after last keystroke
- Minimum 2 characters to trigger search
- Keyboard shortcut hint on web is omitted on mobile
- Show spinner during loading
- Rotating placeholder text every 4 seconds (7 phrases, animate opacity + translateY)
- History trail: song cards from `listeningHistory` with "Vibe name" label + relative time

#### Vibe Names (Emotional Trail Labels)

```typescript
function getEmotionalTrailForSong(song: Song): string {
  const title = (song.name || '').toLowerCase()
  const artist = (song.primaryArtists || '').toLowerCase()
  const lang = (song.language || '').toLowerCase()

  if (['arijit', 'jubin', 'atif', 'shreya'].some(a => artist.includes(a))) return 'Arijit Romance'
  if (['honey', 'badshah', 'diljit', 'raftaar', 'king'].some(a => artist.includes(a))) return 'Party Monster'
  if (['sidhu', 'dhillon', 'aujla', 'shubh'].some(a => artist.includes(a))) return 'Punjabi Beats'
  if (['party', 'dance', 'club'].some(w => title.includes(w))) return 'Party Monster'
  if (['sad', 'judai', 'lofi', 'alone', 'night'].some(w => title.includes(w))) return 'Late Night Synths'
  if (['rain', 'baaris', 'sawan'].some(w => title.includes(w))) return 'Monsoon Vibes'
  if (lang === 'marathi') return 'Marathi Soul'
  if (lang === 'punjabi') return 'Punjabi Beats'
  if (lang === 'english') return 'Late Night Synths'
  return 'Bollywood Melodies'
}
```

---

### Screen 3: LibraryScreen

**Route:** Tab 3 (library icon)  
**Purpose:** User's playlists and listening history

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│  "Your Library"                [+ New Playlist] [Import 🎵]  │
├─────────────────────────────────────────────────────────────┤
│ SCROLLABLE LIST                                               │
│                                                               │
│ [If not logged in]                                            │
│  "Sign in to access your playlists"                           │
│  [Sign In button]                                             │
│                                                               │
│ [If logged in, no playlists]                                  │
│  Empty state illustration + "Create your first playlist"      │
│                                                               │
│ [Playlist rows — full width]                                  │
│  [Cover art 60x60] [Name] [Song count]   [▶ Play] [⋯ More]  │
│  [Cover art 60x60] [Name] [Song count]   [▶ Play] [⋯ More]  │
│  ...                                                          │
├─────────────────────────────────────────────────────────────┤
│ MINI PLAYER                                                   │
├─────────────────────────────────────────────────────────────┤
│ TAB BAR                                                       │
└─────────────────────────────────────────────────────────────┘
```

#### Playlist Card

- Cover: 60×60 image (rounded 12), or gradient placeholder with music note
- Name in Sora 600, subtitle "N songs" in Space Grotesk
- Tap → opens `PlaylistScreen`
- Long press or "⋯" → context menu (Rename, Delete, Add to Queue)

#### Create Playlist Flow

1. Modal sheet appears with `TextInput` for name
2. Optional: image picker (`expo-image-picker`) for cover
3. Compress cover with `expo-image-manipulator` to max 300×300, quality 0.7, base64
4. POST to `/api/playlists/create`

#### Spotify Import Flow

1. Modal with text input for Spotify URL or playlist ID
2. POST to `/api/playlists/import-spotify`
3. Show progress / loading indicator
4. On success: refresh playlists list

---

### Screen 4: PlaylistScreen

**Route:** Pushed onto stack from LibraryScreen when playlist is tapped

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER with back button                                       │
├─────────────────────────────────────────────────────────────┤
│ PLAYLIST HERO SECTION                                         │
│  [Cover art 160x160, centered, rounded 16, with shadow]      │
│  [Playlist name — editable, tap pencil icon to edit inline]  │
│  [N songs · Total duration]                                   │
│  [▶ Play All] [🔀 Shuffle]                                   │
├─────────────────────────────────────────────────────────────┤
│ SEARCH BAR (filter within playlist)                           │
├─────────────────────────────────────────────────────────────┤
│ SONG LIST (SongRow items, swipe-to-delete or remove btn)     │
│  [#] [Art 44x44] [Name / Artist]  [Duration] [⋯]            │
│  ...                                                          │
├─────────────────────────────────────────────────────────────┤
│ MINI PLAYER                                                   │
└─────────────────────────────────────────────────────────────┘
```

- Playlist name editable inline (tap pencil → TextInput → tap checkmark to save)
- Cover art is tappable → opens `expo-image-picker` to replace cover
- Song rows: swipe left to reveal delete button (use `react-native-gesture-handler` PanGestureHandler or `react-native-swipe-list-view`)
- Track numbering in Space Grotesk

---

### Screen 5: ArtistScreen

**Route:** Pushed onto stack from song card artist link

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER with back button                                       │
├─────────────────────────────────────────────────────────────┤
│ ARTIST HERO IMAGE (full-width, 200-240px tall)               │
│  Gradient overlay (bottom: accent/transparent)               │
│  Artist name overlay (Syne 800, large)                        │
│  Follower count                                               │
├─────────────────────────────────────────────────────────────┤
│ SCROLLABLE CONTENT                                            │
│                                                               │
│ [Top Songs section — 5 song rows]                             │
│ [Discography section — album cards horizontal scroll]         │
│ [Similar Artists (if data available)]                         │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ MINI PLAYER                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### Screen 6: SettingsScreen

**Route:** Tab 4 (gear icon)

#### Sections

1. **Account** — Show username/email if logged in; Login/Logout button
2. **Appearance** — Theme toggle (Dark/Light) with animated toggle switch
3. **Audio** — Streaming quality selector (Low 96k / Medium 160k / High 320k)
4. **Data & Privacy** — Export data (JSON), Clear cache
5. **About** — App version, links

---

### Full-Screen Player (Modal)

Opened when user taps the MiniPlayer bar. This is a modal presented over the current tab.

```
┌─────────────────────────────────────────────────────────────┐
│ ↓ swipe down to close indicator                              │
│ [NOW PLAYING]                              [⋯ More options]  │
├─────────────────────────────────────────────────────────────┤
│ ALBUM ART (large, ~300x300, centered, elevated shadow)       │
│  — dynamically scales slightly when playing                  │
│  — subtle rotation animation while playing                   │
├─────────────────────────────────────────────────────────────┤
│ SONG INFO                                                     │
│  Song Title (Sora 700, 20px)                                  │
│  Artist Name (Sora 400, 14px, inkMuted)                       │
│  [♡ Favorite button]                                          │
├─────────────────────────────────────────────────────────────┤
│ PROGRESS BAR                                                  │
│  ━━━━━━━━━━●──────────────  [accent fill]                    │
│  0:54                               3:12                      │
├─────────────────────────────────────────────────────────────┤
│ CONTROLS                                                      │
│  [🔀 Shuffle]  [⏮ Prev]  [⏸ Play/Pause]  [⏭ Next]  [🔁 Repeat] │
├─────────────────────────────────────────────────────────────┤
│ VOLUME SLIDER                                                 │
│  🔇──────────●──────────────────🔊                           │
├─────────────────────────────────────────────────────────────┤
│ QUEUE PREVIEW (next 3 songs)                                  │
│  [Song 1 thumbnail] [Name] [Artist]                          │
│  [Song 2 thumbnail] [Name] [Artist]                          │
│  [Song 3 thumbnail] [Name] [Artist]                          │
│  [Open Full Queue →]                                          │
└─────────────────────────────────────────────────────────────┘
```

**Dynamic background:** When fullscreen player is open, the background is a very blurred, low-opacity version of the album art, matching the song's dominant color palette. Use `expo-blur` `BlurView` or simply an `Image` at `opacity: 0.15` covering the full screen.

**Dominant color extraction for dynamic theming:** Use Canvas API equivalent on React Native:
- Fetch the album art
- Use a simple pixel sampling approach (or a library like `react-native-image-colors`)
- Extract dominant color → tint progress bar fill, play button background, active controls

---

### Queue Bottom Sheet

Triggered from: (1) Queue button in player bar, (2) Full player's "Open Full Queue" link

```
┌─────────────────────────────────────────────────────────────┐
│ BOTTOM SHEET HANDLE                                           │
│ "Play Queue"   [N tracks · Xh Xm]                [✕]        │
├─────────────────────────────────────────────────────────────┤
│ NOW PLAYING                                                   │
│  [Art] [Name / Artist]  ♪♪♪ (animated bars)                 │
├─────────────────────────────────────────────────────────────┤
│ NEXT UP                                                       │
│  [⠿ drag] [Art] [Name / Artist]  [🗑 remove]                │
│  [⠿ drag] [Art] [Name / Artist]  [🗑 remove]                │
│  ...                                                          │
│                                                               │
│ [Empty state if no queue: music note icon + "No upcoming songs"] │
└─────────────────────────────────────────────────────────────┘
```

- Implement with a bottom sheet library compatible with Expo Go: use `@gorhom/bottom-sheet` or a custom `Animated` + `PanResponder` implementation
- Song rows are drag-reorderable: use `react-native-draggable-flatlist` or manual gesture implementation

---

## 10. Component Specifications

### SongCard (Horizontal Carousel Item)

```
Width: 130px
Height: auto
Album Art: 130×130, borderRadius 12, with shadow
Song Name: Sora 600, 12px, max 2 lines, ellipsized
Artist: Space Grotesk 400, 11px, inkMuted, 1 line, ellipsized
On Press: playSong(song)
Long Press: context menu (Add to Queue, Add to Playlist, View Artist)
```

```typescript
interface SongCardProps {
  song: Song
  onPress: (song: Song) => void
  onLongPress?: (song: Song) => void
  width?: number
}
```

### SongRow (List Item)

```
Full width
Left: Art 44×44, borderRadius 8
Middle: [Song name, Sora 600 14px] / [Artist name, Space Grotesk 11px, inkMuted]
Right: Duration, Space Grotesk 11px, inkLight + [⋯ More] button
On Press: playSong(song)
Active (currentSong === this song): Show animated playing bars; name in accent color
```

### MiniPlayer (Persistent bottom bar, above tab bar)

```
Height: 70px
Position: fixed above tab bar
Background: overlayDeep with blur (expo-blur)
Border: 1px top, color: border
Left: Album Art 44×44, borderRadius 8
Middle: [Song name, Sora 600 13px, truncated] / [Artist, 11px, inkMuted, truncated]
Right: [⏮] [⏸/▶] [⏭] buttons, 36×36 each
On tap (not on buttons): open FullPlayer modal
```

### Skeleton Loader

Implement a shimmer effect for loading states:
```typescript
// Use react-native-reanimated to animate background:
// Background sweeps from paperDark → paperDarker → paperDark
// Animation: 1.6s ease-in-out, infinite
```

### Toast Component

```
Position: absolute top (for mobile, show at top of safe area, not bottom since mini player is at bottom)
Width: min(90%, 400px), centered
Background: paper (dark or light) with blur
BorderRadius: 14
Border: 1px, rule color
Show: animated slide down from top
Icon + message + optional Undo button + close (×) button
Types: success (green), error (red), warning (amber), info (accent)
Progress bar at bottom (depletes over duration, default 3000ms)
Dismiss by swipe up or timeout
```

---

## 11. Audio Player Logic

### Song Data Normalization

All songs must be normalized before storing in state. This ensures all components receive consistent data regardless of API source:

```typescript
interface Song {
  id: string
  name: string
  title: string
  primaryArtists: string
  artists: Artist[]
  album: {
    name: string
    id?: string
    url?: string
  }
  image: Array<{ url: string; link?: string }>  // 3 sizes: [50px, 150px, 500px]
  duration: number        // in seconds
  downloadUrl: Array<{ url: string; quality?: string }>
  language?: string
  year?: string
  hasLyrics?: boolean
  playCount?: number
  recommendationScore?: number
}

// Helper: get best image URL
export function getImageUrl(song: Song | null, quality: 'low' | 'medium' | 'high' = 'high'): string {
  if (!song) return ''
  const idx = quality === 'high' ? 2 : quality === 'medium' ? 1 : 0
  return song.image?.[idx]?.url || song.image?.[idx]?.link ||
         song.image?.[1]?.url || song.image?.[0]?.url || ''
}

// Helper: get audio URL (always highest quality = last item)
export function getAudioUrl(song: Song | null): string {
  if (!song?.downloadUrl?.length) return ''
  const last = song.downloadUrl[song.downloadUrl.length - 1]
  return last?.url || last?.link || ''
}
```

### expo-av Audio State Machine

```typescript
// Simplified PlayerContext audio logic
const soundRef = useRef<Audio.Sound | null>(null)

async function loadAndPlaySong(song: Song) {
  // 1. Clean up existing sound
  if (soundRef.current) {
    await soundRef.current.stopAsync().catch(() => {})
    await soundRef.current.unloadAsync().catch(() => {})
    soundRef.current = null
  }

  const uri = getAudioUrl(song)
  if (!uri) {
    dispatch({ type: 'SET_ERROR', payload: 'No audio URL available' })
    return
  }

  try {
    dispatch({ type: 'SET_CURRENT_SONG', payload: song })
    
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: state.volume },
      onPlaybackStatusUpdate
    )
    
    soundRef.current = sound
    dispatch({ type: 'SET_PLAYING', payload: true })
    
    // Background tasks
    void handleSongPlayback(song)  // add to history + recommender
    
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: 'Failed to load audio' })
  }
}

function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
  if (!status.isLoaded) return
  
  dispatch({ type: 'SET_PROGRESS', payload: status.positionMillis / 1000 })
  dispatch({ type: 'SET_DURATION', payload: status.durationMillis ? status.durationMillis / 1000 : 0 })
  
  if (status.didJustFinish) {
    handleNext()
  }
}
```

### Repeat / Shuffle Logic

```typescript
function handleNext() {
  if (state.repeatMode === 'one' && soundRef.current) {
    soundRef.current.replayAsync()
    return
  }
  
  if (state.queue.length === 0) {
    if (state.repeatMode === 'all' && state.contextQueue.length > 0) {
      // Replay the entire context queue
      dispatch({ type: 'PLAY_CONTEXT', payload: { songs: state.contextQueue, startIndex: 0 } })
      loadAndPlaySong(state.contextQueue[0])
    } else {
      // Auto-extend queue from For You mix
      void extendQueueIfNeeded()
    }
    return
  }
  
  const [nextSong, ...rest] = state.queue
  dispatch({ type: 'PLAY_NEXT' })
  loadAndPlaySong(nextSong)
}

function handlePrevious() {
  if (state.progress > 3) {
    // If more than 3 seconds in, restart current song
    soundRef.current?.setPositionAsync(0)
    return
  }
  if (state.history.length > 0) {
    const prevSong = state.history[state.history.length - 1]
    dispatch({ type: 'PLAY_PREVIOUS' })
    loadAndPlaySong(prevSong)
  }
}
```

### Listening History

- Store in AsyncStorage as encrypted JSON
- Key: `saafy_enc_listening_history_{userId}` (userId = `'guest'` if not logged in)
- Max 50 songs
- Each entry: `{ id, name, primaryArtists, image: imageUrl, playedAt: timestamp }`
- When adding: prepend new song, remove if already exists (de-duplicate), trim to 50

---

## 12. Discovery & Recommendations Engine

### Discovery Pools

The app fetches songs using curated search queries. Each section picks queries based on a session seed (random on each app launch).

```typescript
// src/lib/discovery.ts

const DISCOVERY_POOLS = {
  hindi: {
    queries: [
      'Arijit Singh hits', 'Pritam songs', 'A.R. Rahman classics',
      'Shreya Ghoshal best', 'Neha Kakkar popular', 'Jubin Nautiyal',
      'Atif Aslam romantic', 'Sonu Nigam hits', 'Kumar Sanu classics',
      'Lata Mangeshkar', 'Kishore Kumar', 'Mohammed Rafi',
      'Honey Singh party', 'Badshah hits', 'Diljit Dosanjh hindi',
      'Bollywood romantic', 'Bollywood party songs', 'Bollywood 90s',
      'Bollywood 2000s hits', 'Hindi unplugged', 'Hindi lofi',
      'Bollywood dance', 'Hindi sad songs', 'Hindi motivational',
    ],
    displayName: 'Hindi',
  },
  english: {
    queries: [
      'Ed Sheeran hits', 'Taylor Swift popular', 'The Weeknd',
      'Dua Lipa songs', 'Post Malone', 'Drake hits',
      'Billie Eilish', 'Justin Bieber', 'Ariana Grande',
      'Bruno Mars', 'Maroon 5', 'Coldplay',
      'Imagine Dragons', 'OneRepublic', 'Chainsmokers',
      'Charlie Puth', 'Shawn Mendes', 'Khalid songs',
      'Pop hits 2024', 'English romantic', 'EDM party',
      'Hip hop hits', 'R&B smooth', 'Indie pop',
    ],
    displayName: 'English',
  },
  punjabi: {
    queries: [
      'Diljit Dosanjh hits', 'Sidhu Moosewala', 'AP Dhillon',
      'Karan Aujla songs', 'Guru Randhawa', 'Hardy Sandhu',
      'Jassie Gill', 'Ammy Virk songs', 'B Praak songs',
      'Punjabi party songs', 'Punjabi romantic', 'Punjabi bhangra',
      'New punjabi songs', 'Trending punjabi',
    ],
    displayName: 'Punjabi',
  },
  marathi: {
    queries: [
      'Marathi romantic songs', 'Marathi movie songs', 'Ajay Atul songs',
      'Avadhoot Gupte', 'Swapnil Bandodkar', 'Bela Shende songs',
      'Marathi lavani', 'Marathi unplugged', 'New marathi songs',
    ],
    displayName: 'Marathi',
  },
}

const THEMED_POOLS = {
  trending: { queries: ['trending songs 2024', 'viral hits', 'top 100 songs', 'chart toppers', 'most played songs'], displayName: 'Trending Now' },
  party: { queries: ['party songs', 'dance hits', 'club music', 'party anthems', 'upbeat songs'], displayName: 'Party Hits' },
  chill: { queries: ['chill vibes', 'relaxing music', 'lofi beats', 'calm songs', 'study music'], displayName: 'Chill Vibes' },
  romantic: { queries: ['romantic songs', 'love songs', 'romantic hits', 'love ballads'], displayName: 'Romantic' },
  workout: { queries: ['workout music', 'gym songs', 'fitness music', 'motivation music'], displayName: 'Workout Energy' },
}
```

### Session Seed & Seeded Shuffle

```typescript
// New seed generated ONCE per app session (not per request)
let sessionSeed: number | null = null

function getSessionSeed(): number {
  if (sessionSeed === null) {
    sessionSeed = (Date.now() % 1000000) + Math.floor(Math.random() * 100000)
  }
  return sessionSeed
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(s++) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
```

### For You Mix

```typescript
export async function getForYouMix(limit = 12): Promise<{ success: boolean; songs: Song[] }> {
  const seed = getSessionSeed()
  const languages = Object.keys(DISCOVERY_POOLS)
  const langCount = 3 + (seed % 2)  // 3 or 4 languages
  const selected = seededShuffle(languages, seed).slice(0, langCount)
  
  const results = await Promise.allSettled(
    selected.map(lang => getDiscoverySongs(lang, Math.ceil(limit / langCount) + 2))
  )
  
  const all: Song[] = []
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value.success) {
      all.push(...r.value.songs)
    }
  })
  
  const shuffled = seededShuffle(all, seed + 999)
  const unique: Song[] = []
  const seen = new Set<string>()
  for (const song of shuffled) {
    if (!seen.has(song.id) && unique.length < limit) {
      seen.add(song.id)
      unique.push(song)
    }
  }
  
  return { success: true, songs: unique }
}
```

### Personalized Recommendations Flow

When a user plays a song:

1. POST to `/add-song` on the HuggingFace recommender with the song name + artist (background, non-blocking)
2. GET `/recommend/{songId}?limit=10` 
3. For each returned `song_id`, GET `/api/songs/{id}` to get full song data
4. De-duplicate by ID
5. If fewer than 12 recommendations: pad with For You mix
6. Store in `recommendations` state

The "For You" section on the home screen uses this personalized list if it exists (user has listening history), otherwise falls back to the generic For You mix.

---

## 13. Authentication System

### User Object (stored in AsyncStorage)

```typescript
interface User {
  id: string          // MongoDB ObjectId as string
  _id?: string        // Same, some endpoints return _id
  username: string
  email: string
  createdAt: string
}
```

### Storage

- Key: `saafy_enc_saafy_user`
- Encrypted with XOR cipher using key `'saafy_secure_key_v1_2026'` then base64-encoded
- On app start: read from AsyncStorage → restore `currentUser` state
- On login: store encrypted user → set `currentUser` state → load playlists + history

### Login / Register

```
POST /api/users/register
Body: { username: string, email: string, password: string }
Success: { success: true, user: { id, username, email, createdAt } }
Error: { success: false, error: "Email is already registered" }

POST /api/users/login
Body: { emailOrUsername: string, password: string }
Success: { success: true, user: { id, username, email, createdAt } }
Error: { success: false, error: "Invalid credentials" }
```

### Auth Modal UI

- Two-tab segmented control: "Sign In" | "Create Account"
- Full-screen modal with blurred backdrop
- Animated tab switching (slide left/right) — use `Animated` API or `react-native-reanimated`
- Input fields: username/email, password (+ confirm for register)
- Show inline error message if API returns error
- On success: dismiss modal, show "Welcome back, [name]!" toast, load playlists

---

## 14. Playlist Management

### Playlist Object (from API)

```typescript
interface Playlist {
  _id: string
  userId: string
  name: string
  image?: string        // base64 JPEG string or undefined
  songs: PlaylistSong[]
  createdAt: string
}

interface PlaylistSong {
  id: string
  name: string
  primaryArtists: string
  image: string         // single URL (not array!)
  duration: number
  album: string
}
```

### Normalizing Playlist Songs for Playback

When playing songs from a playlist, normalize each `PlaylistSong` into a `Song` object:

```typescript
function normalizePlaylistSong(ps: PlaylistSong): Song {
  return {
    id: ps.id,
    name: ps.name,
    title: ps.name,
    primaryArtists: ps.primaryArtists,
    artists: [],
    album: { name: ps.album },
    image: [
      { url: ps.image },
      { url: ps.image },
      { url: ps.image },
    ],
    duration: ps.duration,
    downloadUrl: [],   // Must be fetched fresh via getSong(ps.id) before playing
  }
}
```

> **Important:** Playlist songs stored in MongoDB do NOT have `downloadUrl`. Before playing a playlist song, call `getSong(song.id)` to get the fresh download URL. This is intentional — URLs expire.

### Cover Image Handling

- User selects image via `expo-image-picker`
- Compress with `expo-image-manipulator`: resize to max 300×300, JPEG quality 0.7
- Convert to base64: `FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })`
- Prepend mime: `data:image/jpeg;base64,${base64}`
- Send in POST body as `image` field

### Spotify Import

The backend handles everything. Mobile app just needs to:
1. Show a `TextInput` for the Spotify URL or playlist ID
2. POST to `/api/playlists/import-spotify` with `{ userId, playlistUrl }`
3. Handle loading state and show result toast

> Note: Spotify-imported songs have IDs in format `spotify:{trackId}` and **cannot be played directly** — they are metadata placeholders only. Display them with the warning icon or grayed out. A future feature would match them to JioSaavn equivalents via name search.

---

## 15. Local Storage & Encryption Strategy

### Storage Key Convention

All encrypted keys are prefixed with `saafy_enc_`:

| Data | AsyncStorage Key |
|---|---|
| Current user session | `saafy_enc_saafy_user` |
| Theme preference | `saafy_enc_theme` |
| Listening history (guest) | `saafy_enc_listening_history_guest` |
| Listening history (user) | `saafy_enc_listening_history_{userId}` |
| App settings | `saafy_enc_settings` |

### XOR Encryption

```typescript
// src/lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const ENCRYPTION_KEY = 'saafy_secure_key_v1_2026'

function xorEncrypt(text: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key)
  const textBytes = new TextEncoder().encode(text)
  const encrypted = new Uint8Array(textBytes.length)
  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return btoa(String.fromCharCode(...encrypted))
}

function xorDecrypt(encrypted: string, key: string): string {
  const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const keyBytes = new TextEncoder().encode(key)
  const decrypted = new Uint8Array(encryptedBytes.length)
  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return new TextDecoder().decode(decrypted)
}

export async function encryptedSetItem<T>(key: string, data: T): Promise<boolean> {
  try {
    const serialized = JSON.stringify(data)
    const encrypted = xorEncrypt(serialized, ENCRYPTION_KEY)
    await AsyncStorage.setItem(`saafy_enc_${key}`, encrypted)
    return true
  } catch {
    return false
  }
}

export async function encryptedGetItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const encrypted = await AsyncStorage.getItem(`saafy_enc_${key}`)
    if (!encrypted) return defaultValue
    const decrypted = xorDecrypt(encrypted, ENCRYPTION_KEY)
    return JSON.parse(decrypted) as T
  } catch {
    return defaultValue
  }
}
```

---

## 16. Navigation Architecture

### Tab Navigator Structure

```typescript
// Bottom Tab Navigator with 4 tabs
const Tab = createBottomTabNavigator()

// Tabs:
// 1. Home (HomeStack)    — house icon
// 2. Search (SearchStack) — search/magnifier icon
// 3. Library (LibraryStack) — library/music-note icon
// 4. Settings            — gear icon
```

### Stack Structure

```typescript
// HomeStack
const HomeStack = createStackNavigator()
// Screens: HomeScreen → ArtistScreen, PlaylistScreen (from recommendations/playlists shown on home)

// SearchStack
const SearchStack = createStackNavigator()
// Screens: SearchScreen → ArtistScreen, PlaylistScreen

// LibraryStack
const LibraryStack = createStackNavigator()
// Screens: LibraryScreen → PlaylistScreen → ArtistScreen
```

### Full Player Modal

The Full Player is presented as a modal from the root `NavigationContainer`, so it overlays all tabs:

```typescript
// Root Navigator
const RootStack = createStackNavigator()
// Screens: MainTabNavigator (nested), FullPlayerModal
```

### Navigation Param Types

```typescript
// src/types/navigation.ts
export type RootStackParamList = {
  Main: undefined
  FullPlayer: undefined
}

export type HomeStackParamList = {
  Home: undefined
  Artist: { artistId: string; artistName?: string }
  Playlist: { playlistId: string; playlist?: Playlist }
}

export type SearchStackParamList = {
  Search: undefined
  Artist: { artistId: string; artistName?: string }
}

export type LibraryStackParamList = {
  Library: undefined
  Playlist: { playlistId: string; playlist?: Playlist }
  Artist: { artistId: string; artistName?: string }
}
```

---

## 17. Animations & Micro-interactions

### Principles

- Every interaction must have tactile feedback
- Use `react-native-reanimated` v3 for all animations (it runs on the UI thread)
- Preferred easing: `Easing.out(Easing.cubic)` for enter, `Easing.in(Easing.cubic)` for exit
- Spring animations for scale/position: `{ damping: 15, stiffness: 150 }`

### Required Animations

| Element | Animation | Spec |
|---|---|---|
| Song Card press | Scale down to 0.95 → release spring back | 80ms press, spring release |
| Tab switch | Content fade + slide (react-navigation default, override with fade only on mobile) | 200ms |
| Category pill selection | Background color transition + scale 1→1.03 | 200ms |
| MiniPlayer appearance | Slide up from bottom | 300ms |
| Full Player open | Modal slide up from bottom | 350ms |
| Playing bars (audio visualizer) | 3 bars animating up/down in alternating sequence | CSS keyframe alt: Reanimated `withRepeat(withTiming(...))` |
| Album art (full player) | Subtle scale 1.0 → 1.03 when playing, back to 1.0 when paused | 600ms spring |
| Toast | Slide down from top, fade in | 400ms spring |
| Toast dismiss | Slide up + fade | 250ms |
| Skeleton shimmer | Sweep from left to right | 1.6s loop |
| Search bar expand | Height + border-radius transition | 300ms |
| Shuffle/Repeat active dot | Pulse glow | 1.5s alternate |

### Playing Bars Indicator

3 vertical bars that bounce up and down rhythmically (shown next to artist name when that song is playing):

```typescript
// Reanimated implementation
const bar1 = useSharedValue(0.4)
const bar2 = useSharedValue(1.0)
const bar3 = useSharedValue(0.6)

useEffect(() => {
  if (isPlaying) {
    bar1.value = withRepeat(withTiming(1, { duration: 400, easing: Easing.inOut(Easing.sin) }), -1, true)
    bar2.value = withRepeat(withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.sin) }), -1, true)
    bar3.value = withRepeat(withTiming(0.8, { duration: 500, easing: Easing.inOut(Easing.sin) }), -1, true)
  } else {
    cancelAnimation(bar1)
    cancelAnimation(bar2)
    cancelAnimation(bar3)
    bar1.value = withTiming(0.4)
    bar2.value = withTiming(0.5)
    bar3.value = withTiming(0.3)
  }
}, [isPlaying])
```

---

## 18. Expo Go Compatibility & Known Constraints

### ✅ What WORKS in Expo Go

- `expo-av` audio playback (including background audio with proper Audio.setAudioModeAsync config)
- `expo-image-picker` for selecting images from camera roll
- `expo-image-manipulator` for resizing/compressing images
- `expo-linear-gradient` for gradients
- `expo-blur` BlurView for frosted glass effects
- `@react-native-async-storage/async-storage`
- `react-native-reanimated` v3
- `react-native-gesture-handler`
- All HTTP requests via `fetch` or `axios`
- Google Fonts via `@expo-google-fonts`
- React Navigation (bottom tabs, stack)
- `@gorhom/bottom-sheet` (works in Expo Go)

### ⚠️ Limitations / Workarounds

| Feature | Web Implementation | Mobile Alternative |
|---|---|---|
| Background ambient art (CSS blur/filter) | `ambient-playing-bg` CSS class | `expo-blur` BlurView or Image with low opacity |
| Canvas color extraction | `extractDominantColor()` via Canvas 2D | Use `react-native-image-colors` (install via expo-modules) OR sample from `expo-image-manipulator` pixel output |
| Drag-to-reorder queue | HTML5 drag events | `react-native-draggable-flatlist` |
| Keyboard shortcuts (Ctrl+K) | window.addEventListener | Omit on mobile |
| CSS custom properties | CSS vars | JS style objects / StyleSheet |
| Framer Motion | `framer-motion` | `react-native-reanimated` |
| `window.confirm()` | Browser confirm dialog | React Native `Alert.alert()` |
| `localStorage` | browser localStorage | `@react-native-async-storage/async-storage` |
| HashRouter navigation | `react-router-dom` | `react-navigation` |
| CSS flexbox (auto) | CSS | React Native Flexbox (similar but no `display: grid`) |
| Hover effects | `:hover` CSS | `onPressIn`/`onPressOut` + Animated |
| Audio Web API | HTMLAudioElement | `expo-av` Audio |
| `document.title` update | `document.title = ...` | No equivalent (omit) |
| Dynamic favicon | favicon `<link>` element | No equivalent (omit) |
| Electron features | electronStore, selectMusicFolder | Omit — not applicable |
| Local music player | File system + music-metadata | Omit for now (future feature) |

### ❌ Features to OMIT from Mobile App

- Electron-specific features (system tray, window controls, desktop notifications)
- Local music file playback (the `LocalMusicPlayer` component)
- Keyboard shortcuts panel
- Desktop-specific layout (sidebar, fixed header with search in center)
- CSS Grid layouts (use FlatList / scrollable views)

### Required: Custom Development Build (NOT Expo Go)

If you need these features in the future, they require `expo prebuild` + custom native build:
- Push notifications (`expo-notifications` full background)
- App Store/Google Play presence
- Deep links for Spotify OAuth (for real-time Spotify auth, not scraping)

For now, all features listed in this document CAN be built within Expo Go.

---

## 19. Environment Variables

Create a `.env` file in the project root. Use `expo-constants` or `react-native-dotenv` to access them:

```env
# .env
EXPO_PUBLIC_MUSIC_API_URL=https://saafy-api.vercel.app
EXPO_PUBLIC_RECOMMENDER_URL=https://atharva025-saafy-music-recommender.hf.space/api
EXPO_PUBLIC_MONGODB_URI=mongodb+srv://atharva070720_db_user:5GMto1a6GPCNdz4y@saafy-users-db.tuakqpu.mongodb.net/saafy
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=3fc5d25aef684f0786db56264d427f41
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=8d9e3799ef8b495c99510aef046297da
```

> **Security note:** `EXPO_PUBLIC_` prefix means these are bundled into the app. The MongoDB URI and Spotify secrets are only used server-side (Vercel functions) — the mobile app only calls the REST endpoints, never MongoDB directly. For production, consider making the recommender and music APIs the only public-facing endpoints.

---

## 20. Step-by-Step Build Order

Follow this exact order to avoid circular dependencies and ensure each layer is testable before building on top:

### Phase 1: Project Bootstrap

```bash
npx create-expo-app@latest saafy-mobile --template blank-typescript
cd saafy-mobile
```

Install all dependencies at once:

```bash
npx expo install expo-av expo-linear-gradient expo-blur expo-image-picker expo-image-manipulator expo-file-system expo-font @expo-google-fonts/sora @expo-google-fonts/space-grotesk @expo-google-fonts/syne
npx expo install @react-native-async-storage/async-storage react-native-screens react-native-safe-area-context
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-gesture-handler react-native-reanimated
npm install axios zustand @gorhom/bottom-sheet
```

### Phase 2: Foundation

1. Create `src/constants/colors.ts` with both `lightColors` and `darkColors`
2. Create `src/constants/fonts.ts` with font family name constants
3. Create `src/constants/tokens.ts` with spacing, radius, zIndex
4. Create `src/types/song.ts`, `user.ts`, `playlist.ts`, `navigation.ts`
5. Configure `tsconfig.json` with path aliases (`@/` → `src/`)
6. Load all 3 Google Fonts in `App.tsx` using `useFonts()` hook, show `SplashScreen` until fonts load

### Phase 3: Storage Layer

7. Implement `src/lib/storage.ts` — encrypted AsyncStorage wrappers
8. Implement `src/lib/utils.ts` — `formatTime()`, `formatDuration()`, `getImageUrl()`, `getAudioUrl()`, `decodeHtmlEntities()`, `sanitizeSearchQuery()`

### Phase 4: API Layer

9. Implement `src/api/client.ts` — Axios instance + ResponseCache class
10. Implement `src/api/songs.ts` — `searchSongs()`, `getSong()`, `getSongSuggestions()`
11. Implement `src/api/artists.ts` — `getArtist()`, `getArtistSongs()`
12. Implement `src/api/auth.ts` — `registerUser()`, `loginUser()`
13. Implement `src/api/playlists.ts` — all CRUD operations
14. Implement `src/api/recommender.ts` — `addSongToRecommender()`, `getRecommendations()`
15. Implement `src/lib/discovery.ts` — discovery pools, seeded shuffle, `getForYouMix()`, `getAllDiscoveryContent()`, `getAllThemedContent()`, `getFreshSongsForCategory()`

### Phase 5: Context Layer

16. Implement `src/contexts/ThemeContext.tsx` — colors, fonts, tokens, toggle, persistence
17. Implement `src/contexts/ToastContext.tsx` — toast queue, auto-dismiss
18. Implement `src/contexts/PlayerContext.tsx` — full audio engine with expo-av, queue management, recommendations, playlists, history

### Phase 6: Reusable Components

19. `src/components/Skeleton.tsx` — shimmer loading placeholder
20. `src/components/Song/SongImage.tsx` — lazy image with fallback music note icon
21. `src/components/Song/SongCard.tsx` — square card for horizontal carousels
22. `src/components/Song/SongRow.tsx` — full-width list item
23. `src/components/Toast.tsx` — toast notification component (rendered by ToastProvider)
24. `src/components/Layout/Screen.tsx` — SafeAreaView wrapper with background color
25. `src/components/Search/SearchBar.tsx` — animated search input
26. `src/components/Player/MiniPlayer.tsx` — persistent mini player
27. `src/components/Player/FullPlayer.tsx` — modal full-screen player
28. `src/components/Queue/QueueSheet.tsx` — bottom sheet queue
29. `src/components/Auth/AuthModal.tsx` — login/register modal
30. `src/components/Playlist/PlaylistCard.tsx` and `PlaylistRow.tsx`

### Phase 7: Screens

31. `src/screens/HomeScreen.tsx` — discovery feed with all sections
32. `src/screens/SearchScreen.tsx` — search with history + results
33. `src/screens/LibraryScreen.tsx` — playlists
34. `src/screens/PlaylistScreen.tsx` — single playlist detail
35. `src/screens/ArtistScreen.tsx` — artist detail
36. `src/screens/SettingsScreen.tsx` — settings

### Phase 8: Navigation

37. Set up `src/navigation/` with RootNavigator, TabNavigator, and all Stack navigators
38. Connect FullPlayer modal to root navigator
39. Wire up deep navigation (song card → artist page, etc.)

### Phase 9: Polish & Testing

40. Verify audio plays correctly in background on physical iPhone via Expo Go
41. Verify audio plays correctly on Android via Expo Go
42. Test theme switching (light/dark) persists across app restarts
43. Test login → playlists load → playlist CRUD
44. Test search results + playback
45. Test queue functionality (add, reorder, remove, auto-extend)
46. Test Spotify import
47. Test recommendation flow

---

## App.tsx Root Structure

```tsx
// App.tsx
import { useCallback } from 'react'
import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora'
import { SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk'
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from './src/contexts/ThemeContext'
import { ToastProvider } from './src/contexts/ToastContext'
import { PlayerProvider } from './src/contexts/PlayerContext'
import { RootNavigator } from './src/navigation/RootNavigator'
import { StatusBar } from 'expo-status-bar'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    Syne_700Bold,
    Syne_800ExtraBold,
  })

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <ThemeProvider>
          <ToastProvider>
            <PlayerProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </PlayerProvider>
          </ToastProvider>
        </ThemeProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}
```

---

## Song Type (Complete)

```typescript
// src/types/song.ts
export interface SongImage {
  url: string
  link?: string
  quality?: string
}

export interface SongArtist {
  id: string
  name: string
  image?: SongImage[]
  url?: string
  role?: string
}

export interface Song {
  id: string
  name: string
  title: string
  primaryArtists: string
  artists: SongArtist[]
  album: {
    name: string
    id?: string | null
    url?: string | null
  }
  image: SongImage[]     // Always normalized to 3 items: [50px, 150px, 500px]
  duration: number       // seconds
  downloadUrl: Array<{ url: string; quality?: string; link?: string }>
  language?: string
  year?: string | null
  hasLyrics?: boolean
  playCount?: number | null
  url?: string | null
  recommendationScore?: number
  playedAt?: number      // timestamp, for history entries
}

export interface Artist {
  id: string
  name: string
  image: SongImage[]
  followerCount?: number
  bio?: string
  dominantLanguage?: string
  url?: string
}
```

---

## Playlist Song to Song Normalization (Complete)

```typescript
// When loading songs from a user's playlist for playback
export function normalizePlaylistSongForDisplay(ps: PlaylistSong): Song {
  const imageUrl = ps.image || ''
  return {
    id: ps.id,
    name: ps.name,
    title: ps.name,
    primaryArtists: ps.primaryArtists || '',
    artists: [],
    album: { name: typeof ps.album === 'string' ? ps.album : ps.album?.name || '' },
    image: [
      { url: imageUrl, link: imageUrl },
      { url: imageUrl, link: imageUrl },
      { url: imageUrl, link: imageUrl },
    ],
    duration: Number(ps.duration) || 0,
    downloadUrl: [],  // Fetch fresh via getSong(ps.id) before playback
  }
}
```

---

## Key Differences: Web → Mobile

| Web | Mobile |
|---|---|
| CSS hover states | `onPressIn` / `onPressOut` with Animated |
| CSS position: fixed | React Native's `position: 'absolute'` inside a wrapping View, or NavigationContainer |
| CSS backdrop-filter: blur() | `expo-blur` BlurView |
| CSS grid | FlatList with `numColumns` prop |
| CSS custom properties (--color-accent) | ThemeContext JS values |
| HTML `<audio>` element | `expo-av` `Audio.Sound` |
| `window.scrollY` scroll events | `onScroll` on ScrollView |
| `document.addEventListener` | React Native event system or `useEffect` |
| Framer Motion `<motion.div>` | `react-native-reanimated` `Animated.View` |
| `window.innerWidth < 640` | `Dimensions.get('window').width < 640` or `useWindowDimensions()` |
| `localStorage` | `@react-native-async-storage/async-storage` |
| `alert()` / `confirm()` | `Alert.alert()` |
| CSS `clamp()` for fluid type | Fixed sizes or `useWindowDimensions()` calculations |
| Browser URL routing | React Navigation |
| `<img>` | React Native `<Image>` |

---

*End of specification. Build from Phase 1 through Phase 9 in order. Every feature described here is present in the web codebase — replicate the logic faithfully while adapting to React Native's API surface. The app should feel identical to the web version in functionality and very close in visual design.*
