# Timer App - PWA

A simple, elegant Progressive Web App for managing multiple timers on your iPhone or any device. Perfect for cooking, workouts, meditation, and more.

## Features

✨ **Multiple Timers** - Create and manage unlimited concurrent timers
⏱ **HH:MM:SS Format** - Support for hours, minutes, and seconds
📝 **Named Timers** - Give each timer a meaningful name, pick a color
🔊 **Sound Style Picker** - Cycle between Beep, Chime, Bell, and Blip alerts
👁️ **Visual Feedback** - Color-coded timer status; timers continue into overtime
💾 **Persistent Storage** - Timers and settings saved locally, survive page reload
📱 **Offline Support** - Works completely offline with service worker caching
🍎 **iPhone Optimized** - Install as standalone app on your home screen
🌙 **Dark / Light Theme** - Toggle with the sun/moon button, persisted across sessions

## Installation

### On iPhone:
1. Open this app in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Name it "Timer" and tap **Add**
5. The app now appears on your home screen as a standalone app

### On Android:
1. Open the app in Chrome
2. Tap the three dots (menu) button
3. Tap **Install app** or **Add to Home screen**
4. The app now appears on your home screen

### On Desktop:
1. Open the app in Chrome or Edge
2. An install icon should appear in the address bar (or use the menu)
3. Click **Install**

## Usage

### Creating a Timer
1. Tap the **+** button in the top-left corner
2. Enter a name for your timer (optional, defaults to "Unnamed")
3. Set hours, minutes, and seconds
4. Tap **Add Timer**
5. The panel automatically closes

### Managing Timers
- **Start/Pause** - Toggle timer playback with the Start/Pause button
- **Reset** - Return timer to its original duration
- **Delete** - Remove a timer permanently
- A timer turns amber at zero and continues into **negative overtime** — tap Reset to stop it

### Multiple Timers
- Multiple timers can run concurrently
- All timers are saved automatically to your device

## Technical Details

- **Pure JavaScript** - No framework, no build step, lightweight
- **Service Worker** - Enables offline functionality and PWA install
- **localStorage** - Persists timers and settings locally
- **Web Audio API** - Procedurally generated alerts (no audio files)
- **Responsive Design** - Two-column grid in landscape, single-column in portrait
- **Mobile Optimized** - Supports safe area insets for notched devices

## Tips

💡 **Keyboard Support** - Press Enter to quickly add a timer after filling in the fields
💡 **iOS Audio** - If sound stops after switching apps, tap the "Restore sound" prompt that appears
💡 **Data Privacy** - All data stays on your device; nothing is sent to servers

## Browser Support

- ✅ iOS Safari 11.3+
- ✅ Chrome (mobile & desktop)
- ✅ Edge (mobile & desktop)
- ✅ Firefox (mobile & desktop)
- ✅ Samsung Internet

## Development

This is a vanilla JavaScript PWA with no build process required. Just serve the files over HTTPS (required for service workers).

### File Structure
```
├── index.html          # Main HTML
├── index.css           # Styling
├── index.js            # App logic
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline support / notifications
└── CLAUDE.md           # AI assistant context
```

### To Run Locally
```bash
cd /Users/alex/dev/timer_app
python3 -m http.server 8000
# Visit https://localhost:8000 (note: HTTPS required for service workers in production)
```

### To Deploy
Deploy all files to any web server with HTTPS enabled. The manifest.json and service-worker.js are required for PWA functionality.

## License

Open source, feel free to use and modify.
