# Native Home Assistant Integration Guide

This guide explains how to run your React Dashboard as a native Home Assistant panel for better performance.

## What's Changed

1. **Modified `useHomeAssistant.ts`** - Now detects if running natively and uses HA's connection
2. **Added `ha-panel-wrapper.ts`** - Wraps your React app for HA integration
3. **Added `vite.config.ha.ts`** - Special build config for HA
4. **Added build scripts** - `npm run build:ha` and deployment helpers

## Benefits of Native Integration

- ✅ No iframe overhead
- ✅ Direct access to HA's WebSocket connection
- ✅ No authentication tokens needed
- ✅ Better performance
- ✅ Feels like a built-in HA panel

## How to Deploy

### Option 1: Manual Deployment

1. Build for Home Assistant:
   ```bash
   npm run build:ha
   ```

2. Copy the `dist-ha` folder contents to your HA's `www` folder:
   ```bash
   cp -r dist-ha/* /config/www/react-dashboard/
   ```

3. Update your `configuration.yaml`:
   ```yaml
   # Remove the old iframe config and add:
   panel_custom:
     - name: react-dashboard
       sidebar_title: React Dashboard
       sidebar_icon: mdi:react
       module_url: /local/react-dashboard/react-dashboard-panel.js
   ```

4. Restart Home Assistant

### Option 2: Using Deploy Script

```bash
# If your HA config is at /config (default for HA OS)
./deploy-to-ha.sh /config

# Or specify your config path
./deploy-to-ha.sh /path/to/your/ha/config
```

## Development Mode

You can still develop locally with hot reload:
```bash
npm run dev
```

The app automatically detects standalone mode and creates its own WebSocket connection.

## How It Works

1. **Native Mode**: When loaded by HA, the app receives the `hass` object directly
2. **Standalone Mode**: When running `npm run dev`, it creates its own connection
3. **Same React Code**: All your components work exactly the same in both modes

## Troubleshooting

- **Panel not showing**: Check browser console for errors
- **Styles missing**: Ensure the CSS is being bundled correctly
- **Connection issues**: The app will show connection state in console logs

## Rolling Back

To go back to iframe mode:
1. Remove the `panel_custom` config
2. Add back the `panel_iframe` config
3. Restart HA