// Helper functions for entity organization
import type { Device, Area } from './deviceRegistry';
import { normalizeRoomName } from './roomNormalization';

export interface Room {
  id: string;
  name: string;
  entityCount: number;
  areaId?: string; // Reference to Home Assistant area
}

export interface DeviceCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  domains: string[];
}

// We'll define these in the component file since they need React components
export const deviceCategoryIds = [
  'lights',
  'climate', 
  'security',
  'media',
  'switches',
  'sensors',
  'cameras'
] as const;

export type DeviceCategoryId = typeof deviceCategoryIds[number];

// Actual room names to detect - must be specific rooms in a house
const actualRooms = [
  'bedroom', 'bathroom', 'kitchen', 'living room', 'dining room',
  'hallway', 'garage', 'laundry room', 'office', 'basement',
  'attic', 'patio', 'driveway', 'entryway', 'foyer',
  'master bedroom', 'guest room', 'study', 'den', 'closet'
];

// Words that indicate location but not a specific room
const locationIndicators = ['downstairs', 'upstairs', 'front', 'back', 'main'];

// Brand/device names to exclude from room detection
const excludedWords = [
  'sonos', 'nest', 'google', 'philips', 'hue', 'ikea', 'xiaomi',
  'samsung', 'lg', 'sony', 'apple', 'amazon', 'alexa', 'echo',
  'sensor', 'switch', 'light', 'device', 'heat', 'water', 'pump',
  'fridge', 'coffee', 'dream', 'mini', 'center', 'lennox', 'irobot',
  'instapot', 'always', 'sun', 'electric', 'sense', 'matthew'
];

// Get area name for an entity using device registry and area assignments
export function getAreaForEntity(
  entityId: string,
  entities: Record<string, any>,
  devices: Device[] | null,
  areas: Area[] | null
): string | null {
  if (!entities || !devices || !areas) return null;
  
  const entity = entities[entityId];
  if (!entity?.attributes?.device_id) return null;
  
  // Find the device for this entity
  const device = devices.find(d => d.id === entity.attributes.device_id);
  if (!device || !device.area_id) return null;
  
  // Find the area for this device
  const area = areas.find(a => a.area_id === device.area_id);
  return area?.name || null;
}

export function extractRoomFromEntity(_entityId: string, friendlyName: string): string {
  const name = friendlyName.toLowerCase();
  
  // Skip if name contains excluded words (brands, device types)
  for (const excluded of excludedWords) {
    if (name.includes(excluded)) {
      return 'other';
    }
  }
  
  // Check for actual room names
  for (const room of actualRooms) {
    if (name.includes(room)) {
      // Use normalized room names to avoid duplicates
      if (room === 'bedroom') {
        return normalizeRoomName(room);
      }
      
      // Handle "front patio" and "back patio" - normalize them
      if (room === 'patio') {
        return normalizeRoomName('patio');
      }
      
      return normalizeRoomName(room);
    }
  }
  
  // Check for rooms with numbers (e.g., "bedroom 2")
  const roomWithNumber = name.match(/(bedroom|bathroom|office)\s*\d+/i);
  if (roomWithNumber) {
    return normalizeRoomName(roomWithNumber[0].toLowerCase());
  }
  
  // Check if it's a location indicator + room
  for (const location of locationIndicators) {
    for (const room of actualRooms) {
      if (name.includes(location) && name.includes(room)) {
        return normalizeRoomName(`${location} ${room}`);
      }
    }
  }
  
  return 'other';
}

export function getRoomsFromEntities(
  entities: any,
  devices: Device[] | null = null,
  areas: Area[] | null = null
): Room[] {
  const roomMap = new Map<string, { count: number; areaId?: string }>();
  
  Object.entries(entities).forEach(([entityId, entity]) => {
    // First try to get room from area assignment
    const areaName = getAreaForEntity(entityId, entities, devices, areas);
    let room: string;
    let areaId: string | undefined;
    
    if (areaName) {
      // Use the area name as the room name
      room = areaName.toLowerCase();
      // Find the area ID for reference
      const area = areas?.find(a => a.name === areaName);
      areaId = area?.area_id;
    } else {
      // Fall back to pattern matching from friendly name
      const friendlyName = (entity as any).attributes?.friendly_name || entityId;
      room = extractRoomFromEntity(entityId, friendlyName);
    }
    
    const existing = roomMap.get(room) || { count: 0 };
    roomMap.set(room, { 
      count: existing.count + 1,
      areaId: areaId || existing.areaId 
    });
  });
  
  return Array.from(roomMap.entries())
    .map(([name, data]) => ({
      id: name.replace(/\s+/g, '_'),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      entityCount: data.count,
      areaId: data.areaId
    }))
    .sort((a, b) => {
      // Put "other" at the end
      if (a.id === 'other') return 1;
      if (b.id === 'other') return -1;
      // Sort by entity count descending
      return b.entityCount - a.entityCount;
    });
}

export function filterEntitiesByRoom(
  entities: any,
  roomId: string,
  devices: Device[] | null = null,
  areas: Area[] | null = null
): [string, any][] {
  return Object.entries(entities).filter(([entityId, entity]) => {
    // First try to filter by area assignment
    const areaName = getAreaForEntity(entityId, entities, devices, areas);
    
    if (areaName) {
      // Compare with the area-based room ID
      return areaName.toLowerCase().replace(/\s+/g, '_') === roomId;
    } else {
      // Fall back to pattern matching from friendly name
      const friendlyName = (entity as any).attributes?.friendly_name || entityId;
      const room = extractRoomFromEntity(entityId, friendlyName);
      return room.replace(/\s+/g, '_') === roomId;
    }
  });
}

export function filterEntitiesByCategory(entities: any, categoryId: string, categoryDomains: Record<string, string[]>): [string, any][] {
  const domains = categoryDomains[categoryId];
  if (!domains) return [];
  
  return Object.entries(entities).filter(([entityId]) => {
    return domains.some(domain => {
      if (domain.includes('.')) {
        // Handle specific entity types like binary_sensor.door
        return entityId.startsWith(domain);
      }
      return entityId.startsWith(domain + '.');
    });
  });
}

// Remove emoji-based icon function - we'll use Lucide icons in components