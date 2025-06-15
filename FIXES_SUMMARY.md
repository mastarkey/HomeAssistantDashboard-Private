# Fixes Applied for Tesla Charger and Drag & Drop Issues

## 1. Tesla Charger Not Showing in Garage

### Debug Logging Added:
- Added extensive debug logging to `filterEntitiesByRoomWithOverrides` in `entityHelpersWithOverrides.ts`
- The function now logs:
  - When called for a specific room
  - Tesla entities and their effective room assignments
  - Entities that match the garage room
  - Total count of entities found for each room

### What to Check:
1. Open browser console and navigate to the garage room
2. Look for logs like:
   - `[DEBUG] filterEntitiesByRoomWithOverrides called for room: garage`
   - `[DEBUG] Tesla entity sensor.tesla_wall_connector_*: defaultRoom=other, effectiveRoom=garage`
   - `[DEBUG] Entity sensor.tesla_wall_connector_* matches garage`

### Possible Issues:
- The Tesla charger might not have the correct entity override saved
- The entity ID might not contain "tesla" or "wall_connector" keywords
- The device might be filtered out by `filterPrimaryDevices`

## 2. Device Count Mismatch

The mismatch between room view (2 devices) and Add Device modal (3 devices) could be due to:
- Hidden entities (check for `override.hidden`)
- Entities being filtered by `filterPrimaryDevices`
- Camera detection entities being filtered out

### Debug Info Added:
- Dashboard now logs device counts at various filtering stages
- Check console for `[DEBUG] Garage room entities:` which shows the filtering pipeline

## 3. Drag and Drop Not Persisting

### Current Implementation:
- Uses `@dnd-kit` for drag and drop
- Order is saved to HA storage via `updateDeviceOrder`
- Order is retrieved via `getDeviceOrder`

### Debug Logging:
- Console will show:
  - `[DEBUG] handleDragEnd:` when drag completes
  - `[DEBUG] Device drag:` with old/new indices
  - `[DEBUG] New device order for [room]:` with the new order
  - `[DEBUG] updateDeviceOrder:` when saving
  - `[DEBUG] getDeviceOrder:` when retrieving saved order

### To Test:
1. Open console
2. Drag a device to a new position
3. Check for the debug logs
4. Refresh the page
5. Check if `getDeviceOrder` retrieves the saved order

### Possible Issues:
- HA storage might not be persisting properly
- The order might be saved but not applied correctly
- The drag event might not be firing properly

## Next Steps:

1. **For Tesla Charger**: Check console logs to see where in the filtering pipeline the Tesla entity is being removed
2. **For Device Count**: Compare the entities shown in the debug logs between the two views
3. **For Drag & Drop**: Verify that the order is being saved to and retrieved from storage correctly

## Quick Test Commands:

To check if Tesla entities exist:
```javascript
// Run in browser console
Object.entries(window.__HA_ENTITIES__ || {}).filter(([id, e]) => 
  id.toLowerCase().includes('tesla') || 
  id.toLowerCase().includes('wall_connector')
).forEach(([id, e]) => console.log(id, e.attributes?.friendly_name))
```

To check entity overrides:
```javascript
// Run in browser console
localStorage.getItem('react_dashboard_entity_overrides')
```