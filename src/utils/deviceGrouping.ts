// Group entities by their parent device for simplified device selection
import { getDeviceForEntity } from './deviceRegistry';
import { getDeviceTypeConfig } from '../config/deviceTypes';
import { isPrimaryDevice } from './deviceFiltering';

export interface GroupedDevice {
  deviceId: string;
  deviceName: string;
  manufacturer?: string;
  model?: string;
  deviceType?: string;
  primaryEntity: {
    entityId: string;
    entity: any;
  };
  entities: Array<{
    entityId: string;
    entity: any;
    domain: string;
  }>;
}

export function groupEntitiesByDevice(
  entities: Record<string, any>,
  devices: any[] | null
): GroupedDevice[] {
  if (!entities || !devices) return [];

  const deviceMap = new Map<string, GroupedDevice>();
  const standaloneEntities: GroupedDevice[] = [];

  // First, identify Tesla Wall Connector entities and group them manually
  const teslaEntities = Object.entries(entities).filter(([id]) => 
    id.toLowerCase().includes('tesla_wall_connector')
  );
  
  if (teslaEntities.length > 0) {
    console.log(`[DEBUG] Found ${teslaEntities.length} Tesla Wall Connector entities`);
    
    // Create a pseudo-device for Tesla Wall Connector
    const teslaDevice: GroupedDevice = {
      deviceId: 'tesla_wall_connector_group',
      deviceName: 'Tesla Wall Connector',
      manufacturer: 'Tesla',
      model: 'Wall Connector',
      deviceType: 'EV Charger',
      primaryEntity: {
        entityId: teslaEntities[0][0],
        entity: teslaEntities[0][1]
      },
      entities: teslaEntities.map(([entityId, entity]) => ({
        entityId,
        entity,
        domain: entityId.split('.')[0]
      }))
    };
    
    // Find the switch entity as primary if exists
    const switchEntity = teslaEntities.find(([id]) => id.startsWith('switch.'));
    if (switchEntity) {
      teslaDevice.primaryEntity = {
        entityId: switchEntity[0],
        entity: switchEntity[1]
      };
    }
    
    deviceMap.set('tesla_wall_connector_group', teslaDevice);
  }
  
  // First pass: group entities by their device
  Object.entries(entities).forEach(([entityId, entity]) => {
    // Skip Tesla entities as they're already grouped
    if (entityId.toLowerCase().includes('tesla_wall_connector')) {
      return;
    }
    
    const device = getDeviceForEntity(entityId, entities, devices);
    
    if (device) {
      const deviceId = device.id;
      
      if (!deviceMap.has(deviceId)) {
        const deviceTypeConfig = getDeviceTypeConfig(device, entities, entityId);
        
        console.log(`[DEBUG] Creating device group for ${device.name} with type: ${deviceTypeConfig?.name || 'none'}`);
        
        deviceMap.set(deviceId, {
          deviceId,
          deviceName: device.name || 'Unknown Device',
          manufacturer: device.manufacturer || undefined,
          model: device.model || undefined,
          deviceType: deviceTypeConfig?.name,
          primaryEntity: {
            entityId,
            entity
          },
          entities: []
        });
      }
      
      const groupedDevice = deviceMap.get(deviceId)!;
      
      // For recognized device types, include ALL entities
      // For others, only include primary entities
      if (groupedDevice.deviceType || isPrimaryDevice(entityId, entity, devices, entities)) {
        groupedDevice.entities.push({
          entityId,
          entity,
          domain: entityId.split('.')[0]
        });
      }
      
      // Update primary entity based on device type config
      const deviceTypeConfig = getDeviceTypeConfig(device, entities, entityId);
      if (deviceTypeConfig && deviceTypeConfig.capabilities.domains.includes(entityId.split('.')[0])) {
        // For EV chargers, prefer entities in this order: switch, sensor, binary_sensor
        if (deviceTypeConfig.id === 'ev_charger') {
          const currentDomain = entityId.split('.')[0];
          const currentPrimaryDomain = groupedDevice.primaryEntity.entityId.split('.')[0];
          
          // Prefer switch > sensor > binary_sensor
          const domainPriority: Record<string, number> = { 'switch': 1, 'sensor': 2, 'binary_sensor': 3 };
          const currentPriority = domainPriority[currentDomain] || 99;
          const primaryPriority = domainPriority[currentPrimaryDomain] || 99;
          
          if (currentPriority < primaryPriority) {
            groupedDevice.primaryEntity = { entityId, entity };
          }
        } else if (deviceTypeConfig.id === 'nas' && entityId.split('.')[0] === 'sensor') {
          groupedDevice.primaryEntity = { entityId, entity };
        } else if (!groupedDevice.primaryEntity || 
                   entityId.split('.')[0] === deviceTypeConfig.capabilities.domains[0]) {
          groupedDevice.primaryEntity = { entityId, entity };
        }
      }
    } else {
      // Standalone entity without a device
      if (isPrimaryDevice(entityId, entity, devices, entities)) {
        standaloneEntities.push({
          deviceId: entityId,
          deviceName: entity.attributes?.friendly_name || entityId,
          primaryEntity: {
            entityId,
            entity
          },
          entities: [{
            entityId,
            entity,
            domain: entityId.split('.')[0]
          }]
        });
      }
    }
  });

  // Convert map to array and combine with standalone entities
  const groupedDevices = Array.from(deviceMap.values());
  
  // For devices with a recognized device type, include ALL entities
  // For other devices, filter to only include those with primary entities
  const filteredDevices = groupedDevices.filter(device => {
    // If this device has a recognized type (EV Charger, NAS, etc), include it
    if (device.deviceType) {
      console.log(`[DEBUG] Including device ${device.deviceName} because it has device type: ${device.deviceType}`);
      return true;
    }
    
    // Otherwise, check if it has at least one primary entity
    return device.entities.some(({ entityId, entity }) => 
      isPrimaryDevice(entityId, entity, devices, entities)
    );
  });

  return [...filteredDevices, ...standaloneEntities].sort((a, b) => 
    a.deviceName.localeCompare(b.deviceName)
  );
}

export function getDeviceDisplayInfo(device: GroupedDevice): {
  name: string;
  description: string;
  icon?: string;
} {
  let name = device.deviceName;
  let description = '';

  // Special handling for known device types
  if (device.deviceType) {
    name = device.deviceName;
    description = device.deviceType;
  } else {
    // Generic description based on domains
    const domains = [...new Set(device.entities.map(e => e.domain))];
    description = domains.map(d => {
      switch (d) {
        case 'switch': return 'Switch';
        case 'sensor': return 'Sensor';
        case 'binary_sensor': return 'Binary Sensor';
        case 'light': return 'Light';
        case 'climate': return 'Climate';
        case 'camera': return 'Camera';
        case 'media_player': return 'Media Player';
        case 'lock': return 'Lock';
        case 'cover': return 'Cover';
        case 'fan': return 'Fan';
        case 'vacuum': return 'Vacuum';
        default: return d;
      }
    }).join(', ');
  }

  if (device.manufacturer) {
    description += ` • ${device.manufacturer}`;
  }

  return { name, description };
}