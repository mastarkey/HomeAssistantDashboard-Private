// Helper functions for entity organization

export interface Room {
  id: string;
  name: string;
  entityCount: number;
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
  'sonos', 'nest', 'google', 'tesla', 'philips', 'hue', 'ikea', 'xiaomi',
  'samsung', 'lg', 'sony', 'apple', 'amazon', 'alexa', 'echo',
  'sensor', 'switch', 'light', 'device', 'heat', 'water', 'pump',
  'fridge', 'coffee', 'dream', 'mini', 'center', 'lennox', 'irobot',
  'instapot', 'always', 'sun', 'electric', 'sense', 'matthew'
];

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
      // Handle special cases like "master bedroom" or "guest bedroom"
      if (room === 'bedroom' && (name.includes('master') || name.includes('guest'))) {
        return name.includes('master') ? 'master bedroom' : 'guest bedroom';
      }
      
      // Handle "front patio" and "back patio"
      if (room === 'patio' && (name.includes('front') || name.includes('back'))) {
        return name.includes('front') ? 'front patio' : 'back patio';
      }
      
      return room;
    }
  }
  
  // Check for rooms with numbers (e.g., "bedroom 2")
  const roomWithNumber = name.match(/(bedroom|bathroom|office)\s*\d+/i);
  if (roomWithNumber) {
    return roomWithNumber[0].toLowerCase();
  }
  
  // Check if it's a location indicator + room
  for (const location of locationIndicators) {
    for (const room of actualRooms) {
      if (name.includes(location) && name.includes(room)) {
        return `${location} ${room}`;
      }
    }
  }
  
  return 'other';
}

export function getRoomsFromEntities(entities: any): Room[] {
  const roomMap = new Map<string, number>();
  
  Object.entries(entities).forEach(([entityId, entity]) => {
    const friendlyName = (entity as any).attributes?.friendly_name || entityId;
    const room = extractRoomFromEntity(entityId, friendlyName);
    roomMap.set(room, (roomMap.get(room) || 0) + 1);
  });
  
  return Array.from(roomMap.entries())
    .map(([name, count]) => ({
      id: name.replace(/\s+/g, '_'),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      entityCount: count
    }))
    .sort((a, b) => {
      // Put "other" at the end
      if (a.id === 'other') return 1;
      if (b.id === 'other') return -1;
      // Sort by entity count descending
      return b.entityCount - a.entityCount;
    });
}

export function filterEntitiesByRoom(entities: any, roomId: string): [string, any][] {
  return Object.entries(entities).filter(([entityId, entity]) => {
    const friendlyName = (entity as any).attributes?.friendly_name || entityId;
    const room = extractRoomFromEntity(entityId, friendlyName);
    return room.replace(/\s+/g, '_') === roomId;
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