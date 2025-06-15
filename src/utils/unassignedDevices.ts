import { filterPrimaryDevices } from './deviceFiltering';
import { isCameraDetectionEntity } from './cameraDetectionHelpers';

export function getAllAvailableDevices(
  entities: any,
  devices: any[] | null
): [string, any][] {
  if (!entities) return [];
  
  // Get all entities as array
  const allEntities = Object.entries(entities);
  console.log(`[DEBUG] Total entities: ${allEntities.length}`);
  
  // Count sensors before filtering
  const sensorCount = allEntities.filter(([id]) => id.startsWith('sensor.')).length;
  const binarySensorCount = allEntities.filter(([id]) => id.startsWith('binary_sensor.')).length;
  console.log(`[DEBUG] Sensors before filtering: ${sensorCount} sensors, ${binarySensorCount} binary_sensors`);
  
  // Filter to primary devices only
  const primaryDevices = filterPrimaryDevices(allEntities, devices, entities);
  console.log(`[DEBUG] Primary devices after filtering: ${primaryDevices.length}`);
  
  // Count sensors after filtering
  const primarySensorCount = primaryDevices.filter(([id]) => id.startsWith('sensor.')).length;
  const primaryBinarySensorCount = primaryDevices.filter(([id]) => id.startsWith('binary_sensor.')).length;
  console.log(`[DEBUG] Sensors after filtering: ${primarySensorCount} sensors, ${primaryBinarySensorCount} binary_sensors`);
  
  // Filter out camera detection entities
  const availableDevices = primaryDevices.filter(([entityId, entity]) => {
    return !isCameraDetectionEntity(entityId, entity, devices);
  });
  console.log(`[DEBUG] Available devices after camera filtering: ${availableDevices.length}`);
  
  // Log domain breakdown
  const domainCounts: Record<string, number> = {};
  availableDevices.forEach(([entityId]) => {
    const domain = entityId.split('.')[0];
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });
  console.log('[DEBUG] Available devices by domain:', domainCounts);
  
  // Return all primary devices (not just unassigned ones)
  // This allows users to reassign devices to different rooms
  return availableDevices;
}

export function groupDevicesByDomain(devices: [string, any][]): Record<string, [string, any][]> {
  const grouped: Record<string, [string, any][]> = {};
  
  devices.forEach(([entityId, entity]) => {
    const domain = entityId.split('.')[0];
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push([entityId, entity]);
  });
  
  // Sort each group by friendly name
  Object.keys(grouped).forEach(domain => {
    grouped[domain].sort((a, b) => {
      const nameA = (a[1].attributes?.friendly_name || a[0]).toLowerCase();
      const nameB = (b[1].attributes?.friendly_name || b[0]).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  });
  
  return grouped;
}