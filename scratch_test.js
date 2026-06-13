const { Client } = require('./node_modules/lrclib-api');
const client = new Client();

async function run() {
    try {
        console.log("=== Test 1: findLyrics with track_name only (artist_name: '') ===");
        const res1 = await client.findLyrics({ track_name: "Starboy", artist_name: "" });
        console.log("Test 1 Success:", res1.trackName, "by", res1.artistName);
    } catch (e) {
        console.log("Test 1 Failed:", e.message || e);
    }

    try {
        console.log("\n=== Test 2: getSynced with track_name only (artist_name: '') ===");
        const res2 = await client.getSynced({ track_name: "Starboy", artist_name: "" });
        console.log("Test 2 Success (count):", res2 ? res2.length : null);
    } catch (e) {
        console.log("Test 2 Failed:", e.message || e);
    }

    try {
        console.log("\n=== Test 3: searchLyrics with query = track_name ===");
        const res3 = await client.searchLyrics({ query: "Starboy" });
        console.log("Test 3 Success (count):", res3 ? res3.length : null);
        if (res3 && res3[0]) {
            console.log("First match:", res3[0].trackName, "by", res3[0].artistName);
        }
    } catch (e) {
        console.log("Test 3 Failed:", e.message || e);
    }
}

run();
