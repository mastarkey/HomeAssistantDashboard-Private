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
  Plus,
  Search,
  Home
} from 'lucide-react';
import { getUnassignedDevices, groupDevicesByDomain } from '../utils/unassignedDevices';

interface AddDeviceModalProps {
  onClose: () => void;
  onAssign: (entityId: string, roomId: string) => void;
  onCreateCustom: () => void;
  entities: any;
  devices: any[] | null;
  rooms: Array<{ id: string; name: string }>;
  getEffectiveRoom?: (entityId: string, defaultRoom?: string) => string;
}

const domainIcons: Record<string, React.ReactNode> = {
  light: <Lightbulb className="w-5 h-5" />,
  switch: <Power className="w-5 h-5" />,
  climate: <Thermometer className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  camera: <Camera className="w-5 h-5" />,
  media_player: <Tv className="w-5 h-5" />,
  sensor: <Activity className="w-5 h-5" />,
  binary_sensor: <Shield className="w-5 h-5" />,
  fan: <Fan className="w-5 h-5" />,
  cover: <Blinds className="w-5 h-5" />,
};

const domainNames: Record<string, string> = {
  light: 'Lights',
  switch: 'Switches',
  climate: 'Climate',
  lock: 'Locks',
  camera: 'Cameras',
  media_player: 'Media Players',
  sensor: 'Sensors',
  binary_sensor: 'Binary Sensors',
  fan: 'Fans',
  cover: 'Covers',
};

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ 
  onClose, 
  onAssign, 
  onCreateCustom,
  entities, 
  devices, 
  rooms,
  getEffectiveRoom 
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unassigned devices
  const unassignedDevices = useMemo(() => {
    return getUnassignedDevices(entities, devices, getEffectiveRoom);
  }, [entities, devices, getEffectiveRoom]);

  // Group devices by domain
  const groupedDevices = useMemo(() => {
    return groupDevicesByDomain(unassignedDevices);
  }, [unassignedDevices]);

  // Filter devices based on search query
  const filteredDevices = useMemo(() => {
    if (!selectedDomain || !groupedDevices[selectedDomain]) return [];
    
    const domainDevices = groupedDevices[selectedDomain];
    
    if (!searchQuery) return domainDevices;
    
    const query = searchQuery.toLowerCase();
    return domainDevices.filter(([entityId, entity]) => {
      const friendlyName = entity.attributes?.friendly_name || entityId;
      return friendlyName.toLowerCase().includes(query) || entityId.toLowerCase().includes(query);
    });
  }, [selectedDomain, groupedDevices, searchQuery]);

  const handleAssign = () => {
    if (selectedDevice && selectedRoom) {
      onAssign(selectedDevice, selectedRoom);
      onClose();
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

        {/* Domain Selection */}
        {!selectedDomain ? (
          <div>
            <p className="text-gray-400 mb-6">
              Select a device type to see available devices, or create a custom device.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {Object.entries(groupedDevices).map(([domain, devices]) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
                      {domainIcons[domain] || <Home className="w-5 h-5" />}
                    </div>
                    <span className="text-white font-medium">
                      {domainNames[domain] || domain}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {devices.length} available
                  </p>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-6">
              <button
                onClick={onCreateCustom}
                className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg p-4 transition-colors flex items-center justify-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Custom Device</span>
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Create a device that doesn't exist in Home Assistant
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedDomain(null);
                setSelectedDevice(null);
                setSearchQuery('');
              }}
              className="text-gray-400 hover:text-white transition-colors mb-4"
            >
              ← Back to device types
            </button>

            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <span className="text-gray-400">
                {domainIcons[selectedDomain] || <Home className="w-5 h-5" />}
              </span>
              {domainNames[selectedDomain] || selectedDomain}
            </h3>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search devices..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Device List */}
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {filteredDevices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {searchQuery ? 'No devices found matching your search.' : 'No unassigned devices found.'}
                </p>
              ) : (
                filteredDevices.map(([entityId, entity]) => (
                  <button
                    key={entityId}
                    onClick={() => setSelectedDevice(entityId)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedDevice === entityId
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {entity.attributes?.friendly_name || entityId}
                        </p>
                        <p className="text-sm opacity-70">{entityId}</p>
                      </div>
                      <p className="text-sm">
                        {entity.state}
                        {entity.attributes?.unit_of_measurement && (
                          <span className="ml-1">{entity.attributes.unit_of_measurement}</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Room Selection */}
            {selectedDevice && (
              <div className="border-t border-gray-800 pt-6">
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
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedDomain(null);
                  setSelectedDevice(null);
                  setSearchQuery('');
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