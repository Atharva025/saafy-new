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

// Configuration for targeted fetching
const TARGET_ENGLISH_SONGS = 500;
const TARGET_MARATHI_SONGS = 500;

// English songs search queries
const ENGLISH_QUERIES = [
    // Popular English Artists
    'Ed Sheeran', 'Taylor Swift', 'Justin Bieber', 'Ariana Grande',
    'The Weeknd', 'Drake', 'Post Malone', 'Billie Eilish',
    'Bruno Mars', 'Maroon 5', 'Coldplay', 'Imagine Dragons',
    'OneRepublic', 'Shawn Mendes', 'Dua Lipa', 'Harry Styles',
    'Adele', 'Sam Smith', 'Charlie Puth', 'John Legend',

    // English Rock/Pop Bands
    'Beatles', 'Queen', 'Eagles', 'Bon Jovi', 'Metallica',
    'Linkin Park', 'Green Day', 'Nirvana', 'Red Hot Chili Peppers',
    'AC/DC', 'Guns N Roses', 'Pink Floyd', 'Led Zeppelin',

    // Contemporary English Artists
    'The Chainsmokers', 'Twenty One Pilots', 'Panic At The Disco',
    'Fall Out Boy', 'Paramore', 'Arctic Monkeys', 'Khalid',
    'Halsey', 'Camila Cabello', 'BTS English', 'BlackPink English',

    // English Hit Songs/Genres
    'English pop hits', 'English rock songs', 'English love songs',
    'English dance songs', 'English party songs', 'English rap',
    'EDM hits', 'top English songs', 'English chart toppers',
    'English radio hits', 'English 2024', 'English 2025',

    // More English Artists
    'Katy Perry', 'Lady Gaga', 'Rihanna', 'Beyonce', 'Eminem',
    'Kanye West', 'Jay Z', 'Nicki Minaj', 'Cardi B', 'Travis Scott',
    'Selena Gomez', 'Demi Lovato', 'Miley Cyrus', 'Jonas Brothers',
    'One Direction', 'Zayn', 'Niall Horan', 'Louis Tomlinson'
];

