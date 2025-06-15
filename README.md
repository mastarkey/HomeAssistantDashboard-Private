# Home Assistant React Dashboard

A modern, feature-rich React dashboard with TypeScript and Tailwind CSS for Home Assistant.

## 📍 Project Location

This project is located at: `/homeassistant/react-dashboard`

This is within the Home Assistant config directory, which maps to `/config` in the Home Assistant container.

## 🚀 Key Features

### Core Features
- ✅ **React 19** with TypeScript for type-safe development
- ✅ **Tailwind CSS** for modern, responsive styling
- ✅ **Real-time WebSocket** connection to Home Assistant
- ✅ **Auto-discovery** of all Home Assistant entities
- ✅ **Live updates** when entity states change
- ✅ **Dark mode** interface optimized for home automation
- ✅ **Drag-and-drop** reordering for rooms, categories, and devices

### Smart Entity Management
- ✅ **Intelligent Filtering**: Only shows primary hardware devices, hiding sub-entities and sensors
- ✅ **Room-based Organization**: Automatically groups devices by room
- ✅ **Category Views**: Browse devices by type (Lights, Climate, Security, etc.)
- ✅ **Entity Deduplication**: Prevents duplicate devices from appearing
- ✅ **Device Registry Integration**: Uses Home Assistant's device registry for accurate device identification

### Device-Specific Cards
- 💡 **Lights**
  - Brightness slider directly on card
  - Color temperature control (if supported)
  - Power button for quick on/off
  - Shows current brightness percentage
  
- 📹 **Cameras**
  - Live camera feed preview
  - Recording status indicator
  - Full-screen modal with larger feed
  - Shows all detection sensors (motion, person, vehicle, etc.)
  - Manual refresh button for instant updates
  - Auto-refresh mode (updates every 10 seconds)
  - Visual indicators for refresh status
  
- 🔌 **Switches**
  - Clean toggle interface
  - Visual state indication
  - Power consumption info (if available)
  
- 🌡️ **Sensors**
  - Temperature, humidity, power sensors
  - Smart icons based on sensor type
  - Color coding for values
  - Unit display and formatting
  
- 🔒 **Locks**
  - Lock/unlock controls
  - Visual security status
  - Jam detection
  - Status indicators
  
- 🌬️ **Fans**
  - Speed control slider
  - Oscillation toggle
  - Animated fan icon
  - Multiple speed modes
  
- 🪟 **Covers** (Blinds/Curtains)
  - Open/close/stop controls
  - Position slider
  - Visual position indicator
  - Support for tilt (if available)
  
- 🌡️ **Climate**
  - Current temperature display
  - Target temperature control
  - HVAC mode selection
  - Preset modes support
  
- 🎵 **Media Players**
  - Smart device type detection using device registry (TV, Speaker, Receiver, Phone, Streaming)
  - Play/pause/skip controls (when supported)
  - Volume slider with mute toggle
  - Source selection dropdown
  - Album art and media information display
  - Shuffle and repeat controls
  - Progress bar for current media
  - Device-specific icons and controls
  - Filters out camera and group media players
  - Enhanced UniFi device filtering using manufacturer info
  
- 🌤️ **Weather**
  - Current conditions
  - Temperature and forecast
  - Beautiful weather icons

- 🌡️ **Climate**
  - Current temperature display
  - Target temperature control with +/- buttons
  - Quick HVAC mode controls (heat/cool/fan/off)
  - Visual mode indicators with colored backgrounds
  - Humidity display (if available)
  - Fan mode settings
  - Full modal with:
    - 24-hour temperature history chart
    - Recent state changes logbook
    - Advanced HVAC and fan controls

### Advanced Modal System
- ✅ **Device Details Modal**: Click any device for comprehensive control
- ✅ **Related Entities**: Shows all sensors and sub-entities in modal
- ✅ **Device Information**: Model, firmware, MAC address (where available)
- ✅ **Scene Integration**: Related scenes appear in device modals
- ✅ **Activity Log**: Recent device events and state changes
- ✅ **Climate History**: Temperature charts and state change logs

### Specialized Device Support
- ⚡ **EV Chargers**
  - Real-time charging status with animated indicators
  - Power consumption display (kW/W)
  - Energy delivered tracking
  - Charging session information
  - Vehicle connection status
  - Smart power management controls
  
- 💾 **NAS Devices** (Synology, QNAP, etc.)
  - Storage usage visualization
  - CPU and memory monitoring
  - Temperature display
  - Disk health status
  - Network activity indicators
  - System uptime tracking
  
- 🔌 **Energy Monitors** (Sense, etc.)
  - Real-time power consumption
  - Historical usage graphs
  - Device-level monitoring
  - Cost calculations
  - Peak usage alerts

