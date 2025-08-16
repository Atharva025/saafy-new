// Test script to check API response structure
async function testAPI() {
    try {
        // Test search endpoint
        console.log('Testing search endpoint...');
        const searchResponse = await fetch('https://saafy-api.vercel.app/api/search/songs?query=blinding lights&limit=1');
        const searchData = await searchResponse.json();
        console.log('Search result:', JSON.stringify(searchData, null, 2));

        if (searchData.data && searchData.data.results && searchData.data.results[0]) {
            const songId = searchData.data.results[0].id;
            console.log('\nTesting song details endpoint with ID:', songId);

            // Test song details endpoint
            const songResponse = await fetch(`https://saafy-api.vercel.app/api/songs/${songId}`);
            const songData = await songResponse.json();
            console.log('Song details:', JSON.stringify(songData, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testAPI();
