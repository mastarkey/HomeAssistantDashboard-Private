import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { 
  MoreVertical, 
  Power, 
  Zap, 
  Gauge, 
  Activity,
  Settings,
  Car,
  Lightbulb
} from 'lucide-react';
import MultiEntityDeviceModal from '../MultiEntityDeviceModal';
import CoverModal from '../CoverModal';
import { SelectionOverlay } from './SelectionOverlay';
import type { Device } from '../../utils/deviceRegistry';

interface UnifiedDeviceCardProps {
  deviceId: string;
  device?: Device;
  entities: Array<[string, any]>;
  primaryEntity: [string, any];
  onEntityUpdate?: (entityId: string, updates: any) => void;
  onDelete?: (entityId: string) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: () => void;
}

const UnifiedDeviceCard = React.memo<UnifiedDeviceCardProps>(({ 
  deviceId,
  device,
  entities,
  primaryEntity,
  onEntityUpdate, 
  onDelete,
  rooms = [], 
  isCustom = false,
  isSelectionMode = false,
  isSelected = false,
  onSelectionToggle
}) => {
  const { callService } = useHomeAssistant();
  const [showModal, setShowModal] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  
  const [primaryId, primaryData] = primaryEntity;
  const primaryDomain = primaryId.split('.')[0];
  const deviceName = device?.name || primaryData.attributes?.friendly_name || deviceId;
  
  // Determine primary icon based on entity type and state
  const getPrimaryIcon = () => {
    // Special handling for known device types
    if (device?.model?.toLowerCase().includes('wall connector') || 
        device?.manufacturer?.toLowerCase().includes('tesla')) {
      return <Car className="w-5 h-5" />;
    }
    
    // Icon based on primary entity domain
    switch (primaryDomain) {
      case 'light':
        return <Lightbulb className="w-5 h-5" />;
      case 'switch':
        return <Power className="w-5 h-5" />;
      case 'sensor':
        if (primaryId.includes('_power')) return <Zap className="w-5 h-5" />;
        if (primaryId.includes('_energy')) return <Activity className="w-5 h-5" />;
        if (primaryId.includes('_temperature')) return <Gauge className="w-5 h-5" />;
        return <Activity className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };
  
  // Get primary state display
  const getPrimaryStateDisplay = () => {
    const state = primaryData.state;
    const unit = primaryData.attributes?.unit_of_measurement || '';
    
    // For binary states
    if (['on', 'off', 'open', 'closed', 'locked', 'unlocked'].includes(state.toLowerCase())) {
      return state.charAt(0).toUpperCase() + state.slice(1);
    }
    
    // For numeric states with units
    if (unit) {
      return `${state} ${unit}`;
    }
    
    return state;
  };
  
  // Check if primary entity is controllable
  const isControllable = ['light', 'switch', 'fan', 'cover', 'lock'].includes(primaryDomain);
  const isOn = primaryData.state === 'on';
  
  // Handle primary toggle
  const handleToggle = async () => {
    if (!isControllable) return;
    
    setIsControlling(true);
    try {
      await callService(primaryDomain, isOn ? 'turn_off' : 'turn_on', {
        entity_id: primaryId
      });
    } catch (error) {
      console.error('Failed to toggle device:', error);
    } finally {
      setIsControlling(false);
    }
  };
  
  // Get brightness for light entities
  const brightness = primaryDomain === 'light' ? primaryData.attributes?.brightness : null;
  const brightnessPercent = brightness ? Math.round((brightness / 255) * 100) : 0;
  
  const handleBrightnessChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setIsControlling(true);
    try {
      await callService('light', 'turn_on', {
        entity_id: primaryId,
        brightness_pct: value
      });
    } catch (error) {
      console.error('Failed to set brightness:', error);
    } finally {
      setIsControlling(false);
    }
  };
  
  // Check if this is an EV charger
  const isEVCharger = device?.model?.toLowerCase().includes('wall connector') || 
                     device?.manufacturer?.toLowerCase().includes('tesla') ||
                     deviceName.toLowerCase().includes('tesla') ||
                     deviceName.toLowerCase().includes('wall connector');
  
  // Get key metrics for special devices
  const getDeviceMetrics = () => {
    if (isEVCharger) {
      // Find key sensors for EV charger
      const powerSensor = entities.find(([id]) => id.includes('_power'));
      const energySensor = entities.find(([id]) => id.includes('_energy'));
      const currentSensor = entities.find(([id]) => id.includes('_current'));
      const voltageSensor = entities.find(([id]) => id.includes('_voltage'));
      
      return {
        power: powerSensor ? `${powerSensor[1].state} ${powerSensor[1].attributes?.unit_of_measurement || ''}` : null,
        energy: energySensor ? `${energySensor[1].state} ${energySensor[1].attributes?.unit_of_measurement || ''}` : null,
        current: currentSensor ? `${currentSensor[1].state} ${currentSensor[1].attributes?.unit_of_measurement || ''}` : null,
        voltage: voltageSensor ? `${voltageSensor[1].state} ${voltageSensor[1].attributes?.unit_of_measurement || ''}` : null
      };
    }
    return null;
  };
  
  const deviceMetrics = getDeviceMetrics();
  
  // Get entity count by type for badges
  const getEntityCounts = () => {
    const counts: Record<string, number> = {};
    entities.forEach(([id]) => {
      const domain = id.split('.')[0];
      counts[domain] = (counts[domain] || 0) + 1;
    });
    return counts;
  };
  
  const entityCounts = getEntityCounts();
  
  return (
    <>
      <SelectionOverlay
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      >
        <div 
          onClick={isSelectionMode ? undefined : () => setShowModal(true)}
          className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group cursor-pointer"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                isOn && isControllable ? 'bg-purple-500/20' : 'bg-gray-700'
              }`}>
                <div className={isOn && isControllable ? 'text-purple-400' : 'text-gray-400'}>
                  {getPrimaryIcon()}
                </div>
              </div>
              <div>
                <h3 className="text-white font-medium">{deviceName}</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {getPrimaryStateDisplay()}
                  {entities.length > 1 && (
                    <span className="text-xs text-gray-500 ml-2">• {entities.length} entities</span>
                  )}
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          {/* Special device metrics (EV Charger) */}
          {isEVCharger && deviceMetrics && (
            <div className="mb-4 space-y-3">
              {/* Primary status */}
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <Power className="w-4 h-4" />
                  <span className="text-sm">Ready</span>
                </div>
              </div>
              
              {/* Energy display */}
              {deviceMetrics.energy && (
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Activity className="w-3 h-3" />
                    <span>Total Energy</span>
                  </div>
                  <p className="text-lg font-medium text-white">{deviceMetrics.energy}</p>
                </div>
              )}
              
              {/* Key metrics grid */}
              <div className="grid grid-cols-3 gap-2">
                {deviceMetrics.current && (
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400 mb-1">Current</p>
                    <p className="text-sm font-medium text-white">{deviceMetrics.current}</p>
                  </div>
                )}
                {deviceMetrics.voltage && (
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400 mb-1">Voltage</p>
                    <p className="text-sm font-medium text-white">{deviceMetrics.voltage}</p>
                  </div>
                )}
                {deviceMetrics.power && (
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400 mb-1">Power</p>
                    <p className="text-sm font-medium text-white">{deviceMetrics.power}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Brightness control for lights */}
          {primaryDomain === 'light' && isOn && brightness !== null && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Brightness</span>
                <span className="text-sm text-gray-300">{brightnessPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brightnessPercent}
                onChange={handleBrightnessChange}
                disabled={isControlling}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          )}
          
          {/* Primary control button */}
          {isControllable && (
            <button
              onClick={handleToggle}
              disabled={isControlling}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                isOn 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } disabled:opacity-50`}
            >
              <Power className="w-4 h-4" />
              {isOn ? 'Turn Off' : 'Turn On'}
            </button>
          )}
          
          {/* Device type badge and entity counts */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {isEVCharger ? 'EV CHARGER' :
               primaryDomain === 'light' ? 'LIGHT' : 
               primaryDomain === 'switch' ? 'SWITCH' :
               primaryDomain === 'fan' ? 'FAN' :
               device?.model || 'DEVICE'}
            </span>
            
            {/* Entity count badges */}
            {entities.length > 1 && (
              <div className="flex items-center gap-2">
                {entityCounts.sensor > 0 && (
                  <span className="text-xs text-gray-400">+{entityCounts.sensor} sensors</span>
                )}
                {primaryDomain === 'light' && primaryData.attributes?.supported_features && (
                  <span className="text-xs text-purple-400">
                    {primaryData.attributes.effect_list?.length || 0} effects
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </SelectionOverlay>
      
      {/* Modal */}
      {showModal && (() => {
        // For cover entities with multiple parts, use CoverModal
        if (primaryDomain === 'cover' && entities.length > 1) {
          const otherCoverEntities = entities.filter(([id]) => id !== primaryId);
          return (
            <CoverModal
              entityId={primaryId}
              entity={primaryData}
              relatedEntities={otherCoverEntities}
              onClose={() => setShowModal(false)}
              onEntityUpdate={onEntityUpdate}
              rooms={rooms}
              isCustom={isCustom}
            />
          );
        }
        
        // For other multi-entity devices, use MultiEntityDeviceModal
        return (
          <MultiEntityDeviceModal
            deviceId={deviceId}
            device={device}
            entities={entities}
            primaryEntity={primaryEntity}
            onClose={() => setShowModal(false)}
            onEntityUpdate={onEntityUpdate}
            onDelete={onDelete}
            rooms={rooms}
            isCustom={isCustom}
          />
        );
      })()}
    </>
  );
});

UnifiedDeviceCard.displayName = 'UnifiedDeviceCard';

export default UnifiedDeviceCard;