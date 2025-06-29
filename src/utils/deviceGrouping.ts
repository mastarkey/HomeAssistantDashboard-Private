import type { Device } from './deviceRegistry';
import { getDeviceForEntity } from './deviceRegistry';
import { normalizeRoomName } from './roomNormalization';

interface HassEntity {
  state: string;
  attributes: {
    friendly_name?: string;
    device_id?: string;
    [key: string]: unknown;
  };
  last_changed?: string;
  last_updated?: string;
}

export interface DeviceGroup {
  deviceId: string;
  device: Device | null;
  deviceName: string;
  manufacturer?: string;
  model?: string;
  room: string;
  entities: Array<[string, HassEntity]>;
  primaryEntity: [string, HassEntity];
  integration?: string;
}

// Known device patterns for grouping entities without device registry
const DEVICE_PATTERNS = [
  {
    pattern: /tesla[_\s]wall[_\s]connector/i,
    getName: () => 'Tesla Wall Connector',
    groupBy: 'base_name'
  },
  {
    pattern: /dyson[_\s](.+?)(?:_fan)?$/i,
    getName: (_match: string, groups: string[]) => `Dyson ${groups[1]}`,
    groupBy: 'device_name'
  },
  {
    pattern: /sonos[_\s](.+)/i,
    getName: (_match: string, groups: string[]) => `Sonos ${groups[1]}`,
    groupBy: 'device_name'
  },
  {
    pattern: /hue[_\s](.+?)(?:_\d+)?$/i,
    getName: (_match: string, groups: string[]) => `Hue ${groups[1]}`,
    groupBy: 'device_name'
  },
  {
    pattern: /(?:tv|television)[_\s](.+)/i,
    getName: (_match: string, groups: string[]) => `TV ${groups[1]}`,
    groupBy: 'device_name'
  },
  {
    pattern: /(.+?)[_\s](?:tv|television)$/i,
    getName: (_match: string, groups: string[]) => `${groups[1]} TV`,
    groupBy: 'device_name'
  },
  {
    pattern: /(.+?)[_\s](?:blinds?|shades?|curtains?)$/i,
    getName: (_match: string, groups: string[]) => `${groups[1]} Blinds`,
    groupBy: 'device_name'
  },
  {
    pattern: /(?:blinds?|shades?|curtains?)[_\s](.+)/i,
    getName: (_match: string, groups: string[]) => `Blinds ${groups[1]}`,
    groupBy: 'device_name'
  },
  {
    pattern: /^(.+?(?:ai\s*)?pro)(?:\s+(?:driveway|garage|patio|front|back|side|door))?/i,
    getName: (match: string) => match,
    groupBy: 'device_name'
  },
  {
    pattern: /^(.+?)(?:_|\s+)(?:g3|g4|g5|g6)(?:_|\s+)(?:instant|pro|doorbell|flex|bullet)/i,
    getName: (match: string) => match,
    groupBy: 'device_name'
  }
];

