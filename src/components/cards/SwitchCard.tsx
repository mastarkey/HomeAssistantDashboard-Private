import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { Power } from 'lucide-react';
import DeviceModal from '../DeviceModal';
import { SelectionOverlay } from './SelectionOverlay';

interface SwitchCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: () => void;
}

const SwitchCard: React.FC<SwitchCardProps> = ({ 
  entityId, 
  entity, 
  onEntityUpdate, 
  rooms, 
  isCustom,
  isSelectionMode = false,
  isSelected = false,
  onSelectionToggle
}) => {
  const { callService } = useHomeAssistant();
  const [isToggling, setIsToggling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      await callService('switch', state === 'on' ? 'turn_off' : 'turn_on', {
        entity_id: entityId,
      });
    } catch (error) {
      console.error('Failed to toggle switch:', error);
    } finally {
      setTimeout(() => setIsToggling(false), 300);
    }
  };
  
  return (
    <>
      <SelectionOverlay
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      >
        <div 
          className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative overflow-hidden cursor-pointer"
          onClick={isSelectionMode ? undefined : () => setShowModal(true)}
        >
        {/* Glow effect when on */}
        {state === 'on' && (
          <div className="absolute inset-0 bg-purple-500/10 blur-2xl" />
        )}
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${state === 'on' ? 'bg-purple-500/20' : 'bg-gray-700'}`}>
                <Power className={`w-5 h-5 ${state === 'on' ? 'text-purple-400' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{friendlyName}</h3>
                <p className="text-xs text-gray-500 truncate">{entityId}</p>
                <p className="text-xs text-gray-400">
                  {state === 'on' ? 'On' : 'Off'}
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelectionMode) {
                  handleToggle(e);
                }
              }}
              disabled={isSelectionMode}
              className={`p-2 rounded-lg transition-all ${
                state === 'on' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } ${isSelectionMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Power className="w-5 h-5" />
            </button>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wider">SWITCH</span>
          </div>
        </div>
      </div>
      </SelectionOverlay>
      
      {/* Device Modal */}
      {showModal && (
        <DeviceModal
          entityId={entityId}
          entity={entity}
          onClose={() => setShowModal(false)}
          onEntityUpdate={onEntityUpdate}
          rooms={rooms}
          isCustom={isCustom}
        />
      )}
    </>
  );
};

export default SwitchCard;