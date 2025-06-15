import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { ChevronUp, ChevronDown, Pause, Sun, MoreVertical } from 'lucide-react';
import EditDeviceModal from '../EditDeviceModal';

interface CoverCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const CoverCard: React.FC<CoverCardProps> = ({ entityId, entity, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService } = useHomeAssistant();
  const [isControlling, setIsControlling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const currentPosition = entity.attributes?.current_position || 0;
  const isClosing = state === 'closing';
  const isOpening = state === 'opening';
  const isClosed = state === 'closed' || currentPosition === 0;
  const isOpen = state === 'open' || currentPosition === 100;
  
  const handleControl = async (service: string, data?: any) => {
    if (isControlling) return;
    setIsControlling(true);
    
    try {
      await callService('cover', service, {
        entity_id: entityId,
        ...data
      });
    } catch (error) {
      console.error(`Failed to ${service}:`, error);
    } finally {
      setTimeout(() => setIsControlling(false), 300);
    }
  };
  
  const handlePositionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseInt(e.target.value);
    await handleControl('set_cover_position', { position });
  };
  
  const getStateColor = () => {
    if (isOpening || isClosing) return 'bg-yellow-500';
    if (isClosed) return 'bg-gray-600';
    if (isOpen) return 'bg-green-500';
    return 'bg-blue-500';
  };
  
  const getStateText = () => {
    if (isOpening) return 'Opening...';
    if (isClosing) return 'Closing...';
    if (isClosed) return 'Closed';
    if (isOpen) return 'Open';
    return `${currentPosition}% Open`;
  };
  
  return (
    <>
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStateColor()}`}></div>
          <span className="text-white font-medium">{friendlyName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-gray-400" />
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
      
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">{getStateText()}</p>
        
        {/* Position Slider */}
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${currentPosition}%` }}
          />
        </div>
        
        {entity.attributes?.supported_features && (entity.attributes.supported_features & 4) !== 0 && (
          <input
            type="range"
            min="0"
            max="100"
            value={currentPosition}
            onChange={handlePositionChange}
            className="w-full mt-2 opacity-0 cursor-pointer"
            style={{ marginTop: '-8px', height: '16px' }}
            disabled={isControlling}
          />
        )}
      </div>
      
      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleControl('open_cover')}
          disabled={isControlling || isOpen || isOpening}
          className="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm">Open</span>
        </button>
        
        {(isOpening || isClosing) && (
          <button
            onClick={() => handleControl('stop_cover')}
            disabled={isControlling}
            className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={() => handleControl('close_cover')}
          disabled={isControlling || isClosed || isClosing}
          className="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <ChevronDown className="w-4 h-4" />
          <span className="text-sm">Close</span>
        </button>
      </div>
      
      <div className="mt-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">COVER</span>
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

export default CoverCard;