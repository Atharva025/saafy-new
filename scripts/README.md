# Song Scraper Scripts

Scripts to populate the recommendation database with comprehensive song catalog from 2000-2026.

## 📋 Overview

These scripts scrape MySwar.co to extract:
- **Song names** from albums
- **Artist/Music Director** information
- **Album names** and **release years**
- Output as **CSV** for database import

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd scripts
npm install
```

### 2. Test First (Recommended)
Test the scraper on a single year to verify everything works:
```bash
npm run test
```

This will:
- Fetch data for year 2020
- Parse album and song information
- Display sample results
- Validate CSV format
- Report any issues

### 3. Run Full Scraper
Once testing passes, run the full scrape (2000-2026):
```bash
npm run scrape
```

**Expected duration:** 30-60 minutes depending on:
- Number of albums per year
- Network speed
- Server response times

## 📂 Output

The scraper generates a CSV file:
```
data/songs_2000_2026.csv
```

**Format:**
```csv
song_name,artist,album,year
"Tum Hi Ho","Arijit Singh","Aashiqui 2","2013"
"Channa Mereya","Arijit Singh","Ae Dil Hai Mushkil","2016"
...
```

## 🔍 Understanding the Process

### Step 1: Year Pages
- Visits: `https://myswar.co/album/year/{YEAR}`
- Extracts all album URLs for that year
- Handles pagination if present

### Step 2: Album Pages
- Visits each album page
- Extracts:
  - Album name from `<h1>` tag
  - Artist/Music Director from metadata
  - All song links from page

### Step 3: CSV Generation
- Writes incrementally (memory efficient)
- Cleans data (removes commas, quotes properly)
- Tracks progress with statistics

## ⚙️ Configuration

Edit `scrape-songs.js` to customize:

```javascript
// Change year range
const START_YEAR = 2000;
const END_YEAR = 2026;

// Adjust rate limiting (milliseconds)
const RATE_LIMIT_DELAY = 1000; // Wait 1s between requests

// Modify retry settings
const MAX_RETRIES = 3;
```

## 🛠️ Troubleshooting

### Issue: No albums found
**Solution:** The website structure may have changed. Run `test-scraper.js` to debug and check HTML structure.

### Issue: Rate limit errors (429)
**Solution:** Increase `RATE_LIMIT_DELAY` to 2000-3000ms.

### Issue: Connection timeouts
**Solution:** Script includes automatic retry with exponential backoff (3 attempts).

### Issue: Empty CSV file
**Solution:**
1. Check internet connection
2. Verify MySwar.co is accessible
3. Run test script to diagnose issue

## 📊 Statistics

The scraper tracks and displays:
- **Total years** processed
- **Total albums** scraped
- **Total songs** extracted
- **Failed requests** count
- **Average songs per album**

Example output:
```
📊 Scraping Statistics
═══════════════════════════════════════════════════════════
✅ Years processed: 27
✅ Albums scraped: 2,847
✅ Songs extracted: 45,152
❌ Failed requests: 12
📈 Average songs per album: 15.86
═══════════════════════════════════════════════════════════
```

## 🔄 Importing to Database

After scraping completes:

1. **CSV is ready** at `data/songs_2000_2026.csv`
2. **Use your backend API** to bulk import songs
3. **Python script example**:
```python
import pandas as pd
import requests

df = pd.read_csv('data/songs_2000_2026.csv')

for _, row in df.iterrows():
    requests.post('YOUR_BACKEND_URL/api/add-song', json={
        'song_name': row['song_name'],
        'artist': row['artist'],
        'album': row['album'],
        'year': row['year']
    })
```

4. **Batch import** (recommended):
   - Process in chunks of 100-500 songs
   - Add rate limiting between batches
   - Log progress and errors

## 📝 Files Description

| File | Purpose |
|------|---------|
| `scrape-songs.js` | Main scraper - extracts all songs from 2000-2026 |
| `test-scraper.js` | Test script - validates scraping logic on single year |
| `package.json` | Dependencies: axios (HTTP) + cheerio (HTML parsing) |
| `data/songs_2000_2026.csv` | Output file (generated after scraping) |

## ⚠️ Important Notes

1. **Rate Limiting**: Built-in 1-second delay between requests to be respectful to the server
2. **Retry Logic**: Automatically retries failed requests (3 attempts with exponential backoff)
3. **Memory Efficient**: Streams CSV output instead of loading all data in memory
4. **Error Handling**: Continues scraping even if individual albums fail
5. **Progress Tracking**: Real-time console updates with emoji indicators

## 🎯 Best Practices

- ✅ **Always run test script first** before full scrape
- ✅ **Verify CSV output** after scraping completes
- ✅ **Check for duplicates** before importing to database
- ✅ **Keep scraper code** for future updates
- ✅ **Monitor console output** during execution

## 🤝 Support

If you encounter issues:
1. Run `npm run test` to diagnose
2. Check console output for error messages
3. Verify MySwar.co is accessible in browser
4. Review HTML structure if parsing fails

## 📄 License

Part of the Saafy music app project.
