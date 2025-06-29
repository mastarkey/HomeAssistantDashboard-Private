# Iframe Integration Troubleshooting Guide

This guide helps troubleshoot issues when the React Dashboard doesn't show rooms or allow device additions when accessed through the Home Assistant navbar (iframe mode).

## Common Issues and Solutions

### 1. No Rooms or Devices Showing

**Symptoms:**
- Dashboard appears empty when accessed via HA navbar
- Works fine when accessed directly
- No rooms visible, can't add devices

**Solutions:**

1. **Check Browser Console** (F12)
   - Look for WebSocket connection errors
   - Check for CORS errors
   - Look for messages starting with `[Dashboard]`, `[useHomeAssistant]`, or `[IframeDebug]`

2. **Verify WebSocket Connection**
   - The dashboard should automatically detect the iframe and use the parent window's URL
   - Check console for: `[Iframe Mode] Using iframe origin URL: <url>`
   - If you see `[Iframe Mode] Waiting for HASS data from parent...`, the connection isn't establishing

3. **Check Home Assistant Configuration**
   ```yaml
   # In configuration.yaml
   panel_iframe:
     react_dashboard:
       title: "React Dashboard"
       icon: mdi:view-dashboard
       url: "http://your-dashboard-url:5173"
       require_admin: false
   ```

4. **Verify Long-Lived Access Token**
   - The dashboard needs a long-lived access token
   - Create one in HA: Profile → Security → Long-Lived Access Tokens
   - Set it in browser localStorage: `localStorage.setItem('ha_access_token', 'your-token-here')`

### 2. CORS Issues

**Symptoms:**
- Cross-origin errors in console
- Can't access parent window location

**Solutions:**

1. **Same Origin Hosting**
   - Host the dashboard on the same domain as Home Assistant
   - Use a reverse proxy (nginx, Traefik) to serve both from same domain

2. **Development Mode**
   - For development, the dashboard will fall back to using its own WebSocket connection
   - Make sure the HA URL is accessible from where the dashboard is hosted

### 3. Storage Issues

**Symptoms:**
- Settings not persisting
- Room assignments lost on refresh

**Solutions:**

1. **Check HA Storage Connection**
   - Look for console message: `[haStorage] Setting connection`
   - The dashboard uses HA's frontend storage API when available
   - Falls back to localStorage if HA storage unavailable

2. **Clear Browser Cache**
   - Sometimes old localStorage data can conflict
   - Clear site data and reload

### 4. Debug Information

The dashboard includes debug tools when running in iframe mode:

1. **IframeDebug Component** (bottom-right corner when in iframe)
   - Shows current URL, origin, and parent access
   - Displays received messages from parent window

2. **Console Logging**
   - Enable verbose logging by opening browser console
   - Key log prefixes to look for:
     - `[Dashboard]` - Main component state
     - `[useHomeAssistant]` - WebSocket connection status
     - `[haStorage]` - Storage operations
     - `[IframeDebug]` - Iframe-specific information

### 5. Testing Iframe Integration

Use the included test file to verify iframe functionality:

1. Open `test-iframe.html` in a browser
2. Click "Send Mock HASS Data" to simulate HA sending entity data
3. Check if rooms appear in the dashboard

### 6. Common Configuration Mistakes

1. **Wrong URL in panel_iframe**
   - Make sure the URL matches where your dashboard is hosted
   - Include the port number if not using standard ports

2. **Missing WebSocket Access**
   - The dashboard needs WebSocket access to HA
   - Check firewall rules and reverse proxy WebSocket configuration

3. **Authentication Issues**
   - The long-lived token must be valid and have proper permissions
   - Try regenerating the token if it's not working

## Architecture Notes

The dashboard uses multiple strategies to connect to Home Assistant:

1. **Native Panel Mode**: When HA provides data via `window.__REACT_DASHBOARD_PROPS__`
2. **Iframe with PostMessage**: When parent window sends data via postMessage
3. **Direct WebSocket**: Falls back to creating its own WebSocket connection

The recent updates ensure that even in iframe mode without parent data, the dashboard will attempt to establish its own connection using the iframe's origin URL.