// Extract device identifier from entity name
function extractDeviceIdentifier(entityId: string, friendlyName: string): string | null {
  const name = friendlyName.toLowerCase();
  const [domain, entityName] = entityId.split('.');
  const entityNameLower = entityName.toLowerCase();
  
  for (const pattern of DEVICE_PATTERNS) {
    const match = name.match(pattern.pattern);
    if (match) {
      if (pattern.groupBy === 'base_name') {
        // Return a consistent name for all matching entities
        return pattern.getName(match[0], match.slice(1));
      } else {
        // Return the specific device name
        return pattern.getName(match[0], match.slice(1));
      }
    }
  }
  
  // Special handling for entities with room variations (e.g., fan.bedroom vs fan.master_bedroom)
  // Normalize master_bedroom to bedroom
  const normalizedEntityName = entityNameLower
    .replace(/master[_\s]bedroom/g, 'bedroom')
    .replace(/living[_\s]room/g, 'living_room');
  
  // Check if the base device name (without room) matches
  const roomNames = ['bedroom', 'bathroom', 'kitchen', 'living_room', 'garage', 'office', 'hallway', 'dining_room'];
  for (const room of roomNames) {
    if (normalizedEntityName === room || normalizedEntityName.endsWith(`_${room}`)) {
      // This is likely a room-named device (e.g., fan.bedroom)
      // Extract the device type if present
      const deviceTypeMatch = normalizedEntityName.match(/^(.+?)_(?:bedroom|bathroom|kitchen|living_room|garage|office|hallway|dining_room)$/);
      if (deviceTypeMatch) {
        return deviceTypeMatch[1]; // Return just the device type
      }
      // If it's just the room name, check the friendly name for device type
      const friendlyDeviceMatch = name.match(/^(.+?)\s+(?:bedroom|bathroom|kitchen|living room|garage|office|hallway|dining room)/i);
      if (friendlyDeviceMatch) {
        return friendlyDeviceMatch[1].toLowerCase().replace(/\s+/g, '_');
      }
    }
  }
  
  // Handle numbered entities (e.g., light.bedroom_1, light.bedroom_2)
  const numberedMatch = normalizedEntityName.match(/^(.+?)_\d+$/);
  if (numberedMatch) {
    return numberedMatch[1];
  }
  
  // Handle entities with suffixes (e.g., sensor.device_temperature, sensor.device_humidity)
  const suffixMatch = normalizedEntityName.match(/^(.+?)_(temperature|humidity|power|energy|current|voltage|status|state)$/);
  if (suffixMatch) {
    return suffixMatch[1];
  }
  
  // Handle blinds/covers with top/bottom or left/right controls
  const blindsMatch = normalizedEntityName.match(/^(.+?)_(top|bottom|left|right)$/);
  if (blindsMatch) {
    return blindsMatch[1]; // Return base name without position
  }
  
  // Also check friendly name for blinds patterns
  const blindsNameMatch = name.match(/^(.+?)\s+(top|bottom|left|right)$/i);
  if (blindsNameMatch) {
    return blindsNameMatch[1].toLowerCase().replace(/\s+/g, '_');
  }
  
  // Handle TV entities that might have different naming
  if (domain === 'media_player' && (name.toLowerCase().includes('tv') || entityNameLower.includes('tv'))) {
    // Extract the room name if present
    const tvRoomMatch = name.match(/(.+?)\s+tv/i) || entityNameLower.match(/(.+?)_tv/);
    if (tvRoomMatch) {
      return `${tvRoomMatch[1].toLowerCase()}_tv`;
    }
    return 'tv';
  }
  
  return null;
}

// Normalize device names to merge duplicates
function normalizeDeviceName(name: string): string {
  // First normalize room variations
  let normalized = name.toLowerCase()
    .replace(/master[_\s]bedroom/gi, 'bedroom')
    .replace(/living[_\s]room/gi, 'living_room');
  
  // Remove room prefixes/suffixes to get just the device type
  const roomPattern = /(bedroom|bathroom|kitchen|living_room|garage|office|hallway|dining_room|patio|driveway|entryway|laundry)/gi;
  
  // Check if this is a room-prefixed device (e.g., "Bedroom Fan" or "bedroom_fan")
  const prefixMatch = normalized.match(new RegExp(`^(${roomPattern.source})[_\s]+(.+)$`, 'i'));
  if (prefixMatch) {
    normalized = prefixMatch[2]; // Return just the device part
  }
  
  // Check if this is a room-suffixed device (e.g., "Fan Bedroom" or "fan_bedroom")
  const suffixMatch = normalized.match(new RegExp(`^(.+?)[_\s]+(${roomPattern.source})$`, 'i'));
  if (suffixMatch) {
    normalized = suffixMatch[1]; // Return just the device part
  }
  
  // Normalize specific device types
  normalized = normalized
    .replace(/dyson[_\s](.+?)[_\s]fan$/i, 'dyson_fan')
    .replace(/dyson[_\s]fan/i, 'dyson_fan');
  
  return normalized;
}

