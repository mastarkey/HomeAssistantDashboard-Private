// Helper functions for identifying camera detection entities
// This provides patterns to identify camera detection entities regardless of friendly name changes

interface DetectionPattern {
  entityIdPattern?: RegExp;
  attributeChecks?: Array<{
    attribute: string;
    pattern?: RegExp;
    value?: string | boolean | number;
  }>;
  deviceManufacturer?: string[];
  deviceModel?: RegExp;
}

// Patterns to identify camera detection entities
const CAMERA_DETECTION_PATTERNS: DetectionPattern[] = [
  // UniFi Protect G6 and other camera detection entities
  {
    // Entity ID patterns for UniFi cameras
    entityIdPattern: /^binary_sensor\.(g[3-6]|unifi|ubiquiti|protect).*_(person|vehicle|animal|package|audio|glass_break|license_plate|baby_cry|bark|car_alarm|smoke|siren|speaking)_detected$/i,
  },
  {
    // More generic detection pattern
    entityIdPattern: /^binary_sensor\..*_(motion|person|vehicle|animal|package)_detected$/i,
  },
  {
    // Detection entities that use "detections_" prefix
    entityIdPattern: /^(binary_sensor|sensor)\..*_detections_(person|vehicle|animal|package|audio|motion)$/i,
  },
  {
    // Smart detection toggles (switches that control detection features)
    entityIdPattern: /^switch\..*_(person|vehicle|animal|package|audio|motion)_detections?$/i,
  },
  {
    // Check device manufacturer for UniFi/Ubiquiti devices
    deviceManufacturer: ['Ubiquiti', 'UniFi', 'Ubiquiti Inc.', 'Ubiquiti Networks'],
    entityIdPattern: /^(binary_sensor|sensor|switch)\..*_(detected|detections?)$/i,
  },
  {
    // Check for specific model patterns (G3, G4, G5, G6 cameras)
    deviceModel: /^(UniFi Protect )?(G[3-6]|AI|Doorbell)/i,
    entityIdPattern: /^(binary_sensor|sensor|switch)\./,
  }
];

// Entity ID patterns that indicate camera-related sub-entities
const CAMERA_SUB_ENTITY_PATTERNS = [
  // Detection settings and overlays
  /_overlay_(show_date|show_logo|show_name|show_nerd_mode)$/i,
  /_show_(date|logo|name|nerd_mode)$/i,
  /_privacy_mode$/i,
  /_system_sounds$/i,
  /_status_light$/i,
  /_night_vision$/i,
  /_ir_mode$/i,
  /_recording_mode$/i,
  /_smart_detections?$/i,
  
  // Motion and detection zones
  /_motion_zones?$/i,
  /_detection_zones?$/i,
  /_activity_zones?$/i,
  
  // Camera specific sensors
  /_fps$/i,
  /_bitrate$/i,
  /_bandwidth$/i,
  /_stream$/i,
  /_snapshot$/i,
  
  // Audio related
  /_microphone$/i,
  /_speaker$/i,
  /_volume$/i,
  /_audio$/i,
];

// Attributes that might indicate a camera detection entity
const DETECTION_ATTRIBUTES = [
  'detection_type',
  'detection_categories',
  'smart_detection_types',
  'event_type',
  'event_score',
  'event_id',
  'last_trip_time',
  'device_class', // Often set to 'motion', 'occupancy', etc.
];

