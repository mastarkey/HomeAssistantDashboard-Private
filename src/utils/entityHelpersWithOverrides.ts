// Enhanced entity helpers that support room overrides

import { extractRoomFromEntity } from './entityHelpers';
import type { Room } from './entityHelpers';

export function getRoomFromEntity(entity: any): string {
  const friendlyName = entity.attributes?.friendly_name || '';
  
  // For custom entities, use the room property directly
  if (entity.room) {
    return entity.room;
  }
  
  // For Home Assistant entities, extract from name
  return extractRoomFromEntity('', friendlyName);
}

export function getRoomsFromEntitiesWithOverrides(
  entities: any,
  getEffectiveRoom?: (entityId: string, defaultRoom?: string) => string
): Room[] {
  const roomMap = new Map<string, { name: string, count: number }>();
  
  Object.entries(entities).forEach(([entityId, entity]) => {
    let room: string;
    
    if (getEffectiveRoom) {
      const defaultRoom = getRoomFromEntity(entity);
      room = getEffectiveRoom(entityId, defaultRoom);
    } else {
      room = getRoomFromEntity(entity);
    }
    
    // Normalize the room ID to prevent duplicates
    const roomId = room.toLowerCase().replace(/[\s_]+/g, '_');
    
    if (roomMap.has(roomId)) {
      const existing = roomMap.get(roomId)!;
      existing.count += 1;
    } else {
      // Preserve the original room name format for display
      roomMap.set(roomId, {
        name: room.charAt(0).toUpperCase() + room.slice(1),
        count: 1
      });
    }
  });
  
  return Array.from(roomMap.entries())
    .map(([id, { name, count }]) => ({
      id,
      name,
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

export function filterEntitiesByRoomWithOverrides(
  entities: any,
  roomId: string,
  getEffectiveRoom?: (entityId: string, defaultRoom?: string) => string
): [string, any][] {
  return Object.entries(entities).filter(([entityId, entity]) => {
    let room: string;
    
    if (getEffectiveRoom) {
      const defaultRoom = getRoomFromEntity(entity);
      room = getEffectiveRoom(entityId, defaultRoom);
    } else {
      room = getRoomFromEntity(entity);
    }
    
    // Normalize both the room and roomId for comparison
    const normalizedRoom = room.toLowerCase().replace(/[\s_]+/g, '_');
    return normalizedRoom === roomId;
  });
}