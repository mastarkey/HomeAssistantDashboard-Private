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

### Advanced Modal System
- ✅ **Device Details Modal**: Click any device for comprehensive control
- ✅ **Related Entities**: Shows all sensors and sub-entities in modal
- ✅ **Device Information**: Model, firmware, MAC address (where available)
- ✅ **Scene Integration**: Related scenes appear in device modals
- ✅ **Activity Log**: Recent device events and state changes

### Organization & Customization
- ✅ **Drag-and-Drop Reordering**: Reorganize rooms, categories, and devices
- ✅ **Persistent Layout**: Card order saved in browser storage
- ✅ **Visual Feedback**: Drag handles appear on hover
- ✅ **Add Custom Devices**: Add devices manually with room assignment
- ✅ **Comprehensive Device Support**: Cards for all common smart home device types

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
│   │   └── cards/
│   │       ├── LightCard.tsx     # Light control with brightness slider
│   │       ├── CameraCard.tsx    # Camera preview card
│   │       ├── SwitchCard.tsx    # Switch toggle card
│   │       ├── ClimateCard.tsx   # Climate control card
│   │       ├── MediaPlayerCard.tsx # Media player controls
│   │       └── WeatherCard.tsx   # Weather display card
│   ├── hooks/
│   │   └── useHomeAssistant.ts   # WebSocket connection and device registry
│   ├── utils/
│   │   ├── entityHelpers.ts      # Room detection and categorization
│   │   ├── deviceFiltering.ts    # Smart filtering for primary devices
│   │   ├── deduplicateEntities.ts # Remove duplicate entities
│   │   └── deviceRegistry.ts     # Device registry integration
│   ├── types/                    # TypeScript type definitions
│   ├── App.tsx                   # Root application component
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Tailwind CSS imports
├── public/                       # Static assets
├── dist/                         # Production build output
├── package.json                  # Dependencies and scripts
├── tailwind.config.js           # Tailwind configuration
├── vite.config.ts               # Vite configuration
└── README.md                    # This file
```

## 🔧 Configuration

### Access Token

The dashboard uses a long-lived access token for authentication. Your token is already configured in the code:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzMzMzYjM3ZWUyYjk0ODRmOWQ3ODk5ZGVhYzY4MTM4MCIsImlhdCI6MTc0OTg2MTU0MSwiZXhwIjoyMDY1MjIxNTQxfQ.juV15QOsu_jgW87tABrc7doVr97teA8jfihFDCWPDsw
```

### Home Assistant Configuration

The dashboard is configured in `configuration.yaml`:
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

### Starting the Dashboard

1. **Using the startup script**:
   ```bash
   /homeassistant/react-dashboard/start-dashboard.sh
   ```

2. **Or manually**:
   ```bash
   cd /homeassistant/react-dashboard
   npm run dev
   ```

### Accessing the Dashboard

- **From Home Assistant**: Click "React Dashboard" in the sidebar
- **Direct URL**: http://192.168.1.7:5173
- **Alternative**: http://homeassistant.local:5173

## 📦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
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

## 🔌 WebSocket Connection

The dashboard connects to Home Assistant using:
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

## 🚧 Roadmap

Future enhancements planned:
- [ ] Drag-and-drop dashboard customization
- [ ] Custom themes and color schemes
- [ ] Energy monitoring dashboard
- [ ] Automation creation interface
- [ ] Mobile app wrapper
- [x] Device registry integration for better device identification

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