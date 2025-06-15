# Test Plan for Dashboard Fixes

## 1. Tesla Wall Connector in Garage

### Steps to Test:
1. Open the dashboard and navigate to the Garage room
2. Check console logs for Tesla entities debug output
3. Click "Add Device" button
4. Select "Sensors" category
5. Search for "Tesla" or "Wall Connector"
6. Assign it to the Garage room
7. Verify it appears in the Garage room view

### Expected Console Output:
- `[DEBUG] All Tesla entities:` should show the Tesla Wall Connector
- `[DEBUG] Garage room entities:` should include the Tesla sensor after assignment
- `[DEBUG] Checking Tesla sensor:` should show the sensor being evaluated

## 2. Device Count Consistency

### Steps to Test:
1. Navigate to Climate category view
2. Note the device count shown
3. Open Add Device modal
4. Select Climate category
5. Compare the counts

### Expected Console Output:
- `[DEBUG] Climate category entities:` should show the breakdown of climate devices
- The counts might differ if some devices are already assigned to rooms

## 3. Drag and Drop Functionality

### Steps to Test:
1. Navigate to any room with multiple devices
2. Hover over a device card to see the drag handle
3. Drag a device to a new position
4. Release the device
5. Refresh the page to verify order is saved

### Expected Console Output:
- `[DEBUG] handleDragEnd:` should show drag event details
- `[DEBUG] Device drag:` should show old and new indices
- `[DEBUG] New device order for [room]:` should show the new order
- `[DEBUG] updateDeviceOrder:` should show the order being saved
- `[DEBUG] getDeviceOrder:` should show the saved order being retrieved

## Additional Debugging

If issues persist, check:
1. Browser console for any errors
2. Network tab to see if storage requests are being made
3. Local storage for `react_dashboard_*` keys