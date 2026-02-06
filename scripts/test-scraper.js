/**
 * Test Scraper - Tests the scraping logic on a single year
 * Run this first to verify the scraper works before full execution
 */

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://myswar.co';
const TEST_YEAR = 2020; // Test with a recent year

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
    'Cache-Control': 'max-age=0'
};

async function testScraper() {
    console.log('🧪 Testing scraper with year:', TEST_YEAR);
    console.log('='.repeat(60));

    try {
        // Test 1: Fetch year page
        console.log('\n1️⃣ Testing year page fetch...');
        const yearUrl = `${BASE_URL}/album/year/${TEST_YEAR}`;
        console.log(`Fetching: ${yearUrl}`);

        const yearResponse = await axios.get(yearUrl, {
            headers: BROWSER_HEADERS,
            timeout: 30000,
            maxRedirects: 5
        });
        console.log('✅ Successfully fetched year page');
        console.log(`Status: ${yearResponse.status}`);
        console.log(`Content length: ${yearResponse.data.length} bytes`);

        // Test 2: Parse album URLs
        console.log('\n2️⃣ Testing album URL extraction...');
        const $ = cheerio.load(yearResponse.data);
        const albums = [];

        $('a[href*="/album/"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.match(/^\/album\/[a-z0-9-]+-\d{4}$/) && !href.includes('/year/')) {
                const fullUrl = `${BASE_URL}${href}`;
                if (!albums.includes(fullUrl)) {
                    albums.push(fullUrl);
                }
            }
        });

        console.log(`✅ Found ${albums.length} unique albums`);

        if (albums.length === 0) {
            console.log('⚠️ No albums found! The page structure may have changed.');
            console.log('\nDebugging info:');
            console.log('All links found:');
            $('a').slice(0, 20).each((i, elem) => {
                console.log(`  - ${$(elem).attr('href')}`);
            });
            return;
        }

        // Test 3: Fetch a sample album
        console.log('\n3️⃣ Testing album page fetch...');
        const sampleAlbum = albums[0];
        console.log(`Sample album: ${sampleAlbum}`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        const albumResponse = await axios.get(sampleAlbum, {
            headers: BROWSER_HEADERS,
            timeout: 30000,
            maxRedirects: 5
        });
        console.log('✅ Successfully fetched album page');
        console.log(`Status: ${albumResponse.status}`);

        // Test 4: Extract song information
        console.log('\n4️⃣ Testing song extraction...');
        const $album = cheerio.load(albumResponse.data);

        const albumName = $album('h1').first().text().trim();
        console.log(`Album name: ${albumName}`);

        // Look for music director
        let musicDirector = '';
        $album('b:contains("Music Director:")').parent().find('a').each((i, elem) => {
            if (musicDirector) musicDirector += ', ';
            musicDirector += $album(elem).text().trim();
        });
        console.log(`Music Director: ${musicDirector || 'Not found'}`);

        // Look for artists
        let artist = '';
        $album('b:contains("Artist:")').parent().find('a').each((i, elem) => {
            if (artist) artist += ', ';
            artist += $album(elem).text().trim();
        });
        console.log(`Artist: ${artist || 'Not found'}`);

        // Look for songs
        const songs = [];
        $album('a[href*="/song_details/"]').each((i, elem) => {
            const songName = $album(elem).text().trim();
            if (songName && songName.length > 0 && songName.length < 200) {
                songs.push(songName);
            }
        });

        console.log(`\n✅ Found ${songs.length} songs`);
        if (songs.length > 0) {
            console.log('\nSample songs:');
            songs.slice(0, 5).forEach((song, i) => {
                console.log(`  ${i + 1}. ${song}`);
            });
        } else {
            console.log('⚠️ No songs found! Debugging page structure...');
            console.log('\nAll links in album page:');
            $album('a').slice(0, 20).each((i, elem) => {
                const href = $album(elem).attr('href');
                const text = $album(elem).text().trim();
                if (text.length > 0 && text.length < 100) {
                    console.log(`  - ${text} (${href})`);
                }
            });
        }

        // Test 5: CSV format test
        console.log('\n5️⃣ Testing CSV format...');
        if (songs.length > 0 && (artist || musicDirector)) {
            const sampleSong = {
                song_name: songs[0].replace(/,/g, ' '),
                artist: (artist || musicDirector).replace(/,/g, ' '),
                album: albumName.replace(/,/g, ' '),
                year: TEST_YEAR
            };

            const csvRow = `"${sampleSong.song_name}","${sampleSong.artist}","${sampleSong.album}","${sampleSong.year}"`;
            console.log('Sample CSV row:');
            console.log(csvRow);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Test completed successfully!');
        console.log('\n📝 Ready to run full scraper. Execute:');
        console.log('   npm run scrape');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);

        if (error.response) {
            console.error(`\n📊 Response Details:`);
            console.error(`Status: ${error.response.status} ${error.response.statusText}`);
            console.error(`URL: ${error.config?.url}`);

            if (error.response.status === 403) {
                console.error('\n🚫 403 Forbidden - Website is blocking automated requests');
                console.error('\nPossible solutions:');
                console.error('1. The website may have anti-bot protection (Cloudflare, etc.)');
                console.error('2. Try accessing the URL in your browser first:');
                console.error(`   ${BASE_URL}/album/year/${TEST_YEAR}`);
                console.error('3. The website structure may require authentication');
                console.error('4. Consider using a different data source or API');
            }
        } else if (error.request) {
            console.error('\n🌐 No response received - check your internet connection');
        } else {
            console.error('\n⚙️ Error setting up request:', error.message);
        }
    }
}

// Run test
testScraper();