### Organization & Customization
- ✅ **Drag-and-Drop Reordering**: Reorganize rooms, categories, and devices
- ✅ **Persistent Layout**: Card order saved using Home Assistant's frontend storage API
- ✅ **Visual Feedback**: Drag handles appear on hover
- ✅ **Room Management**: 
  - Add custom rooms with icon selection
  - Delete empty rooms (custom or detected)
  - Automatic room detection from device names
  - Hidden rooms for decluttering
- ✅ **Category Management**:
  - Add custom device categories
  - Define domains for categories
  - Delete unused categories
- ✅ **Device Management**:
  - Add devices from Home Assistant to rooms
  - Edit device room assignments
  - Move devices between rooms
  - Search and filter unassigned devices
  - Dynamic device discovery with pattern-based detection

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS v4 with PostCSS
- **Icons**: Lucide React
- **Home Assistant Integration**: home-assistant-js-websocket
- **Package Manager**: npm

## 📁 Project Structure

```
/homeassistant/react-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx         # Main dashboard layout with room/category views
│   │   ├── EntityCard.tsx        # Smart card router for different entity types
│   │   ├── DeviceModal.tsx       # General device detail modal
│   │   ├── CameraModal.tsx       # Specialized camera modal with feeds
│   │   ├── CameraImage.tsx       # Smart camera image component
│   │   ├── ClimateModal.tsx      # Climate modal with history and controls
│   │   ├── DraggableCard.tsx     # Wrapper for drag-and-drop functionality
│   │   ├── EditDeviceModal.tsx   # Modal for editing device properties
│   │   ├── AddDeviceModal.tsx    # Modal for adding HA devices to rooms
│   │   ├── AddCustomDeviceModal.tsx # Modal for creating custom devices
│   │   ├── AddRoomModal.tsx      # Modal for adding custom rooms
│   │   ├── AddCategoryModal.tsx  # Modal for adding custom categories
│   │   └── cards/
│   │       ├── LightCard.tsx     # Light control with brightness slider
│   │       ├── CameraCard.tsx    # Camera preview card
│   │       ├── SwitchCard.tsx    # Switch toggle card
│   │       ├── ClimateCard.tsx   # Climate control card with quick modes
│   │       ├── MediaPlayerCard.tsx # Media player controls
│   │       ├── WeatherCard.tsx   # Weather display card
│   │       ├── SensorCard.tsx    # Sensor value display
│   │       ├── CoverCard.tsx     # Blinds/curtains control
│   │       ├── LockCard.tsx      # Lock/unlock controls
│   │       ├── FanCard.tsx       # Fan speed and oscillation
│   │       ├── EVChargerCard.tsx # EV charger status and controls
│   │       └── NASCard.tsx       # NAS monitoring and stats
│   ├── hooks/
│   │   ├── useHomeAssistant.ts   # WebSocket connection and device registry
│   │   ├── useOrderStorage.ts    # Persist drag-and-drop order in localStorage
│   │   ├── useCustomEntities.ts  # Manage custom (non-HA) devices
│   │   ├── useEntityOverrides.ts # Override room assignments for HA devices
│   │   ├── useCustomRooms.ts     # Manage custom rooms
│   │   ├── useCustomCategories.ts # Manage custom categories
│   │   └── useHiddenRooms.ts     # Hide empty rooms from view
│   ├── utils/
│   │   ├── entityHelpers.ts      # Room detection and categorization
│   │   ├── entityHelpersWithOverrides.ts # Room helpers with override support
│   │   ├── deviceFiltering.ts    # Smart filtering for primary devices
│   │   ├── deduplicateEntities.ts # Remove duplicate entities
│   │   ├── deviceRegistry.ts     # Device registry integration
│   │   ├── cameraDetectionHelpers.ts # Camera entity detection logic
│   │   └── unassignedDevices.ts  # Find devices not assigned to rooms
│   ├── services/
│   │   └── haStorage.ts          # Home Assistant frontend storage API
│   ├── config/
│   │   └── deviceTypes.ts        # Device type configurations
│   ├── types/                    # TypeScript type definitions
│   ├── App.tsx                   # Root application component
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Tailwind CSS imports
├── public/                       # Static assets
├── dist/                         # Production build output
├── package.json                  # Dependencies and scripts
├── tailwind.config.js           # Tailwind configuration
├── vite.config.ts               # Vite configuration
├── vite.config.ha.ts            # Vite configuration for HA native build
├── NATIVE_INTEGRATION.md        # Native integration documentation
├── DEVELOPMENT_GUIDE.md         # Development and production guide
├── dev.sh                       # Development startup script
├── deploy.sh                    # Production deployment script
├── rollback.sh                  # Deployment rollback script
└── README.md                    # This file
```

