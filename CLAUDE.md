# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview

# Test (no tests written yet, but infrastructure ready)
npm test
```

## Architecture Overview

This is a React dashboard for Home Assistant that uses WebSocket for real-time entity updates. The dashboard organizes devices by rooms and categories with drag-and-drop support.

### Key Architectural Decisions

1. **No Global State Management**: Uses React hooks and local state instead of Redux/Zustand. Shared state is managed through custom hooks.

2. **WebSocket Integration**: All Home Assistant communication goes through `useHomeAssistant` hook using the `home-assistant-js-websocket` library. The connection includes:
   - Entity state subscriptions
   - Device registry fetching
   - Area registry fetching
   - Service calls for device control

3. **Smart Component Pattern**: 
   - `EntityCard.tsx` acts as a router, determining which card component to render based on entity domain
   - Individual card components (in `src/components/cards/`) handle specific device types
   - Modal components provide detailed views with additional controls

4. **Persistence Strategy**: 
   - Primary: Home Assistant's frontend storage API (`haStorage.ts`)
   - Fallback: Browser localStorage
   - Stores: card order, entity overrides, custom rooms/categories

5. **Device Filtering**: Complex filtering logic in `deviceFiltering.ts` ensures only primary hardware devices appear in the dashboard, hiding sub-entities like sensors and diagnostics.

### Adding New Features

When adding new device types:
1. Create card component in `src/components/cards/`
2. Add case to `EntityCard.tsx` switch statement
3. Update `deviceRegistry.ts` if special detection logic needed
4. Consider if a specialized modal is needed

When modifying entity filtering:
- Edit `src/utils/deviceFiltering.ts` 
- Test with various entity types to ensure no regressions

## Home Assistant Integration

- **Authentication**: Long-lived token hardcoded in `useHomeAssistant.ts`
- **WebSocket URL**: Auto-detected, defaults to http://192.168.1.7:8123
- **Panel Config**: Configured as iframe in `panel_config.yaml`

## Important Patterns

1. **Room Detection**: Automatic from entity names + manual overrides via `useEntityOverrides`
2. **Device Deduplication**: Handled in `deduplicateEntities.ts` to prevent duplicates
3. **Drag & Drop**: Uses `@dnd-kit` library, order persisted via HA storage
4. **Camera URLs**: Multiple strategies attempted in `CameraImage.tsx` for compatibility
5. **Climate History**: Uses Chart.js for temperature graphs in `ClimateModal.tsx`

## Custom Hooks Reference

Key hooks that manage application state:
- `useHomeAssistant`: WebSocket connection and entity state management
- `useOrderStorage`: Persists drag-and-drop card ordering
- `useEntityOverrides`: Manual room assignment overrides
- `useCustomEntities`: User-created custom devices
- `useCustomRooms`: User-defined rooms beyond Home Assistant areas
- `useCustomCategories`: Additional device categories
- `useHiddenRooms`: Room visibility toggles

## Entity Type Handling

The dashboard supports these entity domains with specialized cards:
- `light` - Brightness, color temperature, RGB control
- `switch` - Simple on/off toggle
- `climate` - Temperature, mode, fan control with history graphs
- `camera` - Live image streams with multiple URL strategies
- `media_player` - Playback controls, volume, source selection
- `cover` - Position control for blinds/garage doors
- `lock` - Lock/unlock with code support
- `vacuum` - Cleaning controls and status
- `fan` - Speed and oscillation control
- `sensor` - Value display with units and graphs
- `binary_sensor` - State display with custom icons
- `number` - Slider input controls
- `select` - Dropdown selection
- `button` - Action triggers
- `scene` - Scene activation
- `script` - Script execution
- `automation` - Enable/disable controls
- `input_*` - Various input controls

## Testing Considerations

When making changes:
- Test with various entity types and states
- Verify persistence works (refresh page)
- Check WebSocket reconnection on network issues
- Test drag-and-drop across rooms and categories
- Verify modal interactions don't affect main view state