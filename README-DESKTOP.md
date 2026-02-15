# Saafy Desktop - Windows Music Player

A premium desktop music player for Windows with local file support, offline playback, and native Windows integration.

## 🚀 Features

### Desktop-Specific Features
- **System Tray Integration** - Minimize to tray, quick controls
- **Global Media Keys** - Play/pause/skip using hardware media keys
- **Mini Player Mode** - Compact always-on-top player (Ctrl+Shift+M)
- **Local Music Support** - Play MP3, FLAC, WAV, M4A, AAC, OGG files
- **Offline Caching** - Download songs for offline playback
- **Windows Notifications** - Now playing notifications
- **Taskbar Controls** - Play/pause from taskbar
- **Folder Watching** - Automatically scan music folders
- **Encrypted Storage** - Secure data storage with electron-store

### Core Features
- Stream music from JioSaavn API
- Mix local and streaming songs in one queue
- Premium dark theme
- Keyboard shortcuts
- Queue management
- Shuffle & repeat modes
- Audio visualizer
- Listening history

## 📦 Installation

### For Development

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run electron:dev
```

### Building for Production

```bash
# Build for Windows (creates installer + portable)
npm run electron:build-win

# The built files will be in the `release` folder:
# - Saafy Setup X.X.X.exe (Installer)
# - Saafy-Portable.exe (Portable version)
```

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause |
| `→` | Next track |
| `←` | Previous track |
| `K` | Play / Pause (alternative) |
| `?` | Show keyboard shortcuts |
| `Ctrl+Shift+M` | Toggle mini player |
| `Ctrl+Shift+S` | Show/hide main window |

**Global shortcuts (work even when app is not focused):**
- Media keys (Play/Pause, Next, Previous)

## 📁 Local Music

1. Click "Local Music" in navigation
2. Click "+ Add Folder" to add a music directory
3. Or "+ Add Files" to add individual files
4. The app will scan and extract metadata (ID3 tags)
5. Local songs appear alongside streaming music in your library

**Supported Formats:**
- MP3
- FLAC (lossless)
- WAV
- M4A / AAC
- OGG Vorbis

## ⚙️ Settings

Access settings from the system tray menu or by navigating to `/settings` in the app.

**Available Settings:**
- Audio quality (Low/Medium/High)
- Download location for cached songs
- Start minimized
- Minimize to tray
- Show notifications
- Auto-update preferences
- Theme selection

## 🔒 Security Features

- **Input sanitization** - All user inputs are sanitized
- **XSS protection** - HTML escaping on all rendered content
- **Encrypted storage** - Sensitive data encrypted at rest
- **Rate limiting** - API request throttling
- **Request validation** - All API responses validated
- **Secure IPC** - Controlled communication between processes
- **Content Security Policy** - Strict CSP headers
- **No remote code execution** - Sandboxed renderer process

## 🏗️ Project Structure

```
saafy-new/
├── electron-main.js          # Main Electron process
├── preload.js                # Secure IPC bridge
├── src/
│   ├── components/
│   │   ├── Settings.jsx      # Settings page
│   │   ├── LocalMusicPlayer.jsx  # Local music library
│   │   ├── MiniPlayer.jsx    # Compact player
│   │   └── ...
│   ├── context/
│   │   ├── PlayerContext.jsx # Music player state + Electron integration
│   │   ├── ThemeContext.jsx  # Theme management
│   │   └── ToastContext.jsx  # Notifications
│   ├── lib/
│   │   ├── electron.js       # Electron utilities
│   │   ├── encryption.js     # Data encryption
│   │   ├── security.js       # Security utilities
│   │   ├── offlineCache.js   # Offline caching system
│   │   ├── api.js            # API client
│   │   └── ...
│   └── App.jsx               # Main app with routing
├── public/
│   └── icon.png              # App icon
└── package.json
```

## 🔧 Troubleshooting

### App won't start
- Make sure you ran `npm install`
- Check that Node.js 18+ is installed
- Try deleting `node_modules` and reinstalling

### Media keys not working
- Check Windows Sound settings
- Ensure no other music app is hijacking media keys
- Restart the app

### Local files not playing
- Ensure files are not corrupted
- Check that format is supported (MP3, FLAC, etc.)
- Try re-scanning the folder

### Tray icon missing
- Ensure `public/icon.png` exists
- Check Windows notification area settings
- Restart the app

## 🛠️ Development

### Tech Stack
- **Electron 40** - Desktop framework
- **React 19** - UI framework
- **Vite 7** - Build tool
- **electron-store** - Persistent storage
- **music-metadata** - MP3/FLAC tag parser
- **Tailwind CSS 4** - Styling

### Development Commands

```bash
# Development mode with hot reload
npm run electron:dev

# Build production app
npm run electron:build

# Lint code
npm run lint

# Build web version (for testing)
npm run build
npm run preview
```

### Adding Features

1. **New Component**: Add to `src/components/`
2. **New Route**: Update `src/App.jsx`
3. **Electron API**: Update `electron-main.js` and `preload.js`
4. **Storage**: Use `electronStore` from `src/lib/electron.js`

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues

- First launch may be slow while building cache
- Some streaming songs may not be available offline
- Windows SmartScreen may warn on first run (requires code signing)

## 📖 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [JioSaavn API Documentation](https://github.com/sumitkolhe/jiosaavn-api)

---

**Made with ❤️ for music lovers**