export function isCameraDetectionEntity(
  entityId: string,
  entity: any,
  device?: any
): boolean {
  // Check each pattern
  for (const pattern of CAMERA_DETECTION_PATTERNS) {
    let matches = true;
    
    // Check entity ID pattern
    if (pattern.entityIdPattern) {
      matches = matches && pattern.entityIdPattern.test(entityId);
    }
    
    // Check device manufacturer
    if (pattern.deviceManufacturer && device) {
      const manufacturer = device.manufacturer?.toLowerCase() || '';
      matches = matches && pattern.deviceManufacturer.some(
        mfg => manufacturer.includes(mfg.toLowerCase())
      );
    }
    
    // Check device model
    if (pattern.deviceModel && device) {
      const model = device.model || '';
      matches = matches && pattern.deviceModel.test(model);
    }
    
    // Check attributes
    if (pattern.attributeChecks) {
      for (const check of pattern.attributeChecks) {
        const attrValue = entity.attributes?.[check.attribute];
        if (check.pattern) {
          matches = matches && check.pattern.test(String(attrValue));
        } else if (check.value !== undefined) {
          matches = matches && attrValue === check.value;
        }
      }
    }
    
    if (matches) {
      return true;
    }
  }
  
  // Additional check: Look for common detection attributes
  if (entity.attributes) {
    const hasDetectionAttribute = DETECTION_ATTRIBUTES.some(
      attr => entity.attributes[attr] !== undefined
    );
    
    // If it has detection attributes and is a binary_sensor, likely a detection entity
    if (hasDetectionAttribute && entityId.startsWith('binary_sensor.')) {
      return true;
    }
    
    // Check device_class for motion/occupancy/sound
    const deviceClass = entity.attributes.device_class;
    if (deviceClass && ['motion', 'occupancy', 'sound', 'presence', 'vibration'].includes(deviceClass)) {
      // But exclude generic motion sensors that aren't camera-related
      const entityName = entityId.split('.')[1];
      if (entityName.match(/(camera|g[3-6]|protect|doorbell)/i)) {
        return true;
      }
    }
  }
  
  return false;
}

export function isCameraSubEntity(entityId: string): boolean {
  // Check if entity ID matches camera sub-entity patterns
  return CAMERA_SUB_ENTITY_PATTERNS.some(pattern => pattern.test(entityId));
}

export function getCameraBaseNameFromEntity(entityId: string): string {
  const entityName = entityId.split('.')[1];
  
  // Remove common detection suffixes
  return entityName
    .replace(/_detections?_(person|vehicle|animal|package|audio|motion)$/i, '')
    .replace(/_(person|vehicle|animal|package|motion)_detected$/i, '')
    .replace(/_detected$/i, '')
    .replace(/_detections?$/i, '')
    .replace(/_motion$/i, '')
    .replace(/_channel\d*$/i, '')
    .replace(/_high_resolution$/i, '')
    .replace(/_package$/i, '');
}

export function groupCameraEntities(
  entities: Record<string, any>,
  devices?: any[]
): Map<string, { camera?: any; detections: any[]; controls: any[] }> {
  const cameraGroups = new Map<string, { camera?: any; detections: any[]; controls: any[] }>();
  
  // First pass: Find all camera entities
  Object.entries(entities).forEach(([entityId, entity]) => {
    if (entityId.startsWith('camera.')) {
      const baseName = getCameraBaseNameFromEntity(entityId);
      if (!cameraGroups.has(baseName)) {
        cameraGroups.set(baseName, { camera: entity, detections: [], controls: [] });
      } else {
        cameraGroups.get(baseName)!.camera = entity;
      }
    }
  });
  
  // Second pass: Find related detection entities and controls
  Object.entries(entities).forEach(([entityId, entity]) => {
    if (entityId.startsWith('camera.')) return;
    
    const device = devices?.find(d => 
      entity.attributes?.device_id === d.id
    );
    
    // Check if this is a detection entity
    if (isCameraDetectionEntity(entityId, entity, device)) {
      const baseName = getCameraBaseNameFromEntity(entityId);
      
      // Try to find which camera group this belongs to
      for (const [cameraBase] of cameraGroups) {
        if (baseName.includes(cameraBase) || cameraBase.includes(baseName)) {
          cameraGroups.get(cameraBase)!.detections.push({ entityId, entity });
          break;
        }
      }
    }
    
    // Check if this is a camera control (switch/select/number)
    else if (isCameraSubEntity(entityId)) {
      const baseName = getCameraBaseNameFromEntity(entityId);
      
      for (const [cameraBase] of cameraGroups) {
        if (baseName.includes(cameraBase) || cameraBase.includes(baseName)) {
          cameraGroups.get(cameraBase)!.controls.push({ entityId, entity });
          break;
        }
      }
    }
  });
  
  return cameraGroups;
}