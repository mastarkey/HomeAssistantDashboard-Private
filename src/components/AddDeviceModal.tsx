import React, { useState, useMemo } from 'react';
import { 
  X, 
  Lightbulb, 
  Power, 
  Thermometer, 
  Lock, 
  Camera,
  Tv,
  Activity,
  Shield,
  Fan,
  Blinds,
  Search,
  Home,
  Bot,
  Car,
  Server,
  ChevronRight,
  ChevronLeft,
  Building2
} from 'lucide-react';
import { groupEntitiesByDevice, type DeviceGroup } from '../utils/deviceGrouping';
import { filterPrimaryDevices } from '../utils/deviceFiltering';

interface HassEntity {
  state: string;
  attributes: {
    friendly_name?: string;
    device_id?: string;
    unit_of_measurement?: string | number;
    [key: string]: any;
  };
  last_changed?: string;
  last_updated?: string;
}

interface AddDeviceModalProps {
  onClose: () => void;
  onAssign: (entityId: string, roomId: string) => void;
  entities: any;
  devices: any[] | null;
  rooms: Array<{ id: string; name: string }>;
  getEffectiveRoom?: (entityId: string, defaultRoom?: string) => string;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ 
  onClose, 
  onAssign, 
  entities, 
  devices, 
  rooms,
  getEffectiveRoom 
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceGroup | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'manufacturers' | 'devices'>('manufacturers');

  // Get all grouped devices - ONLY physical devices, not individual sensors
  const groupedDevicesList = useMemo(() => {
    if (!entities) return [];
    const entitiesArray = Object.entries(entities) as Array<[string, HassEntity]>;
    const grouped = groupEntitiesByDevice(entitiesArray, devices, entities);
    
    // Filter to only show primary physical devices, not individual sensors
    const primaryDevices = grouped.filter(deviceGroup => {
      // First check if this is a primary device using the same logic as Dashboard
      const isPrimary = filterPrimaryDevices([deviceGroup.primaryEntity], devices, entities).length > 0;
      if (!isPrimary) return false;
      
      // Additional filtering: For single-entity "devices", only show if they're actually physical devices
      if (deviceGroup.entities.length === 1) {
        const [entityId, entity] = deviceGroup.primaryEntity;
        const domain = entityId.split('.')[0];
        const friendlyName = entity.attributes?.friendly_name || '';
        const entityName = entityId.split('.')[1];
        
        // Filter out UniFi camera sub-entities (switches for overlays, settings, etc.)
        if (domain === 'switch' || domain === 'binary_sensor' || domain === 'sensor') {
          const isUnifiCameraSubEntity = 
            friendlyName.toLowerCase().includes('overlay:') ||
            friendlyName.toLowerCase().includes('show ') ||
            friendlyName.toLowerCase().includes('privacy mode') ||
            friendlyName.toLowerCase().includes('status light') ||
            entityName.includes('_overlay_') ||
            entityName.includes('_show_') ||
            entityName.includes('_privacy_mode') ||
            entityName.includes('_status_light');
          
          if (isUnifiCameraSubEntity) {
            return false; // Filter out UniFi camera sub-entities
          }
        }
        
        // Single sensors/binary_sensors are usually not physical devices unless they have a device registry entry
        if ((domain === 'sensor' || domain === 'binary_sensor') && !deviceGroup.device) {
          // Exception for known physical devices that might show as single sensors
          const deviceName = deviceGroup.deviceName.toLowerCase();
          const isKnownDevice = 
            deviceName.includes('tesla') || 
            deviceName.includes('wall connector') ||
            deviceName.includes('charger') ||
            deviceName.includes('nas') ||
            deviceName.includes('synology');
          
          if (!isKnownDevice) {
            return false; // Filter out standalone sensors
          }
        }
      }
      
      return true;
    });
    
    console.log('[DEBUG] Total device groups:', grouped.length, 'Primary devices:', primaryDevices.length);
    
    return primaryDevices;
  }, [entities, devices]);

  // Group devices by manufacturer/integration
  const devicesByManufacturer = useMemo(() => {
    const grouped = new Map<string, DeviceGroup[]>();
    
    groupedDevicesList.forEach(device => {
      // Determine the grouping key
      let key = 'Other';
      
      // First try integration field
      if (device.integration) {
        key = device.integration;
      } else if (device.manufacturer) {
        key = device.manufacturer;
      } else if (device.device?.manufacturer) {
        key = device.device.manufacturer;
      } else {
        // Try to infer from device name patterns and entity IDs
        const deviceNameLower = device.deviceName.toLowerCase();
        const primaryEntityId = device.primaryEntity[0].toLowerCase();
        
        if (deviceNameLower.includes('sense') || deviceNameLower.includes('device ') || primaryEntityId.includes('sense_')) {
          key = 'Sense';
        } else if (deviceNameLower.includes('unifi') || deviceNameLower.includes('ubiquiti') || deviceNameLower.includes('ai pro')) {
          key = 'UniFi';
        } else if (deviceNameLower.includes('tesla') || deviceNameLower.includes('wall connector')) {
          key = 'Tesla';
        } else if (deviceNameLower.includes('synology') || deviceNameLower.includes('nas') || deviceNameLower.includes('diskstation')) {
          key = 'Synology';
        } else if (deviceNameLower.includes('philips') || deviceNameLower.includes('hue')) {
          key = 'Philips Hue';
        } else if (deviceNameLower.includes('sonos')) {
          key = 'Sonos';
        } else if (deviceNameLower.includes('dyson')) {
          key = 'Dyson';
        } else if (deviceNameLower.includes('lutron')) {
          key = 'Lutron';
        } else if (deviceNameLower.includes('nest') || deviceNameLower.includes('google')) {
          key = 'Google Nest';
        }
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(device);
    });
    
    // Sort manufacturers by device count
    return new Map([...grouped.entries()].sort((a, b) => {
      // 'Other' always goes last
      if (a[0] === 'Other') return 1;
      if (b[0] === 'Other') return -1;
      // Otherwise sort by device count (descending)
      return b[1].length - a[1].length;
    }));
  }, [groupedDevicesList]);

  // Filter grouped devices based on search and sort unassigned first
  const filteredGroupedDevices = useMemo(() => {
    let devices = groupedDevicesList;
    
    // If in manufacturer view, filter to selected manufacturer
    if (viewMode === 'devices' && selectedManufacturer) {
      const manufacturerDevices = devicesByManufacturer.get(selectedManufacturer) || [];
      devices = manufacturerDevices;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      devices = devices.filter(device => {
        return device.deviceName.toLowerCase().includes(query) || 
               device.deviceId.toLowerCase().includes(query) ||
               (device.manufacturer?.toLowerCase().includes(query) || false) ||
               (device.model?.toLowerCase().includes(query) || false);
      });
    }
    
    // Sort devices: unassigned first, then by name
    return devices.sort((a, b) => {
      const roomA = getEffectiveRoom ? getEffectiveRoom(a.primaryEntity[0]) : a.room;
      const roomB = getEffectiveRoom ? getEffectiveRoom(b.primaryEntity[0]) : b.room;
      const isUnassignedA = !roomA || roomA === 'other';
      const isUnassignedB = !roomB || roomB === 'other';
      
      // Unassigned devices come first
      if (isUnassignedA && !isUnassignedB) return -1;
      if (!isUnassignedA && isUnassignedB) return 1;
      
      // Then sort by device name
      return a.deviceName.localeCompare(b.deviceName);
    });
  }, [groupedDevicesList, searchQuery, getEffectiveRoom, viewMode, selectedManufacturer, devicesByManufacturer]);

  const handleAssign = () => {
    if (selectedDevice && selectedRoom) {
      console.log('[DEBUG] Assigning device to room:', {
        device: selectedDevice,
        primaryEntity: selectedDevice.primaryEntity[0],
        room: selectedRoom,
        allEntities: selectedDevice.entities.map(([entityId]) => entityId)
      });
      
      // For devices with multiple entities, assign all entities
      if (selectedDevice.entities.length > 1) {
        console.log('[DEBUG] Assigning all entities for multi-entity device');
        selectedDevice.entities.forEach(([entityId]) => {
          console.log(`[DEBUG] Assigning ${entityId} to ${selectedRoom}`);
          onAssign(entityId, selectedRoom);
        });
      } else {
        // For single entity devices, just assign the primary entity
        onAssign(selectedDevice.primaryEntity[0], selectedRoom);
      }
      onClose();
    }
  };
  
  // Reset state when closing
  const handleClose = () => {
    setSearchQuery('');
    setSelectedDevice(null);
    setSelectedRoom('');
    setSelectedManufacturer(null);
    setViewMode('manufacturers');
    onClose();
  };

  // Get icon for device type
  const getDeviceIcon = (device: DeviceGroup) => {
    const iconClass = "w-5 h-5";
    
    // Check device name for special types
    const deviceNameLower = device.deviceName.toLowerCase();
    if (deviceNameLower.includes('charger') || deviceNameLower.includes('tesla')) return <Car className={iconClass} />;
    if (deviceNameLower.includes('nas')) return <Server className={iconClass} />;
    
    // Fall back to domain-based icons
    const primaryDomain = device.primaryEntity[0].split('.')[0];
    switch (primaryDomain) {
      case 'light': return <Lightbulb className={iconClass} />;
      case 'switch': return <Power className={iconClass} />;
      case 'climate': return <Thermometer className={iconClass} />;
      case 'lock': return <Lock className={iconClass} />;
      case 'camera': return <Camera className={iconClass} />;
      case 'media_player': return <Tv className={iconClass} />;
      case 'sensor': return <Activity className={iconClass} />;
      case 'binary_sensor': return <Shield className={iconClass} />;
      case 'fan': return <Fan className={iconClass} />;
      case 'cover': return <Blinds className={iconClass} />;
      case 'vacuum': return <Bot className={iconClass} />;
      default: return <Home className={iconClass} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add Device</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!selectedDevice ? (
          <div>
            <div className="mb-6">
              <p className="text-gray-400">
                Select a physical device to add to a room. Each device includes all its entities (sensors, switches, etc.).
              </p>
              {(() => {
                const unassignedCount = filteredGroupedDevices.filter(device => {
                  const currentRoom = getEffectiveRoom ? getEffectiveRoom(device.primaryEntity[0]) : device.room;
                  return !currentRoom || currentRoom === 'other';
                }).length;
                
                if (unassignedCount > 0) {
                  return (
                    <div className="mt-2 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                      <p className="text-purple-400 text-sm flex items-center gap-2">
                        <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {unassignedCount}
                        </span>
                        {unassignedCount === 1 ? 'device needs' : 'devices need'} room assignment
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // When searching, always show manufacturers view for better results
                  if (e.target.value && viewMode === 'devices') {
                    setViewMode('manufacturers');
                    setSelectedManufacturer(null);
                  }
                }}
                placeholder="Search devices..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Manufacturer List or Device List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {viewMode === 'manufacturers' ? (
                // Show manufacturers/integrations
                <>
                  {searchQuery && (
                    <p className="text-xs text-gray-500 mb-2">
                      Showing all manufacturers with matching devices
                    </p>
                  )}
                  {Array.from(devicesByManufacturer.entries()).map(([manufacturer, devices]) => {
                    // Filter devices if searching
                    let filteredDevices = devices;
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      filteredDevices = devices.filter(device => 
                        device.deviceName.toLowerCase().includes(query) || 
                        device.deviceId.toLowerCase().includes(query) ||
                        (device.manufacturer?.toLowerCase().includes(query) || false) ||
                        (device.model?.toLowerCase().includes(query) || false)
                      );
                      if (filteredDevices.length === 0) return null;
                    }
                    
                    const unassignedCount = filteredDevices.filter(device => {
                      const room = getEffectiveRoom ? getEffectiveRoom(device.primaryEntity[0]) : device.room;
                      return !room || room === 'other';
                    }).length;
                    
                    return (
                      <button
                        key={manufacturer}
                        onClick={() => {
                          setSelectedManufacturer(manufacturer);
                          setViewMode('devices');
                        }}
                        className="w-full p-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-white">{manufacturer}</p>
                              <p className="text-sm text-gray-400">
                                {filteredDevices.length} {filteredDevices.length === 1 ? 'device' : 'devices'}
                                {unassignedCount > 0 && (
                                  <span className="text-orange-400 ml-2">
                                    ({unassignedCount} unassigned)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
                      </button>
                    );
                  })}
                </>
              ) : (
                // Show devices for selected manufacturer
                <>
                  <button
                    onClick={() => {
                      setViewMode('manufacturers');
                      setSelectedManufacturer(null);
                    }}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to manufacturers</span>
                  </button>
                  
                  <h3 className="text-lg font-medium text-white mb-3">
                    {selectedManufacturer} Devices
                  </h3>
                  
                  {filteredGroupedDevices.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {searchQuery ? 'No devices found matching your search.' : 'No devices found.'}
                    </p>
                  ) : (
                    filteredGroupedDevices.map(device => {
                      const currentRoom = getEffectiveRoom ? getEffectiveRoom(device.primaryEntity[0]) : device.room;
                      const isUnassigned = !currentRoom || currentRoom === 'other';
                      const isPhysicalDevice = device.device || device.entities.length > 1; // Physical devices
                      const isSpecialDevice = device.entities.length > 5; // Devices with many entities
                      const entityCounts = device.entities.reduce((acc, [id]) => {
                        const domain = id.split('.')[0];
                        acc[domain] = (acc[domain] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      return (
                        <button
                          key={device.deviceId}
                          onClick={() => setSelectedDevice(device)}
                          className={`w-full p-4 rounded-lg text-left transition-colors ${
                            isUnassigned
                              ? 'bg-orange-900/30 hover:bg-orange-800/40 border border-orange-700/50'
                              : isSpecialDevice 
                              ? 'bg-purple-900/30 hover:bg-purple-800/40 border border-purple-700/50' 
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className={`mt-0.5 ${isSpecialDevice ? 'text-purple-400' : 'text-gray-400'}`}>
                                {getDeviceIcon(device)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-white flex items-center gap-2">
                                  {device.deviceName}
                                  {isPhysicalDevice && (
                                    <span className="text-xs bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded">
                                      Physical
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  {device.manufacturer && device.model 
                                    ? `${device.manufacturer} ${device.model}` 
                                    : device.device 
                                      ? 'Physical Device'
                                      : `${device.entities.length > 1 ? 'Multi-entity device' : 'Device'}`}
                                </p>
                                {/* Entity count badges */}
                                <div className="flex items-center gap-2 mt-2">
                                  {Object.entries(entityCounts).map(([domain, count]) => (
                                    <span key={domain} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                                      {count} {domain}{count > 1 ? 's' : ''}
                                    </span>
                                  ))}
                                </div>
                                {/* Current room assignment or unassigned indicator */}
                                {isUnassigned ? (
                                  <div className="flex items-center gap-1 mt-2">
                                    <span className="text-xs text-orange-400 font-medium">
                                      ⚠️ Needs room assignment
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Home className="w-3 h-3 text-green-400" />
                                    <span className="text-xs text-green-400">
                                      Currently in: {rooms.find(r => r.id === currentRoom)?.name || currentRoom}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-500 mt-0.5" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedDevice(null);
                setSelectedRoom('');
                // Go back to the previous view
                if (selectedManufacturer) {
                  setViewMode('devices');
                } else {
                  setViewMode('manufacturers');
                }
              }}
              className="text-gray-400 hover:text-white transition-colors mb-4"
            >
              ← Back to {selectedManufacturer ? 'devices' : 'manufacturers'}
            </button>

            {/* Selected Device Details */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-purple-400 mt-0.5">
                  {getDeviceIcon(selectedDevice)}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {selectedDevice.deviceName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {selectedDevice.manufacturer && selectedDevice.model 
                      ? `${selectedDevice.manufacturer} ${selectedDevice.model}` 
                      : selectedDevice.entities.length > 1 
                        ? `${selectedDevice.entities.length} entities`
                        : selectedDevice.primaryEntity[0]}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  This device includes {selectedDevice.entities.length} {selectedDevice.entities.length === 1 ? 'entity' : 'entities'}:
                </p>
                {selectedDevice.entities.map(([entityId, entity]) => (
                  <div key={entityId} className="text-sm text-gray-300 bg-gray-900 rounded px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{entity.attributes?.friendly_name || entityId}</span>
                        <span className="text-gray-500 ml-2 text-xs">({entityId.split('.')[0]})</span>
                      </div>
                      {entity.state && (
                        <span className="text-gray-400">
                          {entity.state}
                          {entity.attributes?.unit_of_measurement ? ` ${entity.attributes.unit_of_measurement}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assign to Room
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">Select a room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedDevice(null);
                  setSelectedRoom('');
                }}
                className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedDevice || !selectedRoom}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  selectedDevice && selectedRoom
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add to Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddDeviceModal;