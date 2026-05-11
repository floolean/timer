# Timer App - PWA

A simple, elegant Progressive Web App for managing multiple timers on your iPhone or any device. Perfect for cooking, workouts, meditation, and more.

## Features

✨ **Multiple Timers** - Create and manage unlimited timers simultaneously
⏱ **HH:MM:SS Format** - Support for hours, minutes, and seconds
📝 **Named Timers** - Give each timer a meaningful name
🔊 **Audio Alerts** - Three beeps when timer reaches zero
👁️ **Visual Feedback** - Color-coded timer status (active, completed, overtime)
💾 **Persistent Storage** - Timers are saved locally and persist between sessions
📱 **Offline Support** - Works completely offline with service worker caching
🍎 **iPhone Optimized** - Install as standalone app on your home screen
🎯 **One Timer at a Time** - Only one timer runs at a time for simplicity

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
- A timer will display in **orange** at zero and continue into negative time (overtime)

### Multiple Timers
- Only one timer can run at a time
- Starting a new timer automatically pauses any running timer
- All timers are saved automatically to your device

## Technical Details

- **Pure JavaScript** - No dependencies, lightweight (~30KB)
- **Service Worker** - Enables offline functionality
- **localStorage** - Persists timer data locally
- **Web Audio API** - Generates audio alerts
- **Responsive Design** - Works on any screen size
- **Mobile Optimized** - Supports safe area insets for notched devices

## Tips

💡 **Keyboard Support** - Press Enter to quickly add a timer after filling in the fields
💡 **Running Timers** - Keep the app running in the background for audio alerts
💡 **Data Privacy** - All data stays on your device; nothing is sent to servers
💡 **Multiple Instances** - You can have multiple timers running by opening the app in multiple browser tabs/windows

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
/Users/alex/dev/timer_app/
├── index.html          # Main HTML file
├── index.css           # Styling
├── index.js            # App logic
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline support
└── README.md          # This file
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
