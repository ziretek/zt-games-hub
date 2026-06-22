# PWA Installation Guide

## iOS Installation (Safari)

1. **Open in Safari**
   - Open the Game Hub URL in Safari browser on your iOS device

2. **Add to Home Screen**
   - Tap the Share button (box with arrow icon)
   - Scroll down and tap "Add to Home Screen"
   - Choose a name for the app
   - Tap "Add"

3. **Launch the App**
   - Game Hub will now appear as an app icon on your home screen
   - Tap to launch the PWA

## Android Installation

1. **Chrome Browser**
   - Open the Game Hub URL in Chrome
   - Tap the menu button (three dots)
   - Tap "Install app" or "Add to Home screen"
   - Confirm the installation

2. **App Drawer**
   - Game Hub will now appear in your app drawer
   - You can pin it to your home screen

## Deployment Options

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `echo "No build needed"`
3. Set publish directory: `./`
4. Deploy

### Vercel
1. Push code to GitHub
2. Connect to Vercel
3. Deploy (zero configuration needed)

### GitHub Pages
1. Enable GitHub Pages in repository settings
2. Select main branch as source
3. Access at `username.github.io/repo-name`

## Offline Support

Game Hub includes a service worker that caches all essential files. After first visit:
- Works completely offline
- Instant loading on subsequent visits
- All animations and features available without internet

## Troubleshooting

**App won't install:**
- Ensure HTTPS connection (required for PWA)
- Check manifest.json is valid
- Clear browser cache and try again

**App won't update:**
- Service worker caches aggressively
- Uninstall and reinstall for latest version
- Or manually clear app data

**Performance issues:**
- Check device storage space
- Disable other background apps
- Restart device if needed
