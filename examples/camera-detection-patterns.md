# Camera Detection Entity Patterns

This document describes the improved patterns used to identify G6 camera detection entities without relying on friendly names.

## Entity ID Patterns

The system now identifies camera detection entities based on their entity IDs using these patterns:

### 1. UniFi Protect Camera Detection Entities
```regex
^binary_sensor\.(g[3-6]|unifi|ubiquiti|protect).*_(person|vehicle|animal|package|audio|glass_break|license_plate|baby_cry|bark|car_alarm|smoke|siren|speaking)_detected$
```

Examples:
- `binary_sensor.g6_backyard_person_detected`
- `binary_sensor.g4_doorbell_pro_vehicle_detected`
- `binary_sensor.unifi_camera_animal_detected`

### 2. Generic Detection Patterns
```regex
^binary_sensor\..*_(motion|person|vehicle|animal|package)_detected$
```

Examples:
- `binary_sensor.front_door_motion_detected`
- `binary_sensor.garage_person_detected`

### 3. Detection Entities with "detections_" Prefix
```regex
^(binary_sensor|sensor)\..*_detections_(person|vehicle|animal|package|audio|motion)$
```

Examples:
- `binary_sensor.g6_instant_detections_person`
- `sensor.camera_detections_vehicle`

### 4. Smart Detection Toggle Switches
```regex
^switch\..*_(person|vehicle|animal|package|audio|motion)_detections?$
```

Examples:
- `switch.g6_backyard_person_detections`
- `switch.doorbell_vehicle_detection`

## Device-Based Detection

The system also checks device attributes:

### 1. Manufacturer Check
If the device manufacturer is one of:
- Ubiquiti
- UniFi
- Ubiquiti Inc.
- Ubiquiti Networks

And the entity ID contains "detected" or "detections", it's identified as a camera detection entity.

### 2. Model Pattern Check
If the device model matches:
```regex
^(UniFi Protect )?(G[3-6]|AI|Doorbell)
```

Examples:
- UniFi Protect G6 Instant
- G4 Doorbell Pro
- AI Theta

## Entity Attributes

The system also checks for specific attributes that indicate detection entities:
- `detection_type`
- `detection_categories`
- `smart_detection_types`
- `event_type`
- `event_score`
- `event_id`
- `last_trip_time`
- `device_class` (when set to 'motion', 'occupancy', 'sound', 'presence', 'vibration')

## Camera Sub-Entity Patterns

The following patterns identify camera-related sub-entities that should be hidden:

- Overlay settings: `_overlay_show_date`, `_show_logo`, etc.
- Privacy settings: `_privacy_mode`, `_system_sounds`
- Camera controls: `_status_light`, `_night_vision`, `_ir_mode`
- Recording settings: `_recording_mode`, `_smart_detections`
- Zone settings: `_motion_zones`, `_detection_zones`
- Technical sensors: `_fps`, `_bitrate`, `_bandwidth`
- Audio controls: `_microphone`, `_speaker`, `_volume`

## Benefits of This Approach

1. **Reliability**: Entity IDs are more stable than friendly names
2. **Consistency**: Works across different Home Assistant configurations
3. **Flexibility**: Supports multiple camera brands and models
4. **Future-proof**: Pattern-based matching adapts to new entity types
5. **Device Integration**: Uses device registry when available for accurate identification

## Usage in the Dashboard

The dashboard now uses these patterns to:
1. Hide camera detection entities from the main device list
2. Group detection entities with their parent camera in the camera modal
3. Maintain proper entity relationships regardless of naming conventions