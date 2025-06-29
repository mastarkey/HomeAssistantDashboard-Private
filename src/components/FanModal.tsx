import React, { useState } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  X, 
  Wind,
  RotateCw,
  Gauge,
  Settings,
  ChevronUp,
  ChevronDown,
  Timer,
  Edit2
} from 'lucide-react';
import EditDeviceModal from './EditDeviceModal';
import { DeviceInfoSection } from './DeviceInfoSection';
import { getDeviceForEntity } from '../utils/deviceRegistry';
import { useCustomCategories } from '../hooks/useCustomCategories';

interface FanModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const FanModal: React.FC<FanModalProps> = ({ 
  entityId, 
  entity, 
  onClose, 
  onEntityUpdate,
  rooms = [],
  isCustom = false 
}) => {
  const { callService, entities, devices, areas } = useHomeAssistant();
  const { customCategories } = useCustomCategories();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  const device = entities && devices ? getDeviceForEntity(entityId, entities, devices) : null;
  
  const handleCategoryAssign = (categoryId: string) => {
    console.log(`Assigning ${entityId} to category ${categoryId}`);
    // TODO: Implement category assignment
  };
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Fan attributes
  const speed = attributes.speed || attributes.percentage || 0;
  const speedList = attributes.speed_list || ['low', 'medium', 'high'];
  const currentSpeedMode = attributes.speed || null;
  const oscillating = attributes.oscillating || false;
  const direction = attributes.direction || null;
  const presetMode = attributes.preset_mode || null;
  const presetModes = attributes.preset_modes || [];
  
  // Features support
  const supportsSpeed = attributes.supported_features & 1;
  const supportsOscillate = attributes.supported_features & 2;
  const supportsDirection = attributes.supported_features & 4;
  const supportsPresetMode = attributes.supported_features & 8;
  
  const isOn = state === 'on';
  
  const togglePower = async () => {
    try {
      const service = isOn ? 'turn_off' : 'turn_on';
      await callService('fan', service, {
        entity_id: entityId
      });
    } catch (error) {
      console.error('Failed to toggle fan:', error);
    }
  };
  
  const setSpeed = async (newSpeed: number) => {
    if (isAdjusting) return;
    setIsAdjusting(true);
    
    try {
      await callService('fan', 'set_percentage', {
        entity_id: entityId,
        percentage: newSpeed
      });
    } catch (error) {
      console.error('Failed to set fan speed:', error);
    } finally {
      setTimeout(() => setIsAdjusting(false), 100);
    }
  };
  
  const setSpeedMode = async (mode: string) => {
    try {
      await callService('fan', 'set_speed', {
        entity_id: entityId,
        speed: mode
      });
    } catch (error) {
      console.error('Failed to set fan speed mode:', error);
    }
  };
  
  const toggleOscillate = async () => {
    try {
      await callService('fan', 'oscillate', {
        entity_id: entityId,
        oscillating: !oscillating
      });
    } catch (error) {
      console.error('Failed to toggle oscillation:', error);
    }
  };
  
  const setDirection = async (newDirection: string) => {
    try {
      await callService('fan', 'set_direction', {
        entity_id: entityId,
        direction: newDirection
      });
    } catch (error) {
      console.error('Failed to set direction:', error);
    }
  };
  
  const setPresetMode = async (mode: string) => {
    try {
      await callService('fan', 'set_preset_mode', {
        entity_id: entityId,
        preset_mode: mode
      });
    } catch (error) {
      console.error('Failed to set preset mode:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-semibold text-white">{friendlyName}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
          <p className="text-gray-400">{entityId}</p>
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {/* Main Controls */}
          <div className="p-6 space-y-6">
            {/* Power Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wind className={`w-8 h-8 ${isOn ? 'text-blue-400' : 'text-gray-500'}`} />
                <div>
                  <h3 className="text-lg font-medium text-white">Power</h3>
                  <p className="text-sm text-gray-400">{isOn ? 'On' : 'Off'}</p>
                </div>
              </div>
              <button
                onClick={togglePower}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  isOn ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    isOn ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Speed Control */}
            {isOn && supportsSpeed && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-white">Speed</h3>
                  <span className="text-sm text-gray-400 ml-auto">{speed}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${speed}%, rgb(55, 65, 81) ${speed}%, rgb(55, 65, 81) 100%)`
                  }}
                />
                
                {/* Speed Modes */}
                {speedList.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {speedList.map((mode: any) => (
                      <button
                        key={mode}
                        onClick={() => setSpeedMode(mode)}
                        className={`flex-1 py-2 px-3 rounded-lg capitalize transition-colors ${
                          currentSpeedMode === mode
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Oscillation Control */}
            {isOn && supportsOscillate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCw className={`w-5 h-5 ${oscillating ? 'text-blue-400' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="text-base font-medium text-white">Oscillation</h3>
                    <p className="text-sm text-gray-400">{oscillating ? 'On' : 'Off'}</p>
                  </div>
                </div>
                <button
                  onClick={toggleOscillate}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    oscillating ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      oscillating ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
            
            {/* Direction Control */}
            {isOn && supportsDirection && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <h3 className="text-base font-medium text-white">Direction</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDirection('forward')}
                    className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      direction === 'forward'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    Forward
                  </button>
                  <button
                    onClick={() => setDirection('reverse')}
                    className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      direction === 'reverse'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                    Reverse
                  </button>
                </div>
              </div>
            )}
            
            {/* Preset Modes */}
            {isOn && supportsPresetMode && presetModes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-gray-400" />
                  <h3 className="text-base font-medium text-white">Preset Modes</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {presetModes.map((mode: string) => (
                    <button
                      key={mode}
                      onClick={() => setPresetMode(mode)}
                      className={`py-2 px-3 rounded-lg capitalize transition-colors ${
                        presetMode === mode
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {mode.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Device Information */}
          <div className="p-6 border-t border-gray-800">
            <DeviceInfoSection
              entityId={entityId}
              entity={entity}
              device={device}
              areas={areas}
              onCategoryAssign={handleCategoryAssign}
              categories={customCategories}
            />
          </div>
        </div>
      </div>
      
      {/* Edit Device Modal */}
      {showEditModal && (
        <EditDeviceModal
          entityId={entityId}
          entity={entity}
          onClose={() => setShowEditModal(false)}
          onSave={onEntityUpdate || (() => {})}
          rooms={rooms}
          isCustom={isCustom}
        />
      )}
    </div>
  );
};

export default FanModal;