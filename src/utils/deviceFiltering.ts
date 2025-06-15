// Utility functions for filtering out sub-entities and identifying primary devices
import { getDeviceForEntity, type Device } from './deviceRegistry';
import { isCameraDetectionEntity, isCameraSubEntity } from './cameraDetectionHelpers';
import { getDeviceTypeConfig } from '../config/deviceTypes';

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
  // /_motion$/i,  // Commented out - this might filter legitimate motion sensors
  /_none$/i,
  
  // Sensor suffixes that indicate sub-entities (very specific to avoid filtering real devices)
  /_(rssi|linkquality|last_seen|update_available)$/i,
  // Temporarily commented to be less restrictive
  // /_(wifi_signal|connectivity|reachable)$/i,
  
  // Media player sub-entities
  /_(source|volume|shuffle|repeat|play_mode|sound_mode)$/i,
  /_(bass|treble|balance|loudness|night_sound|speech_enhancement)$/i,
  /_(subwoofer|surround|full_volume)_enabled$/i,
  
  // Device info entities
  /_(firmware|software|hardware)_version$/i,
  /_(ip_address|mac_address)$/i,  // Removed wifi_signal as it was duplicate
  
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
  /firmware\s+version/i,
  /connectivity$/i,
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
  
  // For Tesla Wall Connector, only show the status entity as primary
  if (entityId.toLowerCase().includes('tesla_wall_connector') || 
      entityId.toLowerCase().includes('wall_connector') ||
      friendlyName.toLowerCase().includes('tesla wall connector') ||
      friendlyName.toLowerCase().includes('wall connector')) {
    
    // Only show the status entity as the main card
    if (entityId.endsWith('_status')) {
      console.log(`[DEBUG] SHOWING primary Tesla status entity: ${entityId}`);
      return true;
    }
    
    console.log(`[DEBUG] HIDING secondary Tesla entity: ${entityId}`);
    return false;
  }
  
  // DEBUG: Log sensor entities to see what's being filtered
  if (domain === 'sensor' || domain === 'binary_sensor') {
    if (entityId.toLowerCase().includes('tesla') || friendlyName.toLowerCase().includes('tesla') ||
        entityId.toLowerCase().includes('wall_connector') || friendlyName.toLowerCase().includes('wall connector')) {
      const device = devices ? getDeviceForEntity(entityId, allEntities || {}, devices) : null;
      console.log(`[DEBUG] Checking Tesla sensor: ${entityId} (${friendlyName})`, {
        domain,
        entityName,
        device: device?.name || 'No device',
        willBeFiltered: false // We'll update this as we go
      });
    }
  }
  
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
      // Check if this device has a specific device type configuration
      const deviceTypeConfig = getDeviceTypeConfig(device, allEntities, entityId);
      if (deviceTypeConfig) {
        // Check if this entity is one of the primary domains for this device type
        const isPrimaryDomain = deviceTypeConfig.capabilities.domains.includes(domain);
        if (!isPrimaryDomain) {
          console.log(`[DEBUG] ${entityId} filtered - not primary domain for device type ${deviceTypeConfig.name}`);
          return false;
        }
        
        console.log(`[DEBUG] ${entityId} is primary domain for device type ${deviceTypeConfig.name}`);
        // For recognized device types, show the primary entity
        return true;
      }
      
      // For sensors, we want to show them even if the device has other entity types
      // Only filter out sub-entity sensors (those matching patterns)
      if (domain === 'sensor' || domain === 'binary_sensor') {
        // Don't filter sensors based on presence of other entity types
        // Let them through to be checked by sub-entity patterns later
        console.log(`[DEBUG] ${entityId} is sensor - skipping device entity filtering`);
      } else {
        // Check if this device has a camera or other primary entity
        const deviceEntities = Object.entries(allEntities)
          .filter(([_, e]) => (e as any).attributes?.device_id === device.id)
          .map(([id, e]) => ({ id, domain: id.split('.')[0], entity: e }));
        
        // If device has a camera, only the camera should be primary (non-sensor)
        const hasCamera = deviceEntities.some(e => e.domain === 'camera');
        if (hasCamera && domain !== 'camera') {
          console.log(`[DEBUG] ${entityId} filtered - device has camera`);
          return false;
        }
        
        // If device has a media player (not from camera), only the media player should be primary (non-sensor)
        const hasMediaPlayer = deviceEntities.some(e => 
          e.domain === 'media_player' && 
          !e.id.includes('_camera') && 
          !e.id.includes('_doorbell')
        );
        if (hasMediaPlayer && domain !== 'media_player') {
          console.log(`[DEBUG] ${entityId} filtered - device has media player`);
          return false;
        }
      }
      
      // Special handling for switches that are clearly sub-entities
      if (domain === 'switch' && 
          (entityName.includes('_led') || 
           entityName.includes('_indicator') || 
           entityName.includes('_child_lock'))) {
        console.log(`[DEBUG] ${entityId} filtered - sub-entity switch`);
        return false;
      }
    }
  }
  
  // Show actual hardware devices and important sensors
  // Include sensor and binary_sensor explicitly
  const primaryDeviceDomains = ['light', 'switch', 'climate', 'media_player', 'camera', 'lock', 'cover', 'fan', 'vacuum', 'sensor', 'binary_sensor'];
  
  if (primaryDeviceDomains.includes(domain)) {
    console.log(`[DEBUG] Evaluating ${domain}: ${entityId}`);
    
    // Check if this has a recognized device type configuration - ALWAYS show these
    if (devices && allEntities) {
      const device = getDeviceForEntity(entityId, allEntities, devices);
      const deviceTypeConfig = getDeviceTypeConfig(device, allEntities, entityId);
      if (deviceTypeConfig) {
        console.log(`[DEBUG] ${entityId} is recognized device type: ${deviceTypeConfig.name} - ALWAYS SHOW`);
        return true;
      }
    }
    
    // Also check without device registry for entities that might not have device info
    const deviceTypeConfig = getDeviceTypeConfig(null, allEntities || { [entityId]: entity }, entityId);
    if (deviceTypeConfig && (deviceTypeConfig.id === 'ev_charger' || deviceTypeConfig.id === 'nas')) {
      console.log(`[DEBUG] ${entityId} matched device type pattern: ${deviceTypeConfig.name} - ALWAYS SHOW`);
      return true;
    }
    
    // Check if this is a Tesla or Synology device - always show these
    if (domain === 'switch' || domain === 'sensor') {
      const lowerEntityId = entityId.toLowerCase();
      const lowerName = friendlyName.toLowerCase();
      if (lowerEntityId.includes('tesla') || lowerName.includes('tesla') ||
          lowerEntityId.includes('synology') || lowerName.includes('synology') ||
          lowerEntityId.includes('diskstation') || lowerName.includes('diskstation') ||
          lowerEntityId.includes('wall_connector') || lowerName.includes('wall connector') ||
          lowerEntityId.includes('wall connector') || lowerName.includes('wallconnector') ||
          lowerEntityId.includes('charger') || lowerName.includes('charger')) {
        console.log(`[DEBUG] ${entityId} is Tesla/Synology/Charger device (${domain}) - showing`);
        return true;
      }
    }
    
    // Filter out automation switches
    if (domain === 'switch' && entityName.includes('automation')) {
      return false;
    }
    
    // Filter out camera detection entities using improved detection logic
    const device = devices ? getDeviceForEntity(entityId, allEntities || {}, devices) : null;
    if (isCameraDetectionEntity(entityId, entity, device) || isCameraSubEntity(entityId)) {
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
  
  // For sensors, show all primary sensor devices
  if (domain === 'binary_sensor' || domain === 'sensor') {
    console.log(`[DEBUG] Evaluating sensor: ${entityId}`);
    
    // ALWAYS show Tesla Wall Connector entities
    if (entityId.toLowerCase().includes('tesla_wall_connector') || 
        entityId.toLowerCase().includes('wall_connector') ||
        friendlyName.toLowerCase().includes('tesla wall connector') ||
        friendlyName.toLowerCase().includes('wall connector')) {
      console.log(`[DEBUG] ${entityId} is Tesla Wall Connector - FORCE SHOW`);
      return true;
    }
    
    // Check if this has a recognized device type configuration - ALWAYS show these
    if (devices && allEntities) {
      const device = getDeviceForEntity(entityId, allEntities, devices);
      const deviceTypeConfig = getDeviceTypeConfig(device, allEntities, entityId);
      if (deviceTypeConfig) {
        console.log(`[DEBUG] ${entityId} is recognized device type: ${deviceTypeConfig.name} - ALWAYS SHOW`);
        return true;
      }
    }
    
    // Check if this is a Tesla or Synology device - always show these
    const lowerEntityId = entityId.toLowerCase();
    const lowerName = friendlyName.toLowerCase();
    if (lowerEntityId.includes('tesla') || lowerName.includes('tesla') ||
        lowerEntityId.includes('synology') || lowerName.includes('synology') ||
        lowerEntityId.includes('diskstation') || lowerName.includes('diskstation') ||
        lowerEntityId.includes('wall_connector') || lowerName.includes('wall connector') ||
        lowerEntityId.includes('wall connector') || lowerName.includes('wallconnector') ||
        lowerEntityId.includes('charger') || lowerName.includes('charger')) {
      console.log(`[DEBUG] ${entityId} is Tesla/Synology/Charger device - showing`);
      return true;
    }
    
    // First check if it's clearly a sub-entity - these should always be filtered
    const isSubEntity = SUB_ENTITY_PATTERNS.some(pattern => {
      const matches = pattern.test(entityId);
      if (matches) {
        console.log(`[DEBUG] Sensor ${entityId} matches sub-entity pattern: ${pattern}`);
      }
      return matches;
    });
    
    if (isSubEntity) {
      console.log(`[DEBUG] Sensor ${entityId} filtered as sub-entity`);
      return false;
    }
    
    // Check if this is a primary energy monitoring or special device
    if (devices && allEntities) {
      const device = getDeviceForEntity(entityId, allEntities || {}, devices || null);
      if (device) {
        console.log(`[DEBUG] Sensor ${entityId} has device:`, device?.name || 'Unknown', device?.manufacturer || 'Unknown', device?.model || 'Unknown');
        const deviceTypeConfig = getDeviceTypeConfig(device, allEntities || {}, entityId);
        if (deviceTypeConfig) {
          console.log(`[DEBUG] Sensor ${entityId} matched device type: ${deviceTypeConfig?.name || 'Unknown'}`);
          // This is a recognized device type, show it
          return true;
        }
        
        // Even if no device type config, if it's not a sub-entity and is a sensor, show it
        console.log(`[DEBUG] Sensor ${entityId} has device but no type config - showing anyway`);
        return true;
      }
    }
    
    // No device association, but it's a sensor that's not a sub-entity - show it
    console.log(`[DEBUG] Sensor ${entityId} has no device - showing as standalone sensor`);
    // Show primary sensors that don't match sub-entity patterns
    return true;
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