// Marathi songs search queries
const MARATHI_QUERIES = [
    // Marathi Legendary Singers
    'Lata Mangeshkar Marathi', 'Asha Bhosle Marathi', 'Suresh Wadkar Marathi',
    'Anuradha Paudwal Marathi', 'Usha Mangeshkar Marathi', 'Hridaynath Mangeshkar',

    // Modern Marathi Artists
    'Ajay Atul', 'Shankar Mahadevan Marathi', 'Amitraj Marathi',
    'Ajay Gogavale', 'Atul Gogavale', 'Adarsh Shinde', 'Vaishali Samant',
    'Bela Shende', 'Swapnil Bandodkar', 'Shreya Ghoshal Marathi',
    'Sonu Nigam Marathi', 'Rohan Pradhan', 'Jasraj Joshi',

    // More Marathi Singers
    'Anand Shinde', 'Avadhoot Gandhi', 'Kavita Ram', 'Rahul Deshpande',
    'Hrishikesh Ranade', 'Saurabh Bhalerao', 'Shalmali Kholgade Marathi',
    'Hariharan Marathi', 'Mahesh Kale', 'Priyanka Barve', 'Sayali Pankaj',

    // Even More Marathi Artists
    'Avdhoot Gupte', 'Rohit Raut', 'Anandi Joshi', 'Urmila Dhangar',
    'Pravin Kunwar', 'Aanandi Joshi', 'Sonali Sonawane', 'Keval Walanj',
    'Hariharàn Marathi', 'Mugdha Vaishampayan', 'Shriram Iyer',

    // Marathi Movies (Popular)
    'Sairat', 'Natsamrat', 'Shala', 'Duniyadari', 'Timepass',
    'Lai Bhaari', 'Zenda', 'Mulshi Pattern', 'Jhund', 'Fandry',
    'Court', 'Killa', 'Yellow', 'Balak Palak', 'Jogwa',
    'Harishchandrachi Factory', 'Shwaas', 'Natarang', 'Deool',
    'Katyar Kaljat Ghusali', 'Sangharsh', 'Pak Pak Pakaak',

    // More Marathi Movies
    'Zapatlela', 'Ashi Hi Banwa Banwi', 'Mitwaa', 'Dagdi Chawl',
    'Sairat songs', 'Zingaat', 'Aarti Marathi', 'Powada Marathi',
    'Marathi DJ songs', 'Marathi remix', 'Marathi dance',

    // Marathi Music Categories
    'Marathi love songs', 'Marathi romantic songs', 'Marathi sad songs',
    'Marathi item songs', 'Marathi folk songs', 'Marathi devotional',
    'Marathi lavani', 'Marathi bhakti geet', 'Marathi wedding songs',

    // More Marathi Categories
    'Marathi party songs', 'Marathi Ganpati songs', 'Marathi dholki songs',
    'Marathi bhajan', 'Marathi kawwali', 'Marathi abhang', 'Marathi aarti',
    'Marathi rap', 'Marathi hip hop', 'Marathi rock', 'Marathi indie',

    // Festival Songs
    'Marathi Diwali songs', 'Marathi Holi songs', 'Marathi Navratri songs',
    'Marathi Gudi Padwa songs', 'Marathi Shiv Jayanti songs',

    // Devotional by Deity
    'Marathi Vitthal songs', 'Marathi Mahadev songs', 'Marathi Devi songs',
    'Marathi Krishna songs', 'Marathi Ram songs', 'Marathi Hanuman songs',

    // Recent Marathi Hits
    'latest Marathi songs', 'new Marathi songs 2024', 'Marathi songs 2025',
    'Marathi trending songs', 'Marathi chartbusters', 'popular Marathi songs',

    // More Recent Marathi Movies
    'Singham Marathi', 'Bol Bachchan Marathi', 'Daagdi Chaawl',
    'Faster Fene', 'Ti Saddhya Kay Karte', 'Classmates Marathi',
    'Checkmate Marathi', 'Vazandar', 'Poshter Girl', 'Poshter Boyz',
    'Highway Marathi', 'Lokmanya', 'Priyatama', 'Sanngto Aika',

    // Additional Marathi Content
    'Mumbai Pune Mumbai', 'Aga Bai Arechya', 'De Dhakka', 'Balgandharva',
    'Fatteshikast', 'Maharashtra Shaheer', 'Marathi film songs',
    'Marathi classical', 'Marathi natyageet', 'Marathi tamasha',

    // More Marathi specific
    'Shivaji Maharaj songs', 'Marathi patriotic', 'Marathi motivational',
    'Marathi qawwali', 'Marathi dance numbers', 'Marathi fast songs',
    'Marathi slow songs', 'Marathi club mix', 'Marathi EDM',
    'Marathi unplugged', 'Marathi cover songs', 'Marathi mashup',

    // Additional specific searches
    'Aai Marathi songs', 'Marathi mother songs', 'Marathi birthday songs',
    'Marathi anniversary songs', 'Marathi status songs', 'Marathi ringtones',
    'Marathi garba', 'Marathi dandiya', 'Marathi navri songs',
    'Marathi groom songs', 'Marathi baby songs', 'Marathi lullaby',
    'Marathi tik tok songs', 'Marathi instagram songs', 'Marathi viral songs',
    'Marathi chartbuster 2026', 'Marathi superhit songs', 'Marathi blockbuster'
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

// Helper function to detect if a song is in a specific language
function detectLanguage(song, searchQuery = '') {
    const { songName, artist, album } = parseSongData(song);
    const combinedText = `${songName} ${artist} ${album}`.toLowerCase();
    const query = searchQuery.toLowerCase();

    // If the search query is Marathi-related, be very lenient
    const marathiSearchTerms = ['marathi', 'sairat', 'natsamrat', 'ajay atul',
        'lavani', 'bhakti', 'shree', 'swami', 'ganpati'];
    const isMarathiQuery = marathiSearchTerms.some(term => query.includes(term));

    // English detection - must be very clearly English
    const definiteEnglishArtists = ['ed sheeran', 'taylor swift', 'justin bieber',
        'ariana grande', 'weeknd', 'drake', 'coldplay',
        'imagine dragons', 'beatles', 'queen', 'metallica',
        'bruno mars', 'maroon 5', 'billie eilish', 'post malone',
        'adele', 'sam smith', 'charlie puth', 'eminem', 'beyonce'];

    const isDefinitelyEnglish = definiteEnglishArtists.some(artist =>
        combinedText.includes(artist)
    );

    if (isDefinitelyEnglish) {
        return 'english';
    }

    // For Marathi queries, accept the song unless it's definitely English
    if (isMarathiQuery) {
        return 'marathi';
    }

    // For English queries, check if it's clearly English (mostly ASCII)
    const hasOnlyAscii = /^[a-z0-9\s\-&,.'()]+$/i.test(songName + ' ' + artist);
    if (hasOnlyAscii && !query.includes('marathi')) {
        return 'english';
    }

    return 'other';
}

// Main scraping function
async function fetchSongs() {
    console.log('🎵 JioSaavn Song Fetcher - English & Marathi Edition');
    console.log('═'.repeat(60));
    console.log(`Target: ${TARGET_ENGLISH_SONGS} English songs + ${TARGET_MARATHI_SONGS} Marathi songs`);
    console.log(`Output: ${OUTPUT_FILE}\n`);

    // Create output directory
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load existing song IDs to avoid duplicates
    const seenSongIds = new Set();
    let existingSongs = 0;
    let existingEnglish = 0;
    let existingMarathi = 0;

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

                // Try to detect language from existing songs
                const parts = line.split('","');
                if (parts.length >= 3) {
                    const text = parts.slice(1, 3).join(' ').toLowerCase();
                    if (text.includes('english') || /^[a-z0-9\s\-&,.'"()]+$/i.test(text)) {
                        existingEnglish++;
                    } else if (text.includes('marathi') || text.includes('मराठी')) {
                        existingMarathi++;
                    }
                }
            }
        }
        console.log(`✅ Loaded ${existingSongs} existing songs`);
        console.log(`   (Estimated: ${existingEnglish} English, ${existingMarathi} Marathi)\n`);
    } else {
        // Create new file with header
        fs.writeFileSync(OUTPUT_FILE, 'song_id,song_name,artist,album,year\n');
    }

    let totalSongs = existingSongs;
    let englishCount = existingEnglish;
    let marathiCount = existingMarathi;
    let otherCount = existingSongs - existingEnglish - existingMarathi;

    // Process English songs first
    console.log('\n🇬🇧 PHASE 1: Fetching English Songs');
    console.log('─'.repeat(60));

    for (const query of ENGLISH_QUERIES) {
        if (englishCount >= TARGET_ENGLISH_SONGS) {
            console.log(`✅ Reached target of ${TARGET_ENGLISH_SONGS} English songs!`);
            break;
        }

        console.log(`\n[${englishCount}/${TARGET_ENGLISH_SONGS}] Searching: "${query}"`);
        const songs = await searchSongs(query, 25);
        console.log(`  Found ${songs.length} results`);

        let newSongs = 0;
        for (const song of songs) {
            if (englishCount >= TARGET_ENGLISH_SONGS) break;

            const { songName, artist, album, year, id } = parseSongData(song);

            // Skip duplicates
            if (seenSongIds.has(id)) continue;

            const language = detectLanguage(song, query);
            if (language !== 'english') {
                continue;  // Skip silently for cleaner output
            }

            seenSongIds.add(id);

            // Write to CSV
            const csvRow = `"${id}","${songName}","${artist}","${album}","${year}"\n`;
            fs.appendFileSync(OUTPUT_FILE, csvRow);

            newSongs++;
            englishCount++;
            totalSongs++;

            if (newSongs <= 3) {
                console.log(`  ✅ ${songName} - ${artist}`);
            }
        }

        console.log(`  📊 Added ${newSongs} songs | Total English: ${englishCount}/${TARGET_ENGLISH_SONGS}`);

        // Rate limiting
        await sleep(DELAY_MS);
    }

    // Process Marathi songs
    console.log('\n\n🇮🇳 PHASE 2: Fetching Marathi Songs');
    console.log('─'.repeat(60));

    for (const query of MARATHI_QUERIES) {
        if (marathiCount >= TARGET_MARATHI_SONGS) {
            console.log(`✅ Reached target of ${TARGET_MARATHI_SONGS} Marathi songs!`);
            break;
        }

        console.log(`\n[${marathiCount}/${TARGET_MARATHI_SONGS}] Searching: "${query}"`);
        const songs = await searchSongs(query, 25);
        console.log(`  Found ${songs.length} results`);

        let newSongs = 0;
        for (const song of songs) {
            if (marathiCount >= TARGET_MARATHI_SONGS) break;

            const { songName, artist, album, year, id } = parseSongData(song);

            // Skip duplicates
            if (seenSongIds.has(id)) continue;

            // For Marathi queries, be more lenient - accept unless clearly English
            const language = detectLanguage(song, query);
            if (language === 'english') {
                continue;  // Skip only if definitely English
            }

            seenSongIds.add(id);

            // Write to CSV
            const csvRow = `"${id}","${songName}","${artist}","${album}","${year}"\n`;
            fs.appendFileSync(OUTPUT_FILE, csvRow);

            newSongs++;
            marathiCount++;
            totalSongs++;

            if (newSongs <= 3) {
                console.log(`  ✅ ${songName} - ${artist}`);
            }
        }

        console.log(`  📊 Added ${newSongs} songs | Total Marathi: ${marathiCount}/${TARGET_MARATHI_SONGS}`);

        // Rate limiting
        await sleep(DELAY_MS);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Fetching Complete!');
    console.log('═'.repeat(60));
    console.log(`📊 Statistics:`);
    console.log(`   English songs: ${englishCount}/${TARGET_ENGLISH_SONGS} ✅`);
    console.log(`   Marathi songs: ${marathiCount}/${TARGET_MARATHI_SONGS} ✅`);
    console.log(`   Total songs in database: ${totalSongs}`);
    console.log(`   New songs added: ${totalSongs - existingSongs}`);
    console.log(`   Output file: ${OUTPUT_FILE}`);
    console.log(`   File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
    console.log('═'.repeat(60));
    console.log('\n💡 Next steps:');
    console.log('   1. Review the CSV file');
    console.log('   2. Run: npm run import');
    console.log('   3. Songs will be uploaded to your recommendation backend');
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
