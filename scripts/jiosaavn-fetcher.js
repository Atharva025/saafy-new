/**
 * JioSaavn API Song Fetcher
 * 
 * Alternative to web scraping - uses JioSaavn's official API
 * to fetch songs legally and populate the recommendation database
 * 
 * This is RECOMMENDED over web scraping MySwar.co
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// JioSaavn API endpoints (same as your app uses)
const JIOSAAVN_BASE = 'https://jiosaavn-api-privatecvc2.vercel.app';
const OUTPUT_FILE = path.join(__dirname, 'data', 'jiosaavn_songs.csv');
const DELAY_MS = 500; // Faster since it's an official API

// Popular search terms to find diverse songs - ROUND 2 (New searches)
const SEARCH_QUERIES = [
    // Legendary singers (classics)
    'Kishore Kumar', 'Lata Mangeshkar', 'Mohammed Rafi', 'Asha Bhosle',
    'Kumar Sanu', 'Alka Yagnik', 'Udit Narayan', 'Kavita Krishnamurthy',
    
    // Modern artists (not in previous search)
    'Jubin Nautiyal', 'Darshan Raval', 'Guru Randhawa', 'Tony Kakkar',
    'Badshah', 'Yo Yo Honey Singh', 'B Praak', 'Harrdy Sandhu',
    'Tulsi Kumar', 'Dhvani Bhanushali', 'Asees Kaur', 'Millind Gaba',
    
    // Music directors (different from Round 1)
    'Anu Malik', 'Jatin Lalit', 'Nadeem Shravan', 'Sajid Wajid',
    'Himesh Reshammiya', 'Mithoon', 'Tanishk Bagchi', 'Sachin Jigar',
    
    // Regional cinema
    'Tamil songs', 'Telugu hits', 'Punjabi songs', 'Marathi songs',
    'Malayalam hits', 'Bengali songs', 'Gujarati songs',
    
    // Popular movies (different from Round 1)
    'Pathaan', 'Tiger 3', 'Animal', 'Jawan', 'Dhoom',
    'Chennai Express', 'Bajirao Mastani', 'Padmaavat', 'Sanju',
    'War', 'Student of the Year', 'Barfi', 'PK', 'Dangal',
    
    // Decades & eras
    '90s bollywood', '80s hits', '2000s songs', 'retro hits',
    'classic hindi', 'golden era', 'old hindi songs',
    
    // Specific genres & moods
    'item songs', 'ghazals', 'qawwali', 'folk songs', 'wedding songs',
    'breakup songs', 'motivational', 'friendship songs', 'rain songs',
    
    // Recent hits (2025-2026)
    'latest hindi songs 2025', 'new songs 2026', 'trending now',
    'viral songs', 'chartbusters 2024'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Search JioSaavn API
async function searchSongs(query, limit = 20) {
    try {
        const response = await axios.get(`${JIOSAAVN_BASE}/search/songs`, {
            params: { query, limit }
        });

        if (response.data?.data?.results) {
            return response.data.data.results;
        }
        return [];
    } catch (error) {
        console.error(`❌ Search failed for "${query}":`, error.message);
        return [];
    }
}

// Get album songs
async function getAlbumSongs(albumId) {
    try {
        const response = await axios.get(`${JIOSAAVN_BASE}/albums`, {
            params: { id: albumId }
        });

        if (response.data?.data?.songs) {
            return response.data.data.songs;
        }
        return [];
    } catch (error) {
        console.error(`❌ Album fetch failed:`, error.message);
        return [];
    }
}

// Extract clean data from song object
function parseSongData(song) {
    const songName = (song.name || song.title || '').replace(/[",]/g, ' ').trim();
    const artist = (song.primaryArtists || song.singers || song.artist?.name || 'Unknown')
        .replace(/[",]/g, ' ').trim();
    const album = (song.album?.name || song.albumName || 'Single')
        .replace(/[",]/g, ' ').trim();
    const year = song.year || song.releaseDate?.split('-')[0] || new Date().getFullYear();

    return { songName, artist, album, year, id: song.id };
}

// Main scraping function
async function fetchSongs() {
    console.log('🎵 JioSaavn Song Fetcher - Round 2');
    console.log('═'.repeat(60));
    console.log(`Total search queries: ${SEARCH_QUERIES.length}`);
    console.log(`Output: ${OUTPUT_FILE}\n`);

    // Create output directory
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load existing song IDs to avoid duplicates
    const seenSongIds = new Set();
    let existingSongs = 0;
    
    if (fs.existsSync(OUTPUT_FILE)) {
        console.log('📖 Loading existing songs to avoid duplicates...');
        const existingContent = fs.readFileSync(OUTPUT_FILE, 'utf-8');
        const lines = existingContent.split('\n').slice(1); // Skip header
        
        for (const line of lines) {
            if (!line.trim()) continue;
            const match = line.match(/^"([^"]+)"/);
            if (match) {
                seenSongIds.add(match[1]);
                existingSongs++;
            }
        }
        console.log(`✅ Loaded ${existingSongs} existing songs\n`);
    } else {
        // Create new file with header
        fs.writeFileSync(OUTPUT_FILE, 'song_id,song_name,artist,album,year\n');
    }

    let totalSongs = existingSongs;
    let newSongsAdded = 0;
    let queriesProcessed = 0;

    for (const query of SEARCH_QUERIES) {
        queriesProcessed++;
        console.log(`\n[${queriesProcessed}/${SEARCH_QUERIES.length}] Searching: "${query}"`);

        const songs = await searchSongs(query, 20);
        console.log(`  Found ${songs.length} results`);

        let newSongs = 0;
        for (const song of songs) {
            const { songName, artist, album, year, id } = parseSongData(song);

            // Skip duplicates
            if (seenSongIds.has(id)) continue;
            seenSongIds.add(id);

            // Write to CSV
            const csvRow = `"${id}","${songName}","${artist}","${album}","${year}"\n`;
            fs.appendFileSync(OUTPUT_FILE, csvRow);

            newSongs++;
            newSongsAdded++;
            totalSongs++;
        }

        console.log(`  ✅ Added ${newSongs} new songs (${songs.length - newSongs} duplicates)`);
        console.log(`  📊 Total unique songs: ${totalSongs}`);

        // Rate limiting
        await sleep(DELAY_MS);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Fetching Complete!');
    console.log('═'.repeat(60));
    console.log(`📊 Statistics:`);
    console.log(`   Existing songs: ${existingSongs}`);
    console.log(`   New songs added: ${newSongsAdded}`);
    console.log(`   Total unique songs: ${totalSongs}`);
    console.log(`   Search queries: ${queriesProcessed}`);
    console.log(`   Output file: ${OUTPUT_FILE}`);
    console.log(`   File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
    console.log('═'.repeat(60));
    console.log('\n💡 Next steps:');
    console.log('   1. Review the CSV file');
    console.log('   2. Import songs to your recommendation backend');
    console.log('   3. Use the import-jiosaavn.js script for bulk upload');
}

// Run the fetcher
console.log('🚀 Starting in 3 seconds...\n');
setTimeout(() => {
    fetchSongs().catch(error => {
        console.error('\n❌ Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
}, 3000);
