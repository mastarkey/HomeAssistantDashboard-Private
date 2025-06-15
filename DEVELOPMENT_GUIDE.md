# Development and Production Setup Guide

This guide explains how to work with the React Dashboard in both development and production environments.

## Overview

The React Dashboard supports two distinct modes:

1. **Development Mode** - Fast development with hot reload, runs on port 5173
2. **Production Mode** - Native Home Assistant integration, no external servers

## Development Setup

### 1. Starting Development Server

```bash
cd /homeassistant/react-dashboard
npm run dev
```

This starts Vite dev server on `http://192.168.1.7:5173` with:
- Hot Module Replacement (HMR) for instant updates
- Source maps for debugging
- No build step required
- Direct WebSocket connection to Home Assistant

### 2. How Development Mode Works

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│   Browser       │ ←────────────────→ │  Home Assistant  │
│  Port 5173      │                    │   Port 8123      │
└─────────────────┘                    └──────────────────┘
        ↑
        │ Hot Reload
        │
┌─────────────────┐
│  Vite Dev Server│
│   Port 5173     │
└─────────────────┘
```

- Vite serves the React app directly
- App connects to HA via WebSocket using long-lived token
- Changes to code are instantly reflected (no build needed)
- Access via iframe panel in HA or directly at port 5173

### 3. Making Changes

1. Edit any file in `src/`
2. Save the file
3. Browser automatically reloads with changes
4. No build process needed!

## Production Setup

### 1. Building for Production

```bash
cd /homeassistant/react-dashboard
npm run build:ha
```

This creates optimized files in `dist-ha/`:
- `ha-panel-wrapper.js` - The main application bundle
- `react-dashboard-panel.css` - Compiled styles

### 2. Deploying to Home Assistant

```bash
# Create directory if it doesn't exist
mkdir -p /config/www/react-dashboard

# Copy built files
cp dist-ha/ha-panel-wrapper.js /config/www/react-dashboard/react-dashboard-panel.js
cp dist-ha/react-dashboard-panel.css /config/www/react-dashboard/

# Ensure supporting files exist
# - /config/www/react-dashboard-working.js (panel wrapper)
# - /config/www/react-dashboard-iframe.html (iframe loader)
```

### 3. How Production Mode Works

```
┌─────────────────┐
│ Home Assistant  │
│   Web Interface │
└────────┬────────┘
         │
┌────────▼────────┐     postMessage    ┌──────────────────┐
│  Custom Panel   │ ←────────────────→ │   React App      │
│  (wrapper.js)   │                    │   (in iframe)    │
└─────────────────┘                    └──────────────────┘
```

- No external server needed
- React app runs inside HA's web interface
- Data passed via postMessage (no WebSocket needed)
- Updates require rebuild and redeploy

### 4. Update Process

When you make changes in production:

1. Make your code changes
2. Build: `npm run build:ha`
3. Deploy: Copy files to `/config/www/react-dashboard/`
4. Clear browser cache (important!)
5. Refresh Home Assistant page

## Key Differences

| Feature | Development | Production |
|---------|-------------|------------|
| Server | Vite dev server (5173) | Home Assistant only |
| Hot Reload | ✅ Yes | ❌ No |
| Build Required | ❌ No | ✅ Yes |
| Performance | Good | Better (no webhooks) |
| Connection | WebSocket | postMessage |
| URL | http://192.168.1.7:5173 | Via HA sidebar |
| Debugging | Full source maps | Minified code |

## File Structure

### Development Files
- `vite.config.ts` - Standard Vite config for development
- `src/` - All source code
- `index.html` - Entry point for dev server

### Production Files
- `vite.config.ha.ts` - Special config for HA build
- `src/ha-panel-wrapper.ts` - Web Component wrapper
- `dist-ha/` - Production build output

### Supporting Files (in /config/www/)
- `react-dashboard-working.js` - Panel definition
- `react-dashboard-iframe.html` - Iframe container
- `react-dashboard/` - Built app files

## Configuration

### Development (configuration.yaml)
```yaml
# Optional - for iframe access in HA
lovelace:
  dashboards:
    react-dashboard:
      mode: yaml
      filename: dashboards/react-dashboard.yaml
      title: React Dashboard
      icon: mdi:react
      show_in_sidebar: true
```

### Production (configuration.yaml)
```yaml
# Required - defines the custom panel
panel_custom:
  - name: react-dashboard-working
    sidebar_title: React Dashboard
    sidebar_icon: mdi:react
    module_url: /local/react-dashboard-working.js
```

## Build Commands Explained

### `npm run dev`
- Starts Vite development server
- Uses `vite.config.ts`
- No optimization, fast refresh
- Source maps enabled

### `npm run build`
- Standard production build
- Uses `vite.config.ts`
- Outputs to `dist/`
- For standalone deployment

### `npm run build:ha`
- Home Assistant native build
- Uses `vite.config.ha.ts`
- Outputs to `dist-ha/`
- Wraps app as Web Component
- Optimized for iframe usage

## Connection Detection

The app automatically detects its environment:

```typescript
// In useHomeAssistant.ts
const isInIframe = window.parent !== window;
const panelProps = window.__REACT_DASHBOARD_PROPS__;

if (panelProps?.hass || isInIframe) {
  // Production mode - use provided HASS data
} else {
  // Development mode - create WebSocket connection
}
```

## Troubleshooting

### Development Issues

1. **Port already in use**
   ```bash
   # Kill existing process
   lsof -ti:5173 | xargs kill -9
   ```

2. **Can't connect to HA**
   - Check token in `useHomeAssistant.ts`
   - Verify HA is accessible at port 8123
   - Check CORS settings in configuration.yaml

### Production Issues

1. **Changes not showing**
   - Clear browser cache (Ctrl+Shift+R)
   - Verify files copied correctly
   - Check browser console for errors

2. **"conn is undefined" error**
   - Rebuild with `npm run build:ha`
   - Ensure all supporting files are in place
   - Check iframe HTML is updated

3. **Blank screen**
   - Check Network tab for 404 errors
   - Verify file paths in panel wrapper
   - Look for JavaScript errors in console

## Quick Deployment Script

Create `/homeassistant/react-dashboard/deploy.sh`:

```bash
#!/bin/bash
echo "Building for Home Assistant..."
npm run build:ha

echo "Deploying to Home Assistant..."
mkdir -p /config/www/react-dashboard
cp dist-ha/ha-panel-wrapper.js /config/www/react-dashboard/react-dashboard-panel.js
cp dist-ha/react-dashboard-panel.css /config/www/react-dashboard/

echo "Deployment complete! Clear browser cache and refresh."
```

Make it executable:
```bash
chmod +x deploy.sh
```

Then deploy with:
```bash
./deploy.sh
```

## Best Practices

1. **Development**
   - Use dev mode for all feature development
   - Test thoroughly before building for production
   - Keep console clean (no errors/warnings)

2. **Production**
   - Always clear cache after deployment
   - Test in multiple browsers
   - Monitor browser console for errors
   - Keep backups of working builds

3. **Version Control**
   - Commit source files only
   - Don't commit `dist/` or `dist-ha/`
   - Tag releases for easy rollback

## Summary

- **Development**: Fast iteration with `npm run dev`, no builds needed
- **Production**: Optimized native integration with `npm run build:ha`
- **Key Benefit**: Production mode eliminates webhook lag by running natively in HA
- **Trade-off**: Production requires rebuild for changes, but provides better performance