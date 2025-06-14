import React, { useState } from 'react';
import { X, MapPin, Home, Tag, Settings } from 'lucide-react';

interface EditDeviceModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
  onSave: (entityId: string, updates: { room?: string; name?: string; attributes?: any }) => void;
  rooms: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const EditDeviceModal: React.FC<EditDeviceModalProps> = ({ 
  entityId, 
  entity, 
  onClose, 
  onSave, 
  rooms,
  isCustom = false 
}) => {
  const currentRoom = entity.room || entity.attributes?.area_id || 'other';
  const currentName = entity.attributes?.friendly_name || entity.name || entityId;
  
  const [selectedRoom, setSelectedRoom] = useState(currentRoom);
  const [deviceName, setDeviceName] = useState(currentName);
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId);
    setHasChanges(true);
  };
  
  const handleNameChange = (name: string) => {
    setDeviceName(name);
    setHasChanges(true);
  };
  
  const handleSave = () => {
    const updates: any = {};
    
    if (selectedRoom !== currentRoom) {
      updates.room = selectedRoom;
    }
    
    if (deviceName !== currentName) {
      updates.name = deviceName;
      updates.attributes = {
        ...entity.attributes,
        friendly_name: deviceName
      };
    }
    
    onSave(entityId, updates);
    onClose();
  };
  
  const getEntityType = () => {
    const domain = entityId.split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1).replace('_', ' ');
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-semibold text-white">Edit Device</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Device Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Entity ID</span>
              <span className="text-sm font-mono text-gray-300">{entityId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Type</span>
              <span className="text-sm text-gray-300">{getEntityType()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Current State</span>
              <span className="text-sm text-gray-300">{entity.state}</span>
            </div>
            {isCustom && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Custom Device</span>
                <span className="text-sm text-purple-400">Yes</span>
              </div>
            )}
          </div>
          
          {/* Device Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Tag className="w-4 h-4" />
              Device Name
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Enter device name"
            />
          </div>
          
          {/* Room Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <MapPin className="w-4 h-4" />
              Move to Room
            </label>
            <div className="grid grid-cols-2 gap-3">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleRoomChange(room.id)}
                  className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${
                    selectedRoom === room.id
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="text-sm font-medium">{room.name}</span>
                </button>
              ))}
            </div>
            {selectedRoom !== currentRoom && (
              <p className="mt-2 text-sm text-purple-400">
                Device will be moved from "{rooms.find(r => r.id === currentRoom)?.name || 'Unknown'}" to "{rooms.find(r => r.id === selectedRoom)?.name}"
              </p>
            )}
          </div>
          
          {/* Note for non-custom devices */}
          {!isCustom && (
            <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-4">
              <p className="text-sm text-orange-300">
                <strong>Note:</strong> This is a Home Assistant device. Room changes will only affect how it appears in this dashboard, not in Home Assistant itself.
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDeviceModal;