// Utility functions for working with Home Assistant device registry

export interface Device {
  id: string;
  area_id: string | null;
  configuration_url: string | null;
  connections: Array<[string, string]>;
  disabled_by: string | null;
  entry_type: string | null;
  hw_version: string | null;
  identifiers: Array<[string, string]>;
  manufacturer: string | null;
  model: string | null;
  name: string | null;
  name_by_user: string | null;
  serial_number: string | null;
  sw_version: string | null;
  via_device_id: string | null;
}

export interface Area {
  area_id: string;
  name: string;
  picture: string | null;
  aliases: string[];
}

// Get device info for an entity
export function getDeviceForEntity(
  entityId: string,
  entities: Record<string, any>,
  devices: Device[] | null
): Device | null {
  if (!devices || !entities) return null;
  
  const entity = entities[entityId];
  if (!entity?.attributes?.device_id) return null;
  
  return devices.find(device => device.id === entity.attributes.device_id) || null;
}

// Get all entities for a device
export function getEntitiesForDevice(
  deviceId: string,
  entities: Record<string, any>
): [string, any][] {
  if (!entities) return [];
  
  return Object.entries(entities).filter(([_, entity]) => 
    entity.attributes?.device_id === deviceId
  );
}

// Get device capabilities based on its entities
export function getDeviceCapabilities(
  device: Device,
  entities: Record<string, any>
): {
  domains: string[];
  features: string[];
  hasMediaPlayer: boolean;
  hasCamera: boolean;
  hasSensors: boolean;
  hasControls: boolean;
} {
  const deviceEntities = getEntitiesForDevice(device.id, entities);
  const domains = new Set<string>();
  const features = new Set<string>();
  
  let hasMediaPlayer = false;
  let hasCamera = false;
  let hasSensors = false;
  let hasControls = false;
  
  deviceEntities.forEach(([entityId, entity]) => {
    const domain = entityId.split('.')[0];
    domains.add(domain);
    
    // Check for specific capabilities
    if (domain === 'media_player') hasMediaPlayer = true;
    if (domain === 'camera') hasCamera = true;
    if (['sensor', 'binary_sensor'].includes(domain)) hasSensors = true;
    if (['switch', 'light', 'cover', 'climate', 'fan'].includes(domain)) hasControls = true;
    
    // Extract features from supported_features for media players
    if (domain === 'media_player' && entity.attributes?.supported_features) {
      const supportedFeatures = entity.attributes.supported_features;
      if (supportedFeatures & 1) features.add('pause');
      if (supportedFeatures & 2) features.add('seek');
      if (supportedFeatures & 4) features.add('volume_set');
      if (supportedFeatures & 8) features.add('volume_mute');
      if (supportedFeatures & 16) features.add('previous_track');
      if (supportedFeatures & 32) features.add('next_track');
      if (supportedFeatures & 64) features.add('turn_on');
      if (supportedFeatures & 128) features.add('turn_off');
      if (supportedFeatures & 256) features.add('play_media');
      if (supportedFeatures & 512) features.add('volume_step');
      if (supportedFeatures & 1024) features.add('select_source');
      if (supportedFeatures & 2048) features.add('stop');
      if (supportedFeatures & 4096) features.add('clear_playlist');
      if (supportedFeatures & 8192) features.add('play');
      if (supportedFeatures & 16384) features.add('shuffle_set');
      if (supportedFeatures & 32768) features.add('select_sound_mode');
    }
  });
  
  return {
    domains: Array.from(domains),
    features: Array.from(features),
    hasMediaPlayer,
    hasCamera,
    hasSensors,
    hasControls,
  };
}

// Enhanced device type detection using registry info
export function getDeviceType(device: Device, entities: Record<string, any>): string {
  const capabilities = getDeviceCapabilities(device, entities);
  const model = (device.model || '').toLowerCase();
  const manufacturer = (device.manufacturer || '').toLowerCase();
  const name = (device.name || '').toLowerCase();
  
  // Camera devices
  if (capabilities.hasCamera || model.includes('camera') || name.includes('camera')) {
    if (model.includes('doorbell') || name.includes('doorbell')) return 'doorbell';
    return 'camera';
  }
  
  // Media devices
  if (capabilities.hasMediaPlayer) {
    if (model.includes('tv') || name.includes('tv') || 
        manufacturer.includes('samsung') || manufacturer.includes('lg') ||
        manufacturer.includes('sony') || manufacturer.includes('vizio')) {
      return 'tv';
    }
    if (model.includes('soundbar') || name.includes('soundbar')) return 'soundbar';
    if (manufacturer.includes('sonos') || manufacturer.includes('bose')) return 'speaker';
    if (model.includes('chromecast')) return 'streaming';
    if (model.includes('echo') || manufacturer.includes('amazon')) return 'smart_speaker';
    if (manufacturer.includes('apple') && model.includes('homepod')) return 'smart_speaker';
    return 'media_player';
  }
  
  // Climate devices
  if (capabilities.domains.includes('climate')) {
    if (model.includes('thermostat') || name.includes('thermostat')) return 'thermostat';
    if (model.includes('ac') || name.includes('ac')) return 'air_conditioner';
    return 'climate';
  }
  
  // Lighting
  if (capabilities.domains.includes('light')) {
    if (model.includes('strip') || name.includes('strip')) return 'light_strip';
    if (model.includes('bulb') || name.includes('bulb')) return 'light_bulb';
    return 'light';
  }
  
  // Security
  if (model.includes('lock') || name.includes('lock')) return 'lock';
  if (model.includes('alarm') || name.includes('alarm')) return 'alarm';
  
  // Sensors
  if (capabilities.hasSensors && !capabilities.hasControls) {
    if (model.includes('motion') || name.includes('motion')) return 'motion_sensor';
    if (model.includes('door') || name.includes('door')) return 'door_sensor';
    if (model.includes('window') || name.includes('window')) return 'window_sensor';
    if (model.includes('temperature') || name.includes('temperature')) return 'temperature_sensor';
    if (model.includes('humidity') || name.includes('humidity')) return 'humidity_sensor';
    return 'sensor';
  }
  
  // Switches and outlets
  if (capabilities.domains.includes('switch')) {
    if (model.includes('outlet') || name.includes('outlet') || model.includes('plug')) return 'outlet';
    return 'switch';
  }
  
  return 'unknown';
}

// Get primary entity for a device (the most important/interactive one)
export function getPrimaryEntityForDevice(
  device: Device,
  entities: Record<string, any>
): [string, any] | null {
  const deviceEntities = getEntitiesForDevice(device.id, entities);
  if (deviceEntities.length === 0) return null;
  
  // Priority order for primary entity
  const priorityDomains = [
    'light',
    'switch',
    'climate',
    'cover',
    'media_player',
    'lock',
    'fan',
    'camera',
    'sensor',
    'binary_sensor'
  ];
  
  // Sort entities by domain priority
  const sortedEntities = deviceEntities.sort(([aId], [bId]) => {
    const aDomain = aId.split('.')[0];
    const bDomain = bId.split('.')[0];
    const aPriority = priorityDomains.indexOf(aDomain);
    const bPriority = priorityDomains.indexOf(bDomain);
    
    if (aPriority === -1 && bPriority === -1) return 0;
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    
    return aPriority - bPriority;
  });
  
  return sortedEntities[0] || null;
}

// Group entities by their device
export function groupEntitiesByDevice(
  entities: Record<string, any>,
  devices: Device[] | null
): Map<Device | null, [string, any][]> {
  const deviceMap = new Map<Device | null, [string, any][]>();
  
  // Initialize map with all devices
  if (devices) {
    devices.forEach(device => {
      deviceMap.set(device, []);
    });
  }
  
  // Add null key for entities without devices
  deviceMap.set(null, []);
  
  // Group entities
  Object.entries(entities).forEach(([entityId, entity]) => {
    const device = devices?.find(d => d.id === entity.attributes?.device_id) || null;
    const existingEntities = deviceMap.get(device) || [];
    deviceMap.set(device, [...existingEntities, [entityId, entity]]);
  });
  
  return deviceMap;
}