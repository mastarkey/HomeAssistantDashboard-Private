// Utility functions for filtering out sub-entities and identifying primary devices
import { getDeviceForEntity, type Device } from './deviceRegistry';

// Patterns that indicate a sub-entity or sensor that should be hidden from main view
const SUB_ENTITY_PATTERNS = [
  // Detection types
  /_detections?_(animal|baby_cry|car_alarm|co_alarm|glass_break|person|smoke|speaking|vehicle|license_plate|siren)$/i,
  /_detections?$/i,
  
  // Overlay and display options
  /_overlay_(show_date|show_logo|show_name|show_nerd_mode)$/i,
  /_show_(date|logo|name|nerd_mode)$/i,
  
  // Privacy and system settings
  /_privacy_mode$/i,
  /_system_sounds$/i,
  /_motion$/i,
  /_none$/i,
  
  // Sensor suffixes
  /_(power|energy|voltage|current|temperature|humidity|pressure|battery|rssi|signal_strength|linkquality)$/i,
  /_(state|status|mode|last_seen|update|available)$/i,
  
  // Media player sub-entities
  /_(source|volume|shuffle|repeat|play_mode|sound_mode)$/i,
  /_(bass|treble|balance|loudness|night_sound|speech_enhancement)$/i,
  /_(subwoofer|surround|full_volume)_enabled$/i,
  
  // Device info entities
  /_(firmware|software|hardware)_version$/i,
  /_(ip_address|mac_address|wifi_signal)$/i,
  
  // Climate sub-entities
  /_(target_temp|current_temp|humidity|fan_mode|swing_mode|preset_mode)$/i,
  
  // Light sub-entities (but keep the main light entity)
  /_(color_temp|brightness|effect|rgb_color|xy_color|hs_color)$/i,
  
  // Binary sensors that are sub-features
  /_connectivity$/i,
  /_reachable$/i,
  /_updating$/i,
  /_online$/i,
];


// Keywords in friendly names that indicate sub-entities
const SUB_ENTITY_NAME_PATTERNS = [
  /detections?:/i,
  /overlay:/i,
  /show\s+(date|logo|name)/i,
  /privacy mode/i,
  /system sounds/i,
  /firmware/i,
  /connectivity/i,
  /power usage/i,
  /energy/i,
  /battery/i,
  /signal strength/i,
  /rssi/i,
  /linkquality/i,
  /last seen/i,
  /^(enable|disable|toggle)/i,
];

export function isPrimaryDevice(
  entityId: string, 
  entity: any,
  devices?: Device[] | null,
  allEntities?: Record<string, any>
): boolean {
  const domain = entityId.split('.')[0];
  const friendlyName = entity.attributes?.friendly_name || '';
  const entityName = entityId.split('.')[1];
  
  // Domains that should never show as cards
  const hiddenDomains = ['scene', 'automation', 'script', 'group', 'zone', 'person', 'sun', 'weather', 'event', 'remote'];
  if (hiddenDomains.includes(domain)) {
    return false;
  }
  
  // If we have device registry info, check if this entity belongs to a device
  // and if another entity from the same device is a primary entity
  if (devices && allEntities) {
    const device = getDeviceForEntity(entityId, allEntities, devices);
    if (device) {
      // Check if this device has a camera or other primary entity
      const deviceEntities = Object.entries(allEntities)
        .filter(([_, e]) => (e as any).attributes?.device_id === device.id)
        .map(([id, e]) => ({ id, domain: id.split('.')[0], entity: e }));
      
      // If device has a camera, only the camera should be primary
      const hasCamera = deviceEntities.some(e => e.domain === 'camera');
      if (hasCamera && domain !== 'camera') {
        return false;
      }
      
      // If device has a media player (not from camera), only the media player should be primary
      const hasMediaPlayer = deviceEntities.some(e => 
        e.domain === 'media_player' && 
        !e.id.includes('_camera') && 
        !e.id.includes('_doorbell')
      );
      if (hasMediaPlayer && domain !== 'media_player') {
        return false;
      }
      
      // If this is a switch/sensor that belongs to a device with a primary entity, hide it
      if ((domain === 'switch' || domain === 'sensor' || domain === 'binary_sensor')) {
        const hasPrimaryEntity = deviceEntities.some(e => 
          ['light', 'climate', 'cover', 'lock', 'fan', 'vacuum'].includes(e.domain)
        );
        if (hasPrimaryEntity) {
          return false;
        }
      }
    }
  }
  
  // Only show actual hardware devices
  const hardwareDeviceDomains = ['light', 'switch', 'climate', 'media_player', 'camera', 'lock', 'cover', 'fan', 'vacuum'];
  
  if (hardwareDeviceDomains.includes(domain)) {
    // Filter out automation switches
    if (domain === 'switch' && entityName.includes('automation')) {
      return false;
    }
    
    // Filter out G6 and other camera motion/detection switches
    if (domain === 'switch' && (
        entityName.includes('g6_instant') ||
        entityName.includes('g5_') ||
        entityName.includes('g4_') ||
        entityName.includes('g3_') ||
        entityName.includes('_motion') ||
        entityName.includes('_detected') ||
        entityName.includes('_detections') ||
        friendlyName.toLowerCase().includes('motion') ||
        friendlyName.toLowerCase().includes('detected')
    )) {
      return false;
    }
    
    // Filter out sub-entities even in primary domains
    for (const pattern of SUB_ENTITY_PATTERNS) {
      if (pattern.test(entityId)) {
        return false;
      }
    }
    
    // Check friendly name patterns
    for (const pattern of SUB_ENTITY_NAME_PATTERNS) {
      if (pattern.test(friendlyName)) {
        return false;
      }
    }
    
    // Additional filtering for specific cases
    // Filter out arc/sonos sub-controls
    if (friendlyName.toLowerCase().includes(' arc ') && 
        (friendlyName.toLowerCase().includes('crossfade') || 
         friendlyName.toLowerCase().includes('loudness') ||
         friendlyName.toLowerCase().includes('night sound') ||
         friendlyName.toLowerCase().includes('speech enhancement'))) {
      return false;
    }
    
    // Filter out camera sub-entities
    if (domain === 'camera' && entityName.includes('channel')) {
      return false;
    }
    
    // Filter out media_player entities that are actually camera-related
    if (domain === 'media_player') {
      // Filter out UniFi camera media players
      if (entityName.includes('_camera') || 
          entityName.includes('_doorbell') ||
          entityName.includes('_g4_') ||
          entityName.includes('_g3_') ||
          entityName.includes('_g5_') ||
          entityName.includes('_g6_') ||
          friendlyName.toLowerCase().includes('camera') ||
          friendlyName.toLowerCase().includes('doorbell')) {
        return false;
      }
      
      // Filter out group/zone media players
      if (entityName.includes('_group') || 
          entityName.includes('_zone') ||
          entityName.includes('_all_') ||
          friendlyName.toLowerCase().includes('everywhere') ||
          friendlyName.toLowerCase().includes('all speakers')) {
        return false;
      }
    }
    
    return true;
  }
  
  // For sensors, only show main hardware sensors
  if (domain === 'binary_sensor' || domain === 'sensor') {
    // Must be a standalone sensor device, not a sub-sensor
    const standaloneSensorPatterns = [
      /^motion$/i,
      /^door$/i,
      /^window$/i,
      /^presence$/i,
      /^occupancy$/i,
      /^leak$/i,
      /^smoke$/i,
      /smoke_alarm/i,
      /^carbon_monoxide$/i,
    ];
    
    // Check if it's clearly a sub-entity of another device
    const isSubEntity = SUB_ENTITY_PATTERNS.some(pattern => pattern.test(entityId)) ||
                       SUB_ENTITY_NAME_PATTERNS.some(pattern => pattern.test(friendlyName)) ||
                       entityName.includes('_power') ||
                       entityName.includes('_energy') ||
                       entityName.includes('_battery') ||
                       entityName.includes('_rssi') ||
                       entityName.includes('_temperature') ||
                       entityName.includes('_humidity');
    
    if (isSubEntity) {
      return false;
    }
    
    // Only show if it matches a standalone sensor pattern
    return standaloneSensorPatterns.some(pattern => pattern.test(friendlyName));
  }
  
  // Hide everything else
  return false;
}

export function getRelatedEntities(primaryEntityId: string, allEntities: any): [string, any][] {
  const primaryName = primaryEntityId.split('.')[1]; // Get the base name without domain
  const primaryDevice = allEntities[primaryEntityId];
  const relatedEntities: [string, any][] = [];
  
  // Get the device_id if available - this is the most reliable way
  const deviceId = primaryDevice?.attributes?.device_id;
  
  // For UniFi cameras, extract the base name (e.g., "g4_doorbell_pro" from "g4_doorbell_pro_package")
  let cameraBaseName = primaryName;
  if (primaryName.includes('_channel') || primaryName.includes('_package')) {
    cameraBaseName = primaryName.replace(/_high_resolution_channel.*$/, '')
                               .replace(/_channel.*$/, '')
                               .replace(/_package$/, '');
  }
  
  Object.entries(allEntities).forEach(([entityId, entity]) => {
    if (entityId === primaryEntityId) return; // Skip the primary entity itself
    
    // Method 1: Same device_id (most reliable)
    if (deviceId && (entity as any).attributes?.device_id === deviceId) {
      relatedEntities.push([entityId, entity]);
      return;
    }
    
    // Method 2: For cameras, match detection entities
    const entityBaseName = entityId.split('.')[1];
    
    // Special handling for UniFi camera detection entities
    if (entityBaseName.includes('detections_') || entityBaseName.includes('detected')) {
      // Check if it starts with the camera base name
      if (entityBaseName.startsWith(cameraBaseName + '_') || 
          entityBaseName.startsWith(primaryName.split('_')[0] + '_')) {
        relatedEntities.push([entityId, entity]);
        return;
      }
    }
    
    // Method 3: Exact entity base name match
    if (entityBaseName.startsWith(primaryName + '_') || 
        entityBaseName === primaryName ||
        (cameraBaseName !== primaryName && entityBaseName.startsWith(cameraBaseName + '_'))) {
      relatedEntities.push([entityId, entity]);
      return;
    }
    
    // Method 4: Check if the primary entity name is at the beginning of the other entity
    const regex = new RegExp(`^${cameraBaseName}(_|$)`);
    if (regex.test(entityBaseName)) {
      relatedEntities.push([entityId, entity]);
      return;
    }
  });
  
  // Filter out any entities that are clearly unrelated based on their domain/type
  return relatedEntities.filter(([entityId, _]) => {
    // Remove entities that are primary devices themselves (not sub-entities)
    const domain = entityId.split('.')[0];
    if (['camera', 'media_player', 'climate'].includes(domain) && entityId !== primaryEntityId) {
      return false;
    }
    return true;
  });
}

export function filterPrimaryDevices(
  entities: [string, any][],
  devices?: Device[] | null,
  allEntities?: Record<string, any>
): [string, any][] {
  return entities.filter(([entityId, entity]) => {
    // If we have device registry info, use it for better filtering
    if (devices && allEntities) {
      const device = getDeviceForEntity(entityId, allEntities, devices);
      if (device) {
        // Filter out UniFi Protect camera speakers/media players
        if (device.manufacturer?.toLowerCase().includes('ubiquiti') ||
            device.manufacturer?.toLowerCase().includes('unifi')) {
          const domain = entityId.split('.')[0];
          if (domain === 'media_player') return false;
        }
      }
    }
    
    return isPrimaryDevice(entityId, entity, devices, allEntities);
  });
}