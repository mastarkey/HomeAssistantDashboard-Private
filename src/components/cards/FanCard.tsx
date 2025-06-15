import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { Fan, Power, Wind, MoreVertical } from 'lucide-react';
import EditDeviceModal from '../EditDeviceModal';

interface FanCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const FanCard: React.FC<FanCardProps> = ({ entityId, entity, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService } = useHomeAssistant();
  const [isControlling, setIsControlling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const isOn = state === 'on';
  const speed = entity.attributes?.percentage || 0;
  const supportsSpeed = entity.attributes?.supported_features ? (entity.attributes.supported_features & 1) !== 0 : false;
  const supportsOscillate = entity.attributes?.supported_features ? (entity.attributes.supported_features & 2) !== 0 : false;
  const isOscillating = entity.attributes?.oscillating || false;
  
  const handleToggle = async () => {
    if (isControlling) return;
    setIsControlling(true);
    
    try {
      const service = isOn ? 'turn_off' : 'turn_on';
      await callService('fan', service, {
        entity_id: entityId,
      });
    } catch (error) {
      console.error('Failed to toggle fan:', error);
    } finally {
      setTimeout(() => setIsControlling(false), 300);
    }
  };
  
  const handleSpeedChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseInt(e.target.value);
    await callService('fan', 'set_percentage', {
      entity_id: entityId,
      percentage,
    });
  };
  
  const handleOscillate = async () => {
    await callService('fan', 'oscillate', {
      entity_id: entityId,
      oscillating: !isOscillating,
    });
  };
  
  const getSpeedText = () => {
    if (!isOn) return 'Off';
    if (speed > 66) return 'High';
    if (speed > 33) return 'Medium';
    return 'Low';
  };
  
  return (
    <>
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-green-500' : 'bg-gray-600'}`}></div>
          <div>
            <h3 className="text-white font-medium">{friendlyName}</h3>
            <p className="text-xs text-gray-500">{getSpeedText()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`transition-all duration-1000 ${isOn ? 'animate-spin' : ''}`}>
            <Fan className={`w-6 h-6 ${isOn ? 'text-purple-400' : 'text-gray-400'}`} />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Speed Control */}
      {isOn && supportsSpeed && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Speed</span>
            <span className="text-sm text-gray-300">{speed}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={speed}
            onChange={handleSpeedChange}
            className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer 
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                     [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            disabled={isControlling}
          />
        </div>
      )}
      
      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleToggle}
          disabled={isControlling}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isOn ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'
          } disabled:opacity-50`}
        >
          <Power className="w-4 h-4" />
          {isOn ? 'On' : 'Off'}
        </button>
        
        {supportsOscillate && (
          <button
            onClick={handleOscillate}
            disabled={isControlling || !isOn}
            className={`p-2 rounded-lg transition-colors ${
              isOscillating ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
            } disabled:opacity-50`}
            title="Toggle oscillation"
          >
            <Wind className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="mt-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">FAN</span>
      </div>
    </div>
    
    {showEditModal && onEntityUpdate && (
      <EditDeviceModal
        entityId={entityId}
        entity={entity}
        onClose={() => setShowEditModal(false)}
        onSave={onEntityUpdate}
        rooms={rooms}
        isCustom={isCustom}
      />
    )}
    </>
  );
};

export default FanCard;