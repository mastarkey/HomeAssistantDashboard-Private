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
  ChevronRight
} from 'lucide-react';
import { groupEntitiesByDevice, getDeviceDisplayInfo, type GroupedDevice } from '../utils/deviceGrouping';

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
  const [selectedDevice, setSelectedDevice] = useState<GroupedDevice | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Get grouped devices
  const groupedDevicesList = useMemo(() => {
    const grouped = groupEntitiesByDevice(entities, devices);
    console.log('[DEBUG] Grouped devices:', grouped.length);
    
    // DEBUG: Check if Tesla devices are in the list
    const teslaDevices = grouped.filter(d => 
      d.deviceName.toLowerCase().includes('tesla') || 
      d.deviceId.toLowerCase().includes('tesla')
    );
    if (teslaDevices.length > 0) {
      console.log('[DEBUG] Tesla devices found:', teslaDevices);
    }
    
    return grouped;
  }, [entities, devices]);

  // Filter grouped devices based on search
  const filteredGroupedDevices = useMemo(() => {
    if (!searchQuery) return groupedDevicesList;
    
    const query = searchQuery.toLowerCase();
    return groupedDevicesList.filter(device => {
      const info = getDeviceDisplayInfo(device);
      return info.name.toLowerCase().includes(query) || 
             info.description.toLowerCase().includes(query) ||
             device.deviceId.toLowerCase().includes(query);
    });
  }, [groupedDevicesList, searchQuery]);

  const handleAssign = () => {
    if (selectedDevice && selectedRoom) {
      console.log('[DEBUG] Assigning device to room:', {
        device: selectedDevice,
        primaryEntity: selectedDevice.primaryEntity.entityId,
        deviceType: selectedDevice.deviceType,
        room: selectedRoom,
        allEntities: selectedDevice.entities.map(e => e.entityId)
      });
      
      // For devices with multiple entities (like EV chargers), assign all entities
      if (selectedDevice.deviceType === 'EV Charger' || selectedDevice.deviceType === 'NAS') {
        console.log('[DEBUG] Assigning all entities for special device type');
        selectedDevice.entities.forEach(({ entityId }) => {
          console.log(`[DEBUG] Assigning ${entityId} to ${selectedRoom}`);
          onAssign(entityId, selectedRoom);
        });
      } else {
        // For other devices, just assign the primary entity
        onAssign(selectedDevice.primaryEntity.entityId, selectedRoom);
      }
      onClose();
    }
  };

  // Get icon for device type
  const getDeviceIcon = (device: GroupedDevice) => {
    const iconClass = "w-5 h-5";
    
    // Check device type first
    if (device.deviceType) {
      if (device.deviceType.includes('Charger')) return <Car className={iconClass} />;
      if (device.deviceType === 'NAS') return <Server className={iconClass} />;
    }
    
    // Fall back to domain-based icons
    const primaryDomain = device.primaryEntity.entityId.split('.')[0];
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
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!selectedDevice ? (
          <div>
            <p className="text-gray-400 mb-6">
              Select a device to add it to a room. Each device includes all its capabilities and sensors.
            </p>
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search devices..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Device List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredGroupedDevices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {searchQuery ? 'No devices found matching your search.' : 'No devices found.'}
                </p>
              ) : (
                filteredGroupedDevices.map(device => {
                  const info = getDeviceDisplayInfo(device);
                  const currentRoom = getEffectiveRoom ? getEffectiveRoom(device.primaryEntity.entityId) : undefined;
                  const isSpecialDevice = device.deviceType === 'EV Charger' || device.deviceType === 'NAS';
                  
                  return (
                    <button
                      key={device.deviceId}
                      onClick={() => setSelectedDevice(device)}
                      className={`w-full p-4 rounded-lg text-left transition-colors ${
                        isSpecialDevice 
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
                            <p className="font-medium text-white">
                              {info.name}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              {info.description}
                            </p>
                            {currentRoom && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-500">
                                <Home className="w-3 h-3" />
                                <span>Currently in: {rooms.find(r => r.id === currentRoom)?.name || currentRoom}</span>
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
            </div>
          </div>
        ) : (
          <div>
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedDevice(null);
                setSelectedRoom('');
              }}
              className="text-gray-400 hover:text-white transition-colors mb-4"
            >
              ← Back to devices
            </button>

            {/* Selected Device Details */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-purple-400 mt-0.5">
                  {getDeviceIcon(selectedDevice)}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {getDeviceDisplayInfo(selectedDevice).name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {getDeviceDisplayInfo(selectedDevice).description}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  This device includes {selectedDevice.entities.length} {selectedDevice.entities.length === 1 ? 'entity' : 'entities'}:
                </p>
                {selectedDevice.entities.map(({ entityId, entity, domain }) => (
                  <div key={entityId} className="text-sm text-gray-300 bg-gray-900 rounded px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{entity.attributes?.friendly_name || entityId}</span>
                        <span className="text-gray-500 ml-2 text-xs">({domain})</span>
                      </div>
                      {entity.state && (
                        <span className="text-gray-400">
                          {entity.state}
                          {entity.attributes?.unit_of_measurement && ` ${entity.attributes.unit_of_measurement}`}
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