## 🔧 Configuration

### Access Token

The dashboard uses a long-lived access token for authentication. Your token is already configured in the code:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzMzMzYjM3ZWUyYjk0ODRmOWQ3ODk5ZGVhYzY4MTM4MCIsImlhdCI6MTc0OTg2MTU0MSwiZXhwIjoyMDY1MjIxNTQxfQ.juV15QOsu_jgW87tABrc7doVr97teA8jfihFDCWPDsw
```

### Home Assistant Configuration

The dashboard can be configured in two ways:

#### 1. Native Integration (Recommended - No Lag)

Add to your `configuration.yaml`:
```yaml
panel_custom:
  - name: react-dashboard-working
    sidebar_title: React Dashboard
    sidebar_icon: mdi:react
    module_url: /local/react-dashboard-working.js
```

This runs the dashboard natively within Home Assistant, eliminating webhook overhead and improving performance.

#### 2. Development Mode (With Hot Reload)

For development with hot reload:
```yaml
lovelace:
  dashboards:
    react-dashboard:
      mode: yaml
      filename: dashboards/react-dashboard.yaml
      title: React Dashboard
      icon: mdi:react
      show_in_sidebar: true
      require_admin: false
```

## 🚀 Quick Start

### Using Convenience Scripts

#### Development Mode
```bash
cd /homeassistant/react-dashboard
./dev.sh
```
This script:
- Installs dependencies if needed
- Kills any existing dev server
- Starts the development server with hot reload
- Shows helpful URLs and tips

#### Production Deployment
```bash
cd /homeassistant/react-dashboard
./deploy.sh
```
This script:
- Builds the optimized production bundle
- Creates a backup of the current deployment
- Deploys files to Home Assistant
- Checks for required supporting files
- Shows deployment statistics
- Offers to check your configuration

#### Rollback (if needed)
```bash
cd /homeassistant/react-dashboard
./rollback.sh
```
This script:
- Restores the previous deployment from backup
- Useful if something goes wrong with a new deployment

### Manual Steps (Alternative)

#### Development Mode
```bash
cd /homeassistant/react-dashboard
npm run dev
```

#### Production Deployment
1. Build: `npm run build:ha`
2. Deploy: Copy files to `/config/www/react-dashboard/`
3. Clear browser cache and refresh

### Accessing the Dashboard

- **Native Mode**: Click "React Dashboard" in the Home Assistant sidebar
- **Development Mode**: http://192.168.1.7:5173 or http://homeassistant.local:5173

## 📦 Available Scripts

### Convenience Scripts
- `./dev.sh` - Complete development environment setup and launch
- `./deploy.sh` - Build and deploy to Home Assistant with backup
- `./rollback.sh` - Restore previous deployment from backup

### NPM Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build standard production bundle
- `npm run build:ha` - Build for Home Assistant native integration
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

## 🏗️ Development

### Installing Dependencies

```bash
cd /homeassistant/react-dashboard
npm install
```

### Building for Production

```bash
npm run build
```

The production files will be in the `dist` directory.

### Adding New Device Types

1. Create a new card component in `src/components/cards/`
2. Add the card to the switch statement in `EntityCard.tsx`
3. The card will automatically be used for that device type
4. Update `deviceRegistry.ts` to add device type detection logic

### Customizing Entity Filtering

Edit `src/utils/deviceFiltering.ts` to control which entities appear as primary devices.

## 🎨 UI Features

### Room View
- Automatically detects rooms from entity names
- Shows device count per room
- Click a room to see all devices in that room

### Category View
- Groups devices by type (Lights, Cameras, Climate, etc.)
- Shows count for each category
- Easy navigation between device types

### Smart Filtering
- Hides sub-entities (power sensors, battery levels, etc.)
- Only shows main hardware devices
- Related entities appear in device detail modals

### Responsive Design
- **Mobile**: Single column layout
- **Tablet**: 2-3 columns
- **Desktop**: 4 columns
- **Large screens**: 5+ columns

## 🔌 Connection Modes

### Native Mode (Production)
When running as a native Home Assistant panel:
- **No WebSocket needed**: Uses Home Assistant's built-in connection
- **Direct data access**: Entities passed directly from HA
- **Better performance**: No external API calls or webhooks
- **Automatic updates**: Real-time entity updates via postMessage

### Standalone Mode (Development)
When running via `npm run dev`:
- **URL**: Automatically detected (defaults to http://192.168.1.7:8123)
- **Protocol**: WebSocket with real-time updates
- **Authentication**: Long-lived access token
- **Auto-reconnect**: Yes (on connection loss)
- **Device Registry**: Fetches device information for enhanced identification
- **Area Registry**: Fetches area information for room mapping

## 🐛 Troubleshooting

### Camera Feeds Not Showing
- The dashboard tries multiple URL strategies for camera feeds
- Check browser console for which URLs are being attempted
- Ensure your Home Assistant URL is accessible
- Use the refresh button to force reload stale feeds
- Enable auto-refresh for continuous updates (10-second intervals)

### Missing Devices
- Check the device filtering in `deviceFiltering.ts`
- Some entities might be filtered as sub-entities
- Look in the device modal for related entities

### Connection Issues
- Verify Home Assistant is accessible
- Check the access token is valid
- Ensure WebSocket port is not blocked
- Check browser console for connection errors

### Performance
- The dashboard deduplicates entities to improve performance
- Large numbers of entities are paginated
- Consider using room view to reduce visible entities

## 🔒 Security

- Uses long-lived access token for authentication
- Token is embedded in code (for convenience in local setup)
- For production, consider using environment variables
- All WebSocket communications are authenticated

## 🚧 Recent Updates

### Version 2.2 (Latest)
- ✅ **Native Home Assistant Integration**: Dashboard now runs natively within HA, eliminating webhook lag
- ✅ **Iframe Architecture**: Uses iframe with postMessage for better isolation and compatibility
- ✅ **Optimized Build Process**: Special Vite configuration for Home Assistant deployment
- ✅ **Connection Handling**: Smart detection of native vs standalone mode
- ✅ **Performance Improvements**: No more external webhook calls, direct HA data access

### Version 2.1
- ✅ **HA Storage Integration**: Replaced browser localStorage with Home Assistant's frontend storage API
- ✅ **Specialized Device Cards**: Added dedicated cards for EV Chargers and NAS devices
- ✅ **Enhanced Device Discovery**: Dynamic pattern-based detection for Tesla, Synology, and other devices
- ✅ **Improved Camera Detection**: Better filtering of camera sub-entities using device registry
- ✅ **Media Player Enhancements**: Device type detection (TV, Speaker, etc.) with custom icons
- ✅ **Vacuum Card**: Interactive controls and status visualization
- ✅ **Bug Fixes**: Removed all console.log statements for cleaner production code

### Version 2.0
- ✅ **Room and Category Management**: Add/delete custom rooms and categories
- ✅ **Enhanced Device Assignment**: Move devices between rooms with visual interface
- ✅ **Climate Card Overhaul**: Quick mode controls, temperature history charts
- ✅ **Improved Add Device Modal**: Shows available Home Assistant devices by type
- ✅ **Room Normalization**: Fixed duplicate room issues (e.g., "dining room" vs "dining_room")
- ✅ **Edit Device Functionality**: Edit room assignments and device names
- ✅ **Hidden Rooms**: Hide empty rooms to declutter interface
- ✅ **Drag-and-Drop Everything**: Reorder rooms, categories, and devices

## 🚧 Known Issues & Debugging

### Current Issues Being Investigated:
1. **Tesla Charger Assignment**: Devices may not appear in rooms after assignment
   - Check console for `[DEBUG] filterEntitiesByRoomWithOverrides` logs
   - Verify entity overrides are saved correctly

2. **Device Count Mismatch**: Different counts shown in room view vs Add Device modal
   - May be due to filtering differences between views
   - Check console for entity filtering logs

3. **Drag & Drop Persistence**: Card positions may reset after page refresh
   - Verify HA storage is working (check Network tab)
   - Check console for order save/load operations

### Debug Commands (Browser Console):
```javascript
// Check Tesla entities
Object.entries(window.__HA_ENTITIES__ || {}).filter(([id]) => 
  id.includes('tesla') || id.includes('wall_connector')
).forEach(([id, e]) => console.log(id, e.attributes?.friendly_name))

// Check entity overrides
localStorage.getItem('react_dashboard_entity_overrides')

// Check saved card order
localStorage.getItem('react_dashboard_card_order')
```

## 🚧 Roadmap

Future enhancements planned:
- [ ] Custom themes and color schemes
- [ ] Energy monitoring dashboard with historical graphs
- [ ] Automation creation interface
- [ ] Mobile app wrapper
- [ ] Device grouping and scenes
- [ ] Notification center
- [ ] Voice control integration
- [ ] Multi-dashboard support
- [ ] Widget system for custom cards

## 🤝 Contributing

To extend this dashboard:
1. Follow the existing TypeScript patterns
2. Use Tailwind CSS for styling
3. Create reusable components
4. Add proper TypeScript types
5. Test with various entity types

## 📞 Support

For issues:
1. Check the browser console for errors
2. Verify Home Assistant is running
3. Ensure all dependencies are installed
4. Check the Vite server logs
5. Review entity filtering if devices are missing

---

Built with ❤️ for Home Assistant using React, TypeScript, and Tailwind CSS