// Group all entities by their physical device
export function groupEntitiesByDevice(
  entities: Array<[string, HassEntity]>,
  devices: Device[] | null,
  allEntities: Record<string, HassEntity>
): DeviceGroup[] {
  const deviceGroups = new Map<string, DeviceGroup>();
  const processedEntities = new Set<string>();
  
  // First pass: Group by device registry
  if (devices && allEntities) {
    entities.forEach(([entityId]) => {
      if (processedEntities.has(entityId)) return;
      
      const device = getDeviceForEntity(entityId, allEntities, devices);
      if (device) {
        const deviceId = device.id;
        
        if (!deviceGroups.has(deviceId)) {
          // Find all entities for this device
          const deviceEntities = entities.filter(([eid]) => {
            const entityDevice = getDeviceForEntity(eid, allEntities, devices);
            return entityDevice?.id === deviceId;
          });
          
          // Mark all as processed
          deviceEntities.forEach(([eid]) => processedEntities.add(eid));
          
          // Determine primary entity
          const primaryEntity = selectPrimaryEntity(deviceEntities);
          
          // Extract room from device area or entity names
          const room = extractRoomFromDevice(device, deviceEntities);
          
          // Try to determine integration from device or entity patterns
          let integration: string | undefined = device.manufacturer || undefined;
          if (!integration) {
            // Try to infer from entity IDs or names
            const entityId = primaryEntity[0];
            const friendlyName = primaryEntity[1].attributes?.friendly_name || '';
            if (entityId.includes('sense_') || friendlyName.toLowerCase().includes('device ')) {
              integration = 'Sense';
            }
          }
          
          deviceGroups.set(deviceId, {
            deviceId,
            device,
            deviceName: device.name || primaryEntity[1].attributes?.friendly_name || deviceId,
            manufacturer: device.manufacturer || undefined,
            model: device.model || undefined,
            room,
            entities: deviceEntities,
            primaryEntity,
            integration
          });
        }
      }
    });
  }
  
  // Second pass: Group remaining entities by patterns
  entities.forEach(([entityId, entity]) => {
    if (processedEntities.has(entityId)) return;
    
    const friendlyName = entity.attributes?.friendly_name || entityId;
    const domain = entityId.split('.')[0];
    const entityName = entityId.split('.')[1];
    
    // Special handling for covers/blinds - always group them
    if (domain === 'cover') {
      const baseName = entityName
        .replace(/_(?:top|bottom|left|right)$/, '')
        .replace(/_(?:position|tilt)$/, '');
      const groupId = `cover_${baseName}`;
      
      if (!deviceGroups.has(groupId)) {
        // Find all covers with the same base name
        const coverEntities = entities.filter(([eid]) => {
          if (processedEntities.has(eid)) return false;
          const eDomain = eid.split('.')[0];
          const eName = eid.split('.')[1];
          if (eDomain !== 'cover') return false;
          const eBaseName = eName
            .replace(/_(?:top|bottom|left|right)$/, '')
            .replace(/_(?:position|tilt)$/, '');
          return eBaseName === baseName;
        });
        
        if (coverEntities.length > 0) {
          coverEntities.forEach(([eid]) => processedEntities.add(eid));
          const primaryEntity = selectPrimaryEntity(coverEntities);
          const room = extractRoomFromEntities(coverEntities);
          
          deviceGroups.set(groupId, {
            deviceId: groupId,
            device: null,
            deviceName: friendlyName.replace(/\s+(top|bottom|left|right)$/i, ''),
            room,
            entities: coverEntities,
            primaryEntity
          });
          return;
        }
      } else {
        processedEntities.add(entityId);
        return;
      }
    }
    
    // Special handling for media_player TVs - group all TV entities together
    if (domain === 'media_player' && (friendlyName.toLowerCase().includes('tv') || entityName.includes('tv'))) {
      const tvRoom = extractRoomFromEntity(entityId, entity);
      const groupId = `tv_${tvRoom}`;
      
      if (!deviceGroups.has(groupId)) {
        // Find all TV entities in the same room
        const tvEntities = entities.filter(([eid, ent]) => {
          if (processedEntities.has(eid)) return false;
          const eDomain = eid.split('.')[0];
          if (eDomain !== 'media_player') return false;
          const eName = ent.attributes?.friendly_name || eid;
          if (!eName.toLowerCase().includes('tv') && !eid.includes('tv')) return false;
          const eRoom = extractRoomFromEntity(eid, ent);
          return eRoom === tvRoom;
        });
        
        if (tvEntities.length > 0) {
          tvEntities.forEach(([eid]) => processedEntities.add(eid));
          const primaryEntity = selectPrimaryEntity(tvEntities);
          
          deviceGroups.set(groupId, {
            deviceId: groupId,
            device: null,
            deviceName: `${tvRoom === 'other' ? '' : tvRoom.charAt(0).toUpperCase() + tvRoom.slice(1) + ' '}TV`,
            room: tvRoom,
            entities: tvEntities,
            primaryEntity
          });
          return;
        }
      } else {
        processedEntities.add(entityId);
        return;
      }
    }
    
    // Special handling for UniFi cameras and their entities
    const unifiCameraMatch = friendlyName.match(/^((?:ai\s*)?pro\s+(?:driveway|garage|patio|front|back|side|door)|g[3-6]\s+(?:instant|pro|doorbell|flex|bullet))/i);
    const isUnifiCameraEntity = unifiCameraMatch ||
                               entityName.includes('_privacy_mode') || 
                               entityName.includes('_overlay_') || 
                               entityName.includes('_show_') ||
                               entityName.includes('_status_light') ||
                               friendlyName.toLowerCase().includes('overlay:') ||
                               friendlyName.toLowerCase().includes('show ') ||
                               friendlyName.toLowerCase().includes('privacy mode') ||
                               friendlyName.toLowerCase().includes('status light');
    
    if (isUnifiCameraEntity) {
      // Extract the camera name from the entity
      let cameraName = '';
      
      // First try to extract from the beginning of the friendly name
      if (unifiCameraMatch) {
        cameraName = unifiCameraMatch[1];
      } else {
        // For overlay/settings entities, extract camera name before the colon or settings text
        const colonIndex = friendlyName.indexOf(':');
        if (colonIndex > 0) {
          cameraName = friendlyName.substring(0, colonIndex).trim();
        } else {
          // Remove known suffixes
          cameraName = friendlyName
            .replace(/\s*(privacy\s*mode|status\s*light|overlay.*|show\s+\w+)$/i, '')
            .replace(/\s*overlay:.*$/i, '')
            .trim();
        }
      }
      
      // Normalize camera name for grouping
      const groupId = `unifi_camera_${cameraName.toLowerCase().replace(/\s+/g, '_')}`;
      
      if (!deviceGroups.has(groupId)) {
        // Find all entities belonging to this camera
        const cameraEntities = entities.filter(([eid, ent]) => {
          if (processedEntities.has(eid)) return false;
          const eName = ent.attributes?.friendly_name || eid;
          const eLower = eName.toLowerCase();
          const cameraLower = cameraName.toLowerCase();
          
          // Check if this entity belongs to the same camera
          // 1. Starts with camera name
          if (eLower.startsWith(cameraLower)) return true;
          
          // 2. Has camera name before colon (for overlay entities)
          const colonPos = eName.indexOf(':');
          if (colonPos > 0) {
            const beforeColon = eName.substring(0, colonPos).trim().toLowerCase();
            if (beforeColon === cameraLower) return true;
          }
          
          // 3. After removing suffixes, matches camera name
          const cleanedName = eName
            .replace(/\s*(privacy\s*mode|status\s*light|overlay.*|show\s+\w+)$/i, '')
            .replace(/\s*overlay:.*$/i, '')
            .trim();
          if (cleanedName.toLowerCase() === cameraLower) return true;
          
          return false;
        });
        
        if (cameraEntities.length > 0) {
          cameraEntities.forEach(([eid]) => processedEntities.add(eid));
          
          // Find the camera entity as primary, or the first switch
          const primaryEntity = cameraEntities.find(([id]) => id.split('.')[0] === 'camera') || 
                               cameraEntities.find(([id]) => id.split('.')[0] === 'binary_sensor') ||
                               selectPrimaryEntity(cameraEntities);
          
          deviceGroups.set(groupId, {
            deviceId: groupId,
            device: null,
            deviceName: cameraName,
            manufacturer: 'UniFi',
            model: 'Camera',
            room: extractRoomFromEntities(cameraEntities),
            entities: cameraEntities,
            primaryEntity: primaryEntity || cameraEntities[0]
          });
          return;
        }
      } else {
        processedEntities.add(entityId);
        return;
      }
    }
    
    // Special handling for room-based entity names (e.g., fan.bedroom, fan.master_bedroom)
    const normalizedEntityName = entityName
      .replace(/master[_\s]bedroom/g, 'bedroom')
      .replace(/living[_\s]room/g, 'living_room');
    
    // Check if this looks like a room-based device name
    const roomNames = ['bedroom', 'bathroom', 'kitchen', 'living_room', 'garage', 'office', 'hallway', 'dining_room'];
    const isRoomBasedEntity = roomNames.some(room => 
      normalizedEntityName === room || 
      normalizedEntityName.endsWith(`_${room}`)
    );
    
    if (isRoomBasedEntity) {
      // For room-based entities, group by domain + normalized entity name
      const groupId = `${domain}_${normalizedEntityName}`;
      
      if (!deviceGroups.has(groupId)) {
        // Find all similar entities (e.g., all bedroom fans regardless of master_ prefix)
        const similarEntities = entities.filter(([eid]) => {
          if (processedEntities.has(eid)) return false;
          const eDomain = eid.split('.')[0];
          const eName = eid.split('.')[1]
            .replace(/master[_\s]bedroom/g, 'bedroom')
            .replace(/living[_\s]room/g, 'living_room');
          return eDomain === domain && eName === normalizedEntityName;
        });
        
        if (similarEntities.length > 0) {
          // Mark all as processed
          similarEntities.forEach(([eid]) => processedEntities.add(eid));
          
          // Determine primary entity
          const primaryEntity = selectPrimaryEntity(similarEntities);
          
          // Extract room from entity names
          const room = extractRoomFromEntities(similarEntities);
          
          // Determine device name from friendly names
          const deviceNames = similarEntities.map(([_, ent]) => 
            ent.attributes?.friendly_name || ''
          ).filter(n => n);
          const deviceName = deviceNames.find(n => n.toLowerCase().includes('dyson')) || 
                           deviceNames[0] || 
                           friendlyName;
          
          deviceGroups.set(groupId, {
            deviceId: groupId,
            device: null,
            deviceName,
            room,
            entities: similarEntities,
            primaryEntity
          });
        }
      }
    } else {
      // Use the existing pattern matching for other entities
      const deviceIdentifier = extractDeviceIdentifier(entityId, friendlyName);
      
      if (deviceIdentifier) {
        const normalizedId = normalizeDeviceName(deviceIdentifier);
        const groupId = `pattern_${normalizedId}`;
        
        if (!deviceGroups.has(groupId)) {
          // Find all entities matching this pattern
          const patternEntities = entities.filter(([eid, ent]) => {
            if (processedEntities.has(eid)) return false;
            const eName = ent.attributes?.friendly_name || eid;
            const identifier = extractDeviceIdentifier(eid, eName);
            return identifier && normalizeDeviceName(identifier) === normalizedId;
          });
          
          if (patternEntities.length > 0) {
            // Mark all as processed
            patternEntities.forEach(([eid]) => processedEntities.add(eid));
            
            // Determine primary entity
            const primaryEntity = selectPrimaryEntity(patternEntities);
            
            // Extract room from entity names
            const room = extractRoomFromEntities(patternEntities);
            
            deviceGroups.set(groupId, {
              deviceId: groupId,
              device: null,
              deviceName: friendlyName,
              room,
              entities: patternEntities,
              primaryEntity
            });
          }
        }
      }
    }
  });
  
  // Third pass: Single entities as their own device
  entities.forEach(([entityId, entity]) => {
    if (processedEntities.has(entityId)) return;
    
    const room = extractRoomFromEntity(entityId, entity);
    
    deviceGroups.set(`single_${entityId}`, {
      deviceId: `single_${entityId}`,
      device: null,
      deviceName: entity.attributes?.friendly_name || entityId,
      room,
      entities: [[entityId, entity]],
      primaryEntity: [entityId, entity]
    });
  });
  
  return Array.from(deviceGroups.values());
}

// Select the primary entity for a device
function selectPrimaryEntity(entities: Array<[string, HassEntity]>): [string, HassEntity] {
  const priorityDomains = [
    'media_player',
    'climate', 
    'light', 
    'switch', 
    'cover', 
    'fan',
    'lock',
    'camera',
    'vacuum',
    'sensor',
    'binary_sensor'
  ];
  
  // Sort by priority
  const sorted = [...entities].sort(([aId], [bId]) => {
    const aDomain = aId.split('.')[0];
    const bDomain = bId.split('.')[0];
    const aPriority = priorityDomains.indexOf(aDomain);
    const bPriority = priorityDomains.indexOf(bDomain);
    
    if (aPriority === -1 && bPriority === -1) return 0;
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    
    return aPriority - bPriority;
  });
  
  return sorted[0] || entities[0];
}

// Extract room from device area
function extractRoomFromDevice(device: Device, entities: Array<[string, HassEntity]>): string {
  // Device area takes precedence
  if (device.area_id) {
    // This would need to be mapped to actual area name
    // For now, fall back to entity extraction
  }
  
  return extractRoomFromEntities(entities);
}

// Extract room from entity names
function extractRoomFromEntities(entities: Array<[string, HassEntity]>): string {
  // Try to extract room from entity names
  for (const [entityId, entity] of entities) {
    const room = extractRoomFromEntity(entityId, entity);
    if (room !== 'other') {
      return room;
    }
  }
  
  return 'other';
}

// Extract room from a single entity
function extractRoomFromEntity(entityId: string, entity: HassEntity): string {
  const friendlyName = entity.attributes?.friendly_name || '';
  const entityName = entityId.split('.')[1];
  
  // Common room names to check
  const rooms = [
    'bedroom', 'living_room', 'living room', 'kitchen', 'bathroom', 
    'garage', 'office', 'hallway', 'dining_room', 'dining room',
    'patio', 'driveway', 'entryway', 'laundry', 'basement', 'attic'
  ];
  
  // Check friendly name first
  const nameLower = friendlyName.toLowerCase();
  for (const room of rooms) {
    if (nameLower.includes(room)) {
      return normalizeRoomName(room);
    }
  }
  
  // Check entity ID
  const entityLower = entityName.toLowerCase();
  for (const room of rooms) {
    const roomNormalized = room.replace(/\s+/g, '_');
    if (entityLower.includes(roomNormalized)) {
      return normalizeRoomName(room);
    }
  }
  
  // Special handling for master bedroom
  if (nameLower.includes('master') && nameLower.includes('bedroom')) {
    return normalizeRoomName('bedroom');
  }
  if (entityLower.includes('master') && entityLower.includes('bedroom')) {
    return normalizeRoomName('bedroom');
  }
  
  return 'other';
}