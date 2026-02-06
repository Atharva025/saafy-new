# 🎵 Database Population Scripts

Two approaches to populate your recommendation database with comprehensive song data:

## ⚡ Quick Start (Recommended Method)

### Using JioSaavn API ✅
```powershell
cd scripts
npm install

# Fetch + Import in one command
npm run populate
```

**Why this is better:**
- ✅ **Legal** - Uses official JioSaavn API
- ✅ **Fast** - No rate limiting issues
- ✅ **Reliable** - No website structure changes
- ✅ **Quality data** - Includes song IDs, metadata

---

## 📋 Available Scripts

| Command | Description | Duration |
|---------|-------------|----------|
| `npm run fetch-jiosaavn` | Fetch ~500-1000 songs from JioSaavn API | 2-5 min |
| `npm run import` | Upload CSV songs to HuggingFace backend | 5-10 min |
| `npm run populate` | Fetch + Import (complete workflow) | 7-15 min |
| `npm run test` | Test MySwar scraper (may fail with 403) | 10 sec |
| `npm run scrape` | Full MySwar scrape 2000-2026 (blocked) | N/A |

---

## 🚀 Method 1: JioSaavn API (Recommended)

### Step 1: Fetch Songs
```powershell
npm run fetch-jiosaavn
```

**What it does:**
- Searches JioSaavn for popular artists, movies, genres
- Extracts song metadata (name, artist, album, year, ID)
- Saves to `data/jiosaavn_songs.csv`
- **Expected output:** 500-1000 unique songs

**Search categories:**
- Top Bollywood artists (Arijit Singh, Shreya Ghoshal, etc.)
- Music composers (A.R. Rahman, Pritam, etc.)
- Popular movies (Aashiqui 2, Kabir Singh, etc.)
- Genres (Romantic, Party, Punjabi, Sufi, etc.)
- Years (2000-2024 Bollywood hits)

### Step 2: Import to Database
```powershell
npm run import
```

**What it does:**
- Reads `data/jiosaavn_songs.csv`
- Uploads each song to HuggingFace backend via POST API
- Processes in batches of 10 songs
- Handles duplicates (skips already added songs)
- Shows real-time progress

**Output CSV format:**
```csv
song_id,song_name,artist,album,year
"abc123","Tum Hi Ho","Arijit Singh","Aashiqui 2","2013"
```

### Step 3: One-Command Workflow
```powershell
npm run populate
```
Runs both fetch + import sequentially. Fully automated!

---

## 🌐 Method 2: MySwar Scraping (Currently Blocked)

### ⚠️ Status: 403 Forbidden Error

MySwar.co is blocking automated requests with anti-bot protection.

**If you want to try:**
```powershell
npm run test    # Test on year 2020 first
npm run scrape  # Full 2000-2026 (will likely fail)
```

**Why it fails:**
- 🚫 Cloudflare or similar protection
- 🚫 403 Forbidden on requests
- 🚫 May require browser cookies/sessions

**Solutions attempted:**
- ✅ Comprehensive browser headers
- ✅ Retry logic with exponential backoff
- ✅ Rate limiting (2s between requests)
- ⚠️ Still blocked

**See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for alternatives.**

---

## 📊 Expected Results

### JioSaavn Method:
```
📊 Statistics:
   Search queries: 50
   Unique songs: 847
   Output file: data/jiosaavn_songs.csv
   File size: 156.32 KB

📤 Import Results:
   Total songs processed: 847
   ✅ Successfully uploaded: 847
   ⏭️  Already existed: 0
   ❌ Failed: 0
   Success rate: 100.0%
```

### MySwar Method (if it worked):
```
📊 Statistics:
   Years processed: 27 (2000-2026)
   Albums scraped: ~2,500
   Songs extracted: ~40,000+
```

---

## 🗂️ Output Files

All generated CSV files are saved to `scripts/data/`:

| File | Source | Format |
|------|--------|--------|
| `jiosaavn_songs.csv` | JioSaavn API | song_id, song_name, artist, album, year |
| `songs_2000_2026.csv` | MySwar scrape | song_name, artist, album, year |

---

## 🔧 Configuration

### JioSaavn Fetcher
Edit [jiosaavn-fetcher.js](jiosaavn-fetcher.js):

```javascript
// Add more search queries
const SEARCH_QUERIES = [
    'Arijit Singh',
    'Your custom searches here'
];

// Adjust rate limiting
const DELAY_MS = 500; // milliseconds
```

### Import Script
Edit [import-jiosaavn.js](import-jiosaavn.js):

```javascript
// Batch size (concurrent uploads)
const BATCH_SIZE = 10;

// Delay between batches
const BATCH_DELAY = 2000; // ms

// Your backend URL
const RECOMMENDER_API = 'your-api-url';
```

---

## 🛠️ Troubleshooting

### Issue: "File not found: jiosaavn_songs.csv"
**Solution:** Run `npm run fetch-jiosaavn` first

### Issue: Import fails with 404/500 errors
**Solution:** 
1. Check if your HuggingFace backend is running
2. Verify the API URL in `import-jiosaavn.js`
3. Test manually: `https://atharva025-saafy-music-recommender.hf.space/docs`

### Issue: MySwar 403 errors
**Solution:** Use JioSaavn method instead (recommended)

### Issue: "Module not found"
**Solution:** Run `npm install` in scripts directory

---

## 📈 Scaling Strategy

### Phase 1: Initial Seed (500-1000 songs)
```powershell
npm run populate
```
Gets your database started with popular songs.

### Phase 2: Expand Coverage
Modify `SEARCH_QUERIES` in `jiosaavn-fetcher.js`:
- Add more artists
- Add regional languages (Tamil, Telugu, Punjabi)
- Add international artists
- Run again to add 500-1000 more

### Phase 3: Organic Growth
Your app **automatically** adds songs to the vector DB when users play them. The database grows naturally!

### Phase 4: Periodic Updates
Run monthly to add new releases:
```javascript
'bollywood 2026', 'latest hindi songs', 'new releases'
```

---

## 🎯 Recommendation

**START WITH:** JioSaavn method (`npm run populate`)

**WHY:**
1. **Immediate results** - Works right now
2. **Quality data** - Song IDs for your app integration
3. **Maintainable** - Won't break when websites change
4. **Legal** - Uses official APIs
5. **Grows organically** - Every user play adds to DB

**500-1000 songs is enough** to start getting good recommendations. The system improves as users interact with your app!

---

## 📞 Support

**Quick help:**
- 📖 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed solutions
- 🔍 Check console output for specific error messages
- 🧪 Always run `npm run test` before full scrapes

**Need more songs?**
- Modify search queries in `jiosaavn-fetcher.js`
- Run script multiple times with different queries
- Consider combining multiple music APIs

---

## 🎉 Success Checklist

- [ ] Installed dependencies (`npm install`)
- [ ] Ran JioSaavn fetcher (`npm run fetch-jiosaavn`)
- [ ] Verified CSV file exists (`data/jiosaavn_songs.csv`)
- [ ] Imported to backend (`npm run import`)
- [ ] Checked HuggingFace backend logs
- [ ] Tested recommendations in your app
- [ ] Database shows new songs in vector space

---

## 💡 Pro Tips

1. **Start small** - 500 songs is plenty to begin
2. **Test first** - Always check the CSV before importing
3. **Monitor imports** - Watch console for errors
4. **Verify backend** - Check HuggingFace Space logs
5. **User data is gold** - Songs users play = best training data

**Ready to populate your database? Run:** `npm run populate` 🚀
