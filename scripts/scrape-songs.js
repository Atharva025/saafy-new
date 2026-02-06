/**
 * MySwar Song Scraper (2000-2026)
 * Scrapes all songs from myswar.co and generates a CSV file
 * for database population
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const START_YEAR = 2000;
const END_YEAR = 2026;
const BASE_URL = 'https://myswar.co';
const OUTPUT_FILE = path.join(__dirname, 'data', 'songs_2000_2026.csv');
const DELAY_MS = 2000; // 2 seconds delay to avoid 403 errors
const MAX_RETRIES = 3;

// Realistic browser headers to avoid 403 errors
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
    'DNT': '1'
};

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry logic for failed requests
async function fetchWithRetry(url, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                headers: BROWSER_HEADERS,
                timeout: 30000,
                maxRedirects: 5
            });
            return response.data;
        } catch (error) {
            const status = error.response?.status || 'unknown';
            console.error(`❌ Attempt ${i + 1}/${retries} failed for ${url}: ${error.message} (Status: ${status})`);

            if (error.response?.status === 403) {
                console.error('🚫 403 Forbidden - Website is blocking automated requests.');
                console.error('This may indicate anti-bot protection (Cloudflare, etc.)');
                throw new Error('Website blocking detected. Cannot proceed with scraping.');
            }

            if (i === retries - 1) throw error;

            // Exponential backoff with longer delays
            const delay = DELAY_MS * Math.pow(2, i);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await sleep(delay);
        }
    }
}

// Extract album URLs from a year page
async function getAlbumUrlsFromYear(year) {
    console.log(`\n📅 Fetching albums from year: ${year}`);
    const albums = [];

    try {
        // Get first page to determine total pages
        const firstPageUrl = `${BASE_URL}/album/year/${year}`;
        const html = await fetchWithRetry(firstPageUrl);
        const $ = cheerio.load(html);

        // Extract album links from the page
        $('a[href*="/album/"]').each((i, elem) => {
            const href = $(elem).attr('href');
            // Filter out navigation links and only get album detail pages
            if (href && href.match(/^\/album\/[a-z0-9-]+-\d{4}$/) && !href.includes('/year/')) {
                const fullUrl = `${BASE_URL}${href}`;
                if (!albums.includes(fullUrl)) {
                    albums.push(fullUrl);
                }
            }
        });

        console.log(`✅ Found ${albums.length} albums for year ${year}`);
        return albums;
    } catch (error) {
        console.error(`❌ Error fetching year ${year}:`, error.message);
        return [];
    }
}

// Extract songs from an album page
async function getSongsFromAlbum(albumUrl) {
    try {
        await sleep(DELAY_MS); // Be respectful to the server

        const html = await fetchWithRetry(albumUrl);
        const $ = cheerio.load(html);
        const songs = [];

        // Extract album name and year
        const albumName = $('h1').first().text().trim();
        const yearMatch = albumUrl.match(/-(\d{4})$/);
        const year = yearMatch ? yearMatch[1] : '';

        // Extract music director
        let musicDirector = '';
        $('b:contains("Music Director:")').parent().find('a').each((i, elem) => {
            if (musicDirector) musicDirector += ', ';
            musicDirector += $(elem).text().trim();
        });

        // Extract primary artist
        let primaryArtist = '';
        $('b:contains("Artist:")').parent().find('a').each((i, elem) => {
            if (primaryArtist) primaryArtist += ', ';
            primaryArtist += $(elem).text().trim();
        });

        // If no artist found, use music director
        if (!primaryArtist && musicDirector) {
            primaryArtist = musicDirector;
        }

        // Extract song titles - they are usually in a list or table
        $('.song-title, .track-name, a[href*="/song_details/"]').each((i, elem) => {
            const songName = $(elem).text().trim();

            if (songName && songName.length > 0 && songName.length < 200) {
                // Try to get specific artist for this song if available
                let songArtist = primaryArtist;
                const parentRow = $(elem).closest('tr, div');
                const artistInRow = parentRow.find('.artist, [class*="artist"]').text().trim();
                if (artistInRow && artistInRow.length > 0) {
                    songArtist = artistInRow;
                }

                songs.push({
                    song_name: songName.replace(/,/g, ' ').replace(/\s+/g, ' ').trim(),
                    artist: songArtist.replace(/,/g, ' ').replace(/\s+/g, ' ').trim() || 'Various Artists',
                    album: albumName.replace(/,/g, ' ').replace(/\s+/g, ' ').trim(),
                    year: year
                });
            }
        });

        // Alternative: Look for song links in common patterns
        if (songs.length === 0) {
            $('a').each((i, elem) => {
                const href = $(elem).attr('href');
                if (href && href.includes('/song_details/')) {
                    const songName = $(elem).text().trim();
                    if (songName && songName.length > 0 && songName.length < 200) {
                        songs.push({
                            song_name: songName.replace(/,/g, ' ').replace(/\s+/g, ' ').trim(),
                            artist: primaryArtist.replace(/,/g, ' ').replace(/\s+/g, ' ').trim() || 'Various Artists',
                            album: albumName.replace(/,/g, ' ').replace(/\s+/g, ' ').trim(),
                            year: year
                        });
                    }
                }
            });
        }

        if (songs.length > 0) {
            console.log(`  ✅ ${albumName}: ${songs.length} songs`);
        }

        return songs;
    } catch (error) {
        console.error(`  ❌ Error scraping ${albumUrl}:`, error.message);
        return [];
    }
}

// Main scraping function
async function scrapeAllSongs() {
    console.log('🎵 Starting MySwar Song Scraper');
    console.log(`📅 Years: ${START_YEAR} - ${END_YEAR}`);
    console.log(`📁 Output: ${OUTPUT_FILE}\n`);

    const allSongs = [];
    const stats = {
        totalYears: 0,
        totalAlbums: 0,
        totalSongs: 0,
        errors: 0
    };

    // Create CSV header
    const csvHeader = 'song_name,artist,album,year\n';

    // Ensure data directory exists
    const dataDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write header to file
    fs.writeFileSync(OUTPUT_FILE, csvHeader, 'utf8');

    // Process each year
    for (let year = START_YEAR; year <= END_YEAR; year++) {
        stats.totalYears++;

        try {
            // Get all albums for this year
            const albumUrls = await getAlbumUrlsFromYear(year);
            stats.totalAlbums += albumUrls.length;

            // Process each album
            for (const albumUrl of albumUrls) {
                try {
                    const songs = await getSongsFromAlbum(albumUrl);

                    // Append songs to CSV immediately (to avoid memory issues)
                    if (songs.length > 0) {
                        const csvRows = songs.map(song =>
                            `"${song.song_name}","${song.artist}","${song.album}","${song.year}"`
                        ).join('\n') + '\n';

                        fs.appendFileSync(OUTPUT_FILE, csvRows, 'utf8');
                        stats.totalSongs += songs.length;
                        allSongs.push(...songs);
                    }
                } catch (error) {
                    stats.errors++;
                    console.error(`  ❌ Failed to process album:`, error.message);
                }
            }

            console.log(`📊 Progress: ${year} complete | Total songs: ${stats.totalSongs}`);

        } catch (error) {
            stats.errors++;
            console.error(`❌ Failed to process year ${year}:`, error.message);
        }
    }

    // Print final statistics
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Scraping Complete!');
    console.log('='.repeat(60));
    console.log(`📅 Years processed:    ${stats.totalYears}`);
    console.log(`💿 Albums processed:   ${stats.totalAlbums}`);
    console.log(`🎵 Songs extracted:    ${stats.totalSongs}`);
    console.log(`❌ Errors:             ${stats.errors}`);
    console.log(`📁 Output file:        ${OUTPUT_FILE}`);
    console.log('='.repeat(60));

    return allSongs;
}

// Run the scraper
if (require.main === module) {
    scrapeAllSongs()
        .then(() => {
            console.log('\n✅ Script completed successfully!');
            console.log('📝 Next steps:');
            console.log('   1. Review the CSV file for accuracy');
            console.log('   2. Import to your database');
            console.log('   3. Use the data for song recommendations\n');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeAllSongs, getAlbumUrlsFromYear, getSongsFromAlbum };
