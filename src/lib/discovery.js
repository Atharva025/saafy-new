/**
 * DISCOVERY ENGINE
 * Provides pseudo-personalized song discovery without authentication
 * 
 * Logic:
 * - Each visitor gets a unique session seed
 * - Seed determines which search queries/artists are used
 * - Songs rotate with each session, no repeats within session
 */

import { searchSongs, searchArtists } from './api'
import { safeGetStorage, safeSetStorage } from './security'

// ============================================================================
// CURATED CONTENT POOLS
// ============================================================================

const DISCOVERY_POOLS = {
    hindi: {
        queries: [
            'Arijit Singh hits', 'Pritam songs', 'A.R. Rahman classics',
            'Shreya Ghoshal best', 'Neha Kakkar popular', 'Jubin Nautiyal',
            'Atif Aslam romantic', 'Sonu Nigam hits', 'Kumar Sanu classics',
            'Lata Mangeshkar', 'Kishore Kumar', 'Mohammed Rafi',
            'Honey Singh party', 'Badshah hits', 'Diljit Dosanjh hindi',
            'Shankar Mahadevan', 'Sunidhi Chauhan', 'Udit Narayan',
            'Bollywood romantic', 'Bollywood party songs', 'Bollywood 90s',
            'Bollywood 2000s hits', 'Hindi unplugged', 'Hindi lofi',
            'Bollywood dance', 'Hindi sad songs', 'Hindi motivational'
        ],
        displayName: 'Hindi'
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
            'Hip hop hits', 'R&B smooth', 'Rock classics',
            'Indie pop', 'English acoustic', 'Trending English'
        ],
        displayName: 'English'
    },
    marathi: {
        queries: [
            'Marathi romantic songs', 'Marathi movie songs', 'Ajay Atul songs',
            'Shankar Mahadevan marathi', 'Avadhoot Gupte', 'Swapnil Bandodkar',
            'Bela Shende songs', 'Marathi lavani', 'Marathi natya sangeet',
            'Marathi unplugged', 'Marathi party songs', 'Marathi devotional',
            'Sairat songs', 'Marathi 90s', 'New marathi songs',
            'Marathi dj songs', 'Marathi sad songs', 'Marathi love songs'
        ],
        displayName: 'Marathi'
    },
    punjabi: {
        queries: [
            'Diljit Dosanjh hits', 'Sidhu Moosewala', 'AP Dhillon',
            'Karan Aujla songs', 'Guru Randhawa', 'Hardy Sandhu',
            'Jassie Gill', 'Ammy Virk songs', 'Jasmine Sandlas',
            'B Praak songs', 'Amrinder Gill', 'Gurdas Maan',
            'Punjabi party songs', 'Punjabi romantic', 'Punjabi bhangra',
            'Punjabi sad songs', 'New punjabi songs', 'Punjabi dj',
            'Punjabi hip hop', 'Punjabi wedding songs', 'Trending punjabi'
        ],
        displayName: 'Punjabi'
    }
}

// ============================================================================
// SESSION SEED MANAGEMENT
// ============================================================================

// In-memory seed - new on every page load for truly fresh content
let currentSeed = null

/**
 * Generate a random seed using timestamp + random for maximum uniqueness
 */
function generateSessionSeed() {
    return Math.floor(Date.now() % 1000000) + Math.floor(Math.random() * 100000)
}

/**
 * Get seed for current page load
 * Generates fresh seed on first call per page load
 * Every reload = new content
 */
function getSessionSeed() {
    if (currentSeed === null) {
        currentSeed = generateSessionSeed()
    }
    return currentSeed
}

/**
 * Seeded random number generator
 * Same seed = same sequence of "random" numbers
 */
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
}

/**
 * Shuffle array using seeded randomness
 */
function seededShuffle(array, seed) {
    const result = [...array]
    let currentSeed = seed

    for (let i = result.length - 1; i > 0; i--) {
        const random = seededRandom(currentSeed++)
        const j = Math.floor(random * (i + 1))
            ;[result[i], result[j]] = [result[j], result[i]]
    }

    return result
}

/**
 * Pick N items from array using seeded randomness
 */
function seededPick(array, count, seed) {
    const shuffled = seededShuffle(array, seed)
    return shuffled.slice(0, count)
}

// ============================================================================
// DISCOVERY FUNCTIONS
// ============================================================================

/**
 * Get discovery query for a language based on session seed
 */
function getDiscoveryQuery(language, index = 0) {
    const seed = getSessionSeed()
    const pool = DISCOVERY_POOLS[language]

    if (!pool) return null

    // Use seed + language hash + index for variety
    const languageHash = language.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const querySeed = seed + languageHash + (index * 17)

    const shuffled = seededShuffle(pool.queries, querySeed)
    return shuffled[0]
}

/**
 * Fetch discovery songs for a specific language
 */
export async function getDiscoverySongs(language, limit = 10) {
    const query = getDiscoveryQuery(language)

    if (!query) {
        return { success: false, songs: [], error: 'Unknown language' }
    }

    try {
        const response = await searchSongs(query, 0, limit)

        if (response.success && response.data?.results) {
            return {
                success: true,
                songs: response.data.results,
                query: query, // For debugging
                language: DISCOVERY_POOLS[language].displayName
            }
        }

        return { success: false, songs: [], error: 'No results' }
    } catch (error) {
        return { success: false, songs: [], error: error.message }
    }
}

/**
 * Fetch discovery content for all configured languages
 */
export async function getAllDiscoveryContent(songsPerLanguage = 8) {
    const languages = Object.keys(DISCOVERY_POOLS)
    const results = {}

    // Fetch all in parallel
    const promises = languages.map(async (lang) => {
        const data = await getDiscoverySongs(lang, songsPerLanguage)
        return { lang, data }
    })

    const resolved = await Promise.all(promises)

    resolved.forEach(({ lang, data }) => {
        results[lang] = data
    })

    return results
}

/**
 * Get a "For You" mix - random songs from all languages
 */
export async function getForYouMix(limit = 12) {
    const seed = getSessionSeed()
    const languages = Object.keys(DISCOVERY_POOLS)
    const selectedLanguages = seededPick(languages, 3, seed)

    const allSongs = []

    for (const lang of selectedLanguages) {
        const data = await getDiscoverySongs(lang, 6)
        if (data.success) {
            allSongs.push(...data.songs)
        }
    }

    // Shuffle the combined results
    const shuffled = seededShuffle(allSongs, seed + 999)

    return {
        success: true,
        songs: shuffled.slice(0, limit),
        title: 'For You'
    }
}

/**
 * Generate a new seed (for "refresh" button)
 * Resets the in-memory seed so next calls get fresh content
 */
export function refreshDiscovery() {
    currentSeed = generateSessionSeed()
    return currentSeed
}

/**
 * Get display names for languages
 */
export function getLanguageDisplayName(language) {
    return DISCOVERY_POOLS[language]?.displayName || language
}

/**
 * Get all available languages
 */
export function getAvailableLanguages() {
    return Object.keys(DISCOVERY_POOLS)
}
