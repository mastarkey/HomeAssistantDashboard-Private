// Room normalization utilities to handle room name variations and duplicates

// Common room name mappings to normalize variations
const ROOM_MAPPINGS: Record<string, string> = {
  'master_bedroom': 'bedroom',
  'master bedroom': 'bedroom',
  'main_bedroom': 'bedroom',
  'main bedroom': 'bedroom',
  'guest_bedroom': 'guest bedroom',
  'guest_room': 'guest bedroom',
  'living_room': 'living room',
  'livingroom': 'living room',
  'family_room': 'living room',
  'great_room': 'living room',
  'den': 'living room',
  'dining_room': 'dining room',
  'diningroom': 'dining room',
  'front_patio': 'patio',
  'back_patio': 'patio',
  'backyard': 'patio',
  'front_yard': 'driveway',
  'frontyard': 'driveway',
  'utility_room': 'laundry',
  'utility': 'laundry',
  'laundry_room': 'laundry',
  'mud_room': 'entryway',
  'mudroom': 'entryway',
  'entry': 'entryway',
  'foyer': 'entryway',
  'powder_room': 'bathroom',
  'half_bath': 'bathroom',
  'half_bathroom': 'bathroom',
  'main_bathroom': 'bathroom',
  'master_bathroom': 'bathroom',
  'master bathroom': 'bathroom',
  'kids_bedroom': 'bedroom',
  'childs_bedroom': 'bedroom',
  'office_bedroom': 'office',
  'home_office': 'office',
  'study': 'office',
  'theater': 'media room',
  'theater_room': 'media room',
  'media_room': 'media room',
  'game_room': 'media room',
  'gameroom': 'media room',
  'basement': 'downstairs',
  'attic': 'upstairs',
  'upstairs_hallway': 'hallway',
  'downstairs_hallway': 'hallway',
  'upper_hallway': 'hallway',
  'lower_hallway': 'hallway',
  'stairway': 'hallway',
  'stairs': 'hallway',
  'carport': 'garage',
  'car_port': 'garage',
  'shed': 'garage',
  'workshop': 'garage',
};

// Normalize a room name to its canonical form
export function normalizeRoomName(roomName: string): string {
  if (!roomName) return 'other';
  
  const normalized = roomName.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Check if we have a direct mapping
  if (ROOM_MAPPINGS[normalized]) {
    return ROOM_MAPPINGS[normalized];
  }
  
  // Check without underscores
  const withoutUnderscores = normalized.replace(/_/g, ' ');
  if (ROOM_MAPPINGS[withoutUnderscores]) {
    return ROOM_MAPPINGS[withoutUnderscores];
  }
  
  // Handle numbered rooms (e.g., "bedroom 2" -> "bedroom")
  const numberedRoomMatch = normalized.match(/^([\w\s]+?)[\s_]*\d+$/);
  if (numberedRoomMatch) {
    const baseRoom = numberedRoomMatch[1].trim();
    if (ROOM_MAPPINGS[baseRoom]) {
      return ROOM_MAPPINGS[baseRoom];
    }
    // For numbered rooms, keep the base name but normalized
    return baseRoom.replace(/_/g, ' ');
  }
  
  // Handle possessive forms (e.g., "john's bedroom" -> "bedroom")
  const possessiveMatch = normalized.match(/(?:[\w]+['']s?\s+)?(bedroom|bathroom|office|room)$/);
  if (possessiveMatch) {
    return possessiveMatch[1];
  }
  
  // If no mapping found, return the original but with spaces instead of underscores
  return normalized.replace(/_/g, ' ');
}

// Check if a room exists in the list of available rooms
export function roomExists(roomName: string, availableRooms: Array<{ id: string; name: string }>): boolean {
  const normalizedRoomName = normalizeRoomName(roomName);
  return availableRooms.some(room => 
    normalizeRoomName(room.name) === normalizedRoomName ||
    normalizeRoomName(room.id) === normalizedRoomName
  );
}

// Find the best matching room from available rooms
export function findBestMatchingRoom(
  roomName: string, 
  availableRooms: Array<{ id: string; name: string }>
): string | null {
  if (!roomName || !availableRooms.length) return null;
  
  const normalizedTarget = normalizeRoomName(roomName);
  
  // First try exact match after normalization
  for (const room of availableRooms) {
    if (normalizeRoomName(room.name) === normalizedTarget || 
        normalizeRoomName(room.id) === normalizedTarget) {
      return room.id;
    }
  }
  
  // If no exact match, check if the normalized name exists in any form
  for (const room of availableRooms) {
    const normalizedRoomName = normalizeRoomName(room.name);
    const normalizedRoomId = normalizeRoomName(room.id);
    
    // Check if they share the same base room type
    if (normalizedRoomName === normalizedTarget || normalizedRoomId === normalizedTarget) {
      return room.id;
    }
  }
  
  // If still no match, return null (will default to "other")
  return null;
}

// Get the effective room for an entity, handling non-existent rooms
export function getEffectiveRoomWithNormalization(
  assignedRoom: string | null,
  availableRooms: Array<{ id: string; name: string }>
): string {
  if (!assignedRoom) return 'other';
  
  // Check if the assigned room exists
  if (roomExists(assignedRoom, availableRooms)) {
    // Find the actual room ID that matches
    const match = findBestMatchingRoom(assignedRoom, availableRooms);
    return match || 'other';
  }
  
  // Try to find a matching room after normalization
  const bestMatch = findBestMatchingRoom(assignedRoom, availableRooms);
  if (bestMatch) {
    return bestMatch;
  }
  
  // If no match found, return "other"
  return 'other';
}

// Merge duplicate rooms based on normalized names
export function mergeDuplicateRooms(
  rooms: Array<{ id: string; name: string; entityCount: number }>
): Array<{ id: string; name: string; entityCount: number; mergedFrom?: string[] }> {
  const mergedRooms = new Map<string, { 
    id: string; 
    name: string; 
    entityCount: number; 
    mergedFrom: string[] 
  }>();
  
  for (const room of rooms) {
    const normalizedName = normalizeRoomName(room.name);
    
    if (mergedRooms.has(normalizedName)) {
      // Merge with existing room
      const existing = mergedRooms.get(normalizedName)!;
      existing.entityCount += room.entityCount;
      existing.mergedFrom.push(room.id);
    } else {
      // Create new entry
      mergedRooms.set(normalizedName, {
        id: room.id,
        name: room.name,
        entityCount: room.entityCount,
        mergedFrom: []
      });
    }
  }
  
  return Array.from(mergedRooms.values());
}