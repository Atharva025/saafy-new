const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in env variables');
  process.exit(1);
}

const playlistSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  image: String,
  songs: Array,
  createdAt: Date
});

const Playlist = mongoose.model('Playlist', playlistSchema, 'playlists');

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    const pl = await Playlist.findOne({ songs: { $exists: true, $not: { $size: 0 } } });
    if (!pl) {
      console.log('No playlists with songs found');
    } else {
      console.log('Playlist details:', { name: pl.name, imageLength: pl.image?.length });
      console.log('First Song Object:', pl.songs[0]);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
