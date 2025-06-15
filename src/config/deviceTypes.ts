// Configuration for various device types with their characteristics and display properties

import { 
  Zap, Battery, Server, Car, 
  Wifi, Shield, Power, Gauge, BarChart3
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DeviceTypeConfig {
  id: string;
  name: string;
  category: 'energy' | 'climate' | 'security' | 'media' | 'lighting' | 'control' | 'sensor' | 'computing' | 'transport';
  icon: LucideIcon;
  primaryColor: string;
  secondaryColor: string;
  // Patterns to match this device type
  patterns: {
    model?: RegExp[];
    manufacturer?: RegExp[];
    name?: RegExp[];
    entityId?: RegExp[];
    attributes?: { key: string; pattern: RegExp }[];
  };
  // What capabilities this device type typically has
  capabilities: {
    domains: string[];
    features?: string[];
    requiredAttributes?: string[];
  };
  // Display configuration
  display: {
    showState: boolean;
    showPower?: boolean;
    showEnergy?: boolean;
    showStatus?: boolean;
    primaryMetric?: string;
    secondaryMetrics?: string[];
    actions?: Array<{
      id: string;
      label: string;
      service: string;
      icon?: LucideIcon;
    }>;
  };
}

export const deviceTypeConfigs: DeviceTypeConfig[] = [
  // Energy Monitoring Devices
  {
    id: 'energy_monitor',
    name: 'Energy Monitor',
    category: 'energy',
    icon: BarChart3,
    primaryColor: 'text-yellow-400',
    secondaryColor: 'bg-yellow-500',
    patterns: {
      model: [/energy.*monitor/i, /power.*monitor/i, /electricity.*monitor/i],
      manufacturer: [/shelly/i, /sonoff/i, /tp-link/i, /kasa/i, /emporia/i, /sense/i],
      name: [/energy/i, /power.*monitor/i, /electricity/i],
      entityId: [/_energy$/i, /_power$/i, /_consumption$/i, /_current$/i, /_voltage$/i, /_kwh$/i],
      attributes: [
        { key: 'device_class', pattern: /^(power|energy)$/i }
      ]
    },
    capabilities: {
      domains: ['sensor'],
      features: ['power_measurement', 'energy_tracking'],
      requiredAttributes: ['unit_of_measurement']
    },
    display: {
      showState: true,
      showPower: true,
      showEnergy: true,
      primaryMetric: 'power',
      secondaryMetrics: ['energy_today', 'energy_total', 'cost'],
    }
  },

  // Smart Plug with Energy Monitoring
  {
    id: 'smart_plug_energy',
    name: 'Smart Plug',
    category: 'energy',
    icon: Power,
    primaryColor: 'text-green-400',
    secondaryColor: 'bg-green-500',
    patterns: {
      model: [/smart.*plug/i, /wifi.*plug/i, /outlet/i],
      manufacturer: [/tp-link/i, /kasa/i, /wemo/i, /meross/i],
      name: [/plug/i, /outlet/i],
      entityId: [/_plug$/i, /_outlet$/i]
    },
    capabilities: {
      domains: ['switch', 'sensor'],
      features: ['power_control', 'power_measurement', 'energy_tracking']
    },
    display: {
      showState: true,
      showPower: true,
      showEnergy: true,
      actions: [
        { id: 'toggle', label: 'Toggle', service: 'toggle' }
      ]
    }
  },

  // NAS Devices
  {
    id: 'nas',
    name: 'NAS',
    category: 'computing',
    icon: Server,
    primaryColor: 'text-blue-400',
    secondaryColor: 'bg-blue-500',
    patterns: {
      model: [/nas/i, /synology/i, /qnap/i, /diskstation/i],
      manufacturer: [/synology/i, /qnap/i, /western.*digital/i, /wd/i, /asustor/i, /terramaster/i],
      name: [/nas/i, /network.*storage/i, /diskstation/i, /backup/i],
      entityId: [/_nas$/i, /_nas_/i, /synology/i, /qnap/i, /diskstation/i, /backup/i]
    },
    capabilities: {
      domains: ['sensor', 'binary_sensor', 'switch'],
      features: ['storage_monitoring', 'temperature_monitoring', 'network_monitoring']
    },
    display: {
      showState: true,
      showStatus: true,
      primaryMetric: 'disk_usage',
      secondaryMetrics: ['temperature', 'network_speed', 'uptime', 'cpu_usage', 'memory_usage'],
    }
  },

  // EV Chargers
  {
    id: 'ev_charger',
    name: 'EV Charger',
    category: 'transport',
    icon: Car,
    primaryColor: 'text-green-400',
    secondaryColor: 'bg-green-500',
    patterns: {
      model: [/chargepoint/i, /wallbox/i, /tesla.*wall/i, /juicebox/i, /grizzl-e/i, /easee/i],
      manufacturer: [/chargepoint/i, /wallbox/i, /tesla/i, /juicenet/i, /grizzl-e/i, /easee/i, /siemens/i],
      name: [/ev.*charger/i, /car.*charger/i, /vehicle.*charger/i, /charging.*station/i],
      entityId: [/_charger$/i, /_evse$/i, /chargepoint/i, /wallbox/i, /_ev_/i, /tesla.*wall/i, /juicebox/i]
    },
    capabilities: {
      domains: ['sensor', 'switch', 'number'],
      features: ['charging_control', 'power_measurement', 'current_adjustment', 'scheduling'],
      requiredAttributes: ['max_current', 'charging_status']
    },
    display: {
      showState: true,
      showPower: true,
      showStatus: true,
      primaryMetric: 'charging_power',
      secondaryMetrics: ['energy_delivered', 'charging_time', 'max_current', 'vehicle_connected'],
      actions: [
        { id: 'start_charging', label: 'Start', service: 'start_charging' },
        { id: 'stop_charging', label: 'Stop', service: 'stop_charging' }
      ]
    }
  },

  // Solar Inverters
  {
    id: 'solar_inverter',
    name: 'Solar Inverter',
    category: 'energy',
    icon: Zap,
    primaryColor: 'text-yellow-400',
    secondaryColor: 'bg-yellow-500',
    patterns: {
      model: [/inverter/i, /solar/i, /enphase/i, /solaredge/i, /fronius/i, /sma/i],
      manufacturer: [/enphase/i, /solaredge/i, /fronius/i, /sma/i, /growatt/i, /goodwe/i],
      name: [/solar/i, /inverter/i, /pv/i, /photovoltaic/i],
      entityId: [/_solar$/i, /_inverter$/i, /_pv$/i]
    },
    capabilities: {
      domains: ['sensor'],
      features: ['power_generation', 'energy_tracking', 'efficiency_monitoring']
    },
    display: {
      showState: true,
      showPower: true,
      showEnergy: true,
      primaryMetric: 'current_power',
      secondaryMetrics: ['energy_today', 'energy_total', 'efficiency', 'grid_frequency'],
    }
  },

  // Battery Storage
  {
    id: 'battery_storage',
    name: 'Battery Storage',
    category: 'energy',
    icon: Battery,
    primaryColor: 'text-green-400',
    secondaryColor: 'bg-green-500',
    patterns: {
      model: [/powerwall/i, /battery/i, /storage/i],
      manufacturer: [/tesla/i, /lg/i, /sonnen/i, /enphase/i],
      name: [/battery/i, /powerwall/i, /storage/i],
      entityId: [/_battery$/i, /_storage$/i, /powerwall/i]
    },
    capabilities: {
      domains: ['sensor', 'switch'],
      features: ['charge_control', 'discharge_control', 'capacity_monitoring']
    },
    display: {
      showState: true,
      showStatus: true,
      primaryMetric: 'battery_level',
      secondaryMetrics: ['power_flow', 'energy_stored', 'cycles', 'temperature'],
      actions: [
        { id: 'charge', label: 'Charge', service: 'charge' },
        { id: 'discharge', label: 'Discharge', service: 'discharge' }
      ]
    }
  },

  // Smart Meters
  {
    id: 'smart_meter',
    name: 'Smart Meter',
    category: 'energy',
    icon: Gauge,
    primaryColor: 'text-blue-400',
    secondaryColor: 'bg-blue-500',
    patterns: {
      model: [/meter/i, /utility/i],
      manufacturer: [/landis/i, /itron/i, /schneider/i],
      name: [/meter/i, /utility/i, /grid/i],
      entityId: [/_meter$/i, /_grid$/i, /_utility$/i]
    },
    capabilities: {
      domains: ['sensor'],
      features: ['consumption_monitoring', 'tariff_tracking', 'peak_detection']
    },
    display: {
      showState: true,
      showPower: true,
      showEnergy: true,
      primaryMetric: 'current_consumption',
      secondaryMetrics: ['daily_consumption', 'monthly_consumption', 'current_tariff', 'peak_demand'],
    }
  },

  // UPS Devices
  {
    id: 'ups',
    name: 'UPS',
    category: 'energy',
    icon: Shield,
    primaryColor: 'text-orange-400',
    secondaryColor: 'bg-orange-500',
    patterns: {
      model: [/ups/i, /uninterruptible/i],
      manufacturer: [/apc/i, /cyberpower/i, /eaton/i, /tripplite/i],
      name: [/ups/i, /battery.*backup/i, /uninterruptible/i],
      entityId: [/_ups$/i, /_ups_/i]
    },
    capabilities: {
      domains: ['sensor', 'binary_sensor'],
      features: ['battery_monitoring', 'load_monitoring', 'runtime_estimation']
    },
    display: {
      showState: true,
      showStatus: true,
      primaryMetric: 'battery_charge',
      secondaryMetrics: ['load_percentage', 'runtime_remaining', 'input_voltage', 'output_voltage'],
    }
  },

  // Network Equipment
  {
    id: 'network_device',
    name: 'Network Device',
    category: 'computing',
    icon: Wifi,
    primaryColor: 'text-cyan-400',
    secondaryColor: 'bg-cyan-500',
    patterns: {
      model: [/router/i, /switch/i, /access.*point/i, /ap/i],
      manufacturer: [/ubiquiti/i, /unifi/i, /cisco/i, /netgear/i, /asus/i, /tp-link/i],
      name: [/router/i, /switch/i, /access.*point/i, /network/i],
      entityId: [/_router$/i, /_switch$/i, /_ap$/i]
    },
    capabilities: {
      domains: ['sensor', 'binary_sensor', 'switch'],
      features: ['bandwidth_monitoring', 'client_tracking', 'uptime_monitoring']
    },
    display: {
      showState: true,
      showStatus: true,
      primaryMetric: 'clients_connected',
      secondaryMetrics: ['bandwidth_usage', 'uptime', 'cpu_usage', 'memory_usage'],
    }
  }
];

// Helper function to find the best matching device type for a device or entity
export function getDeviceTypeConfig(
  device: any | null,
  entities: Record<string, any>,
  entityId?: string
): DeviceTypeConfig | null {
  const entity = entityId ? entities[entityId] : null;
  
  // If we have a device, use its properties
  const model = (device?.model || '').toLowerCase();
  const manufacturer = (device?.manufacturer || '').toLowerCase();
  const deviceName = (device?.name || '').toLowerCase();
  
  // Also check entity properties as fallback
  const entityName = (entity?.attributes?.friendly_name || entityId || '').toLowerCase();
  
  // DEBUG: Log device info for sensors
  if (entityId && (entityId.startsWith('sensor.') || entityId.startsWith('binary_sensor.'))) {
    console.log(`[DEBUG] getDeviceTypeConfig for ${entityId}:`, {
      model,
      manufacturer,
      deviceName,
      entityName,
      hasDevice: !!device
    });
  }
  
  // Check if entity has explicit device_type attribute
  if (entity?.attributes?.device_type) {
    const matchingConfig = deviceTypeConfigs.find(config => config.id === entity.attributes.device_type);
    if (matchingConfig) {
      return matchingConfig;
    }
  }
  
  // Score each device type based on pattern matches
  const scores = deviceTypeConfigs.map(config => {
    let score = 0;
    
    // Check model patterns
    if (model && config.patterns.model) {
      score += config.patterns.model.filter(pattern => pattern.test(model)).length * 3;
    }
    
    // Check manufacturer patterns
    if (manufacturer && config.patterns.manufacturer) {
      score += config.patterns.manufacturer.filter(pattern => pattern.test(manufacturer)).length * 3;
    }
    
    // Check name patterns (both device name and entity name)
    if (config.patterns.name) {
      if (deviceName) {
        score += config.patterns.name.filter(pattern => pattern.test(deviceName)).length * 2;
      }
      if (entityName) {
        score += config.patterns.name.filter(pattern => pattern.test(entityName)).length * 2;
      }
    }
    
    // Check entity ID patterns
    if (entityId && config.patterns.entityId) {
      score += config.patterns.entityId.filter(pattern => pattern.test(entityId)).length * 2;
    }
    
    // Check attribute patterns
    if (entity && config.patterns.attributes) {
      score += config.patterns.attributes.filter(({ key, pattern }) => {
        const value = entity.attributes?.[key];
        return value && pattern.test(String(value));
      }).length;
    }
    
    // Check capabilities match
    if (entity && config.capabilities.domains.includes(entityId?.split('.')[0] || '')) {
      score += 1;
    }
    
    return { config, score };
  });
  
  // Find the highest scoring config
  const bestMatch = scores.reduce((best, current) => 
    current.score > best.score ? current : best,
    { config: null as DeviceTypeConfig | null, score: 0 }
  );
  
  // DEBUG: Log the best match for sensors
  if (entityId && (entityId.startsWith('sensor.') || entityId.startsWith('binary_sensor.'))) {
    console.log(`[DEBUG] Best match for ${entityId}:`, {
      configName: bestMatch.config?.name,
      score: bestMatch.score,
      topScores: scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(s => ({ name: s.config.name, score: s.score }))
    });
  }
  
  return bestMatch.score > 0 ? bestMatch.config : null;
}

// Get device type by ID
export function getDeviceTypeById(id: string): DeviceTypeConfig | undefined {
  return deviceTypeConfigs.find(config => config.id === id);
}

// Get all device types for a category
export function getDeviceTypesByCategory(category: string): DeviceTypeConfig[] {
  return deviceTypeConfigs.filter(config => config.category === category);
}