import { filterPrimaryDevices } from './deviceFiltering';

export function getUnassignedDevices(
  entities: any,
  devices: any[] | null,
  getEffectiveRoom?: (entityId: string, defaultRoom?: string) => string
): [string, any][] {
  if (!entities) return [];
  
  // Get all entities as array
  const allEntities = Object.entries(entities);
  
  // Filter to primary devices only
  const primaryDevices = filterPrimaryDevices(allEntities, devices, entities);
  
  // Filter devices that are in "other" room or have no room assigned
  const unassigned = primaryDevices.filter(([entityId, entity]) => {
    const room = getEffectiveRoom ? getEffectiveRoom(entityId, 'other') : 'other';
    
    // Check if entity has a room assignment from friendly name
    const friendlyName = entity.attributes?.friendly_name || '';
    const hasRoomInName = friendlyName.match(/^(bedroom|bathroom|kitchen|living room|garage|hallway|entryway|office|basement|attic|dining room|laundry room|closet|pantry|foyer|mudroom|sunroom|den|library|gym|master bedroom|guest bedroom|kids room|nursery|playroom|media room|game room|front patio|back patio|driveway|backyard|front yard|porch|deck|balcony|pool|shed|workshop|studio|loft|utility room)/i);
    
    return room === 'other' && !hasRoomInName;
  });
  
  return unassigned;
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