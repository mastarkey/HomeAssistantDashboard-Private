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
  console.log(`[DEBUG] filterEntitiesByRoomWithOverrides called for room: ${roomId}`);
  
  // Debug: Show what entities have overrides for this room
  if (roomId === 'other' || roomId === 'garage') {
    const entitiesWithThisRoom = Object.entries(entities).filter(([id, entity]) => {
      const defaultRoom = getRoomFromEntity(entity);
      const effectiveRoom = getEffectiveRoom ? getEffectiveRoom(id, defaultRoom) : defaultRoom;
      const normalizedRoom = effectiveRoom.toLowerCase().replace(/[\s_]+/g, '_');
      return normalizedRoom === roomId;
    });
    
    console.log(`[DEBUG] Entities assigned to room '${roomId}':`, 
      entitiesWithThisRoom.map(([id, e]) => ({
        id,
        friendlyName: (e as any).attributes?.friendly_name,
        domain: id.split('.')[0],
        defaultRoom: getRoomFromEntity(e),
        effectiveRoom: getEffectiveRoom ? getEffectiveRoom(id, getRoomFromEntity(e)) : getRoomFromEntity(e)
      }))
    );
  }
  
  const results = Object.entries(entities).filter(([entityId, entity]) => {
    let room: string;
    
    if (getEffectiveRoom) {
      const defaultRoom = getRoomFromEntity(entity);
      room = getEffectiveRoom(entityId, defaultRoom);
      
      // Log Tesla entities specifically
      if (entityId.toLowerCase().includes('tesla') || entityId.toLowerCase().includes('wall_connector')) {
        console.log(`[DEBUG] Tesla entity ${entityId}: defaultRoom=${defaultRoom}, effectiveRoom=${room}, looking for roomId=${roomId}`);
      }
    } else {
      room = getRoomFromEntity(entity);
    }
    
    // Normalize both the room and roomId for comparison
    const normalizedRoom = room.toLowerCase().replace(/[\s_]+/g, '_');
    const matches = normalizedRoom === roomId;
    
    if ((roomId === 'garage' || roomId === 'other') && matches) {
      console.log(`[DEBUG] Entity ${entityId} matches ${roomId}: room=${room}, normalizedRoom=${normalizedRoom}`);
    }
    
    // Log all entities going to 'other' room
    if (roomId === 'other' && matches) {
      const friendlyName = (entity as any).attributes?.friendly_name || entityId;
      console.log(`[DEBUG] Entity in 'other' room: ${entityId} (${friendlyName})`);
    }
    
    return matches;
  });
  
  console.log(`[DEBUG] filterEntitiesByRoomWithOverrides found ${results.length} entities for room ${roomId}`);
  if (roomId === 'other' && results.length > 0) {
    console.log(`[DEBUG] Entities in 'other' room:`, results.map(([id]) => id));
  }
  return results;
}