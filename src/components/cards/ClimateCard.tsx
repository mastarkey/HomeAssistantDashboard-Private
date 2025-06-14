import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { Thermometer, Droplets, Fan, Power, Minus, Plus, MoreVertical, Flame, Snowflake, Wind } from 'lucide-react';
import ClimateModal from '../ClimateModal';

interface ClimateCardProps {
  entityId: string;
  entity: any;
}

const ClimateCard: React.FC<ClimateCardProps> = ({ entityId, entity }) => {
  const { callService } = useHomeAssistant();
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  const currentTemp = attributes.current_temperature;
  const targetTemp = attributes.temperature;
  const humidity = attributes.current_humidity;
  const hvacMode = state; // off, heat, cool, heat_cool, auto
  const fanMode = attributes.fan_mode;
  const presetMode = attributes.preset_mode;
  
  // HVAC mode colors
  const getModeColor = () => {
    switch (hvacMode) {
      case 'heat': return 'text-orange-500';
      case 'cool': return 'text-blue-500';
      case 'heat_cool': 
      case 'auto': return 'text-green-500';
      case 'off': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };
  
  const getModeIcon = () => {
    const iconClass = "w-5 h-5";
    switch (hvacMode) {
      case 'heat': return <Flame className={iconClass} />;
      case 'cool': return <Snowflake className={iconClass} />;
      case 'heat_cool': 
      case 'auto': return <Wind className={iconClass} />;
      case 'fan_only': return <Fan className={iconClass} />;
      case 'off': return <Power className={iconClass} />;
      default: return <Thermometer className={iconClass} />;
    }
  };
  
  const getModeBackground = () => {
    switch (hvacMode) {
      case 'heat': return 'bg-orange-500/20';
      case 'cool': return 'bg-blue-500/20';
      case 'heat_cool': 
      case 'auto': return 'bg-green-500/20';
      case 'fan_only': return 'bg-purple-500/20';
      case 'off': return 'bg-gray-700';
      default: return 'bg-gray-700';
    }
  };
  
  const adjustTemperature = async (increment: number) => {
    if (!targetTemp || isAdjusting) return;
    
    setIsAdjusting(true);
    try {
      const newTemp = targetTemp + increment;
      await callService('climate', 'set_temperature', {
        entity_id: entityId,
        temperature: newTemp
      });
    } catch (error) {
      console.error('Failed to adjust temperature:', error);
    } finally {
      setTimeout(() => setIsAdjusting(false), 300);
    }
  };
  
  const togglePower = async () => {
    try {
      const service = hvacMode === 'off' ? 'turn_on' : 'turn_off';
      await callService('climate', service, {
        entity_id: entityId
      });
    } catch (error) {
      console.error('Failed to toggle climate:', error);
    }
  };
  
  const cycleHvacMode = async () => {
    const modes = attributes.hvac_modes || ['off', 'heat', 'cool'];
    const currentIndex = modes.indexOf(hvacMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    try {
      await callService('climate', 'set_hvac_mode', {
        entity_id: entityId,
        hvac_mode: modes[nextIndex]
      });
    } catch (error) {
      console.error('Failed to change HVAC mode:', error);
    }
  };
  
  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group min-h-[200px] cursor-pointer"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-medium text-lg">{friendlyName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${getModeBackground()}`}>
                <span className={getModeColor()}>
                  {getModeIcon()}
                </span>
                <span className={`text-sm font-medium ${getModeColor()}`}>
                  {hvacMode.toUpperCase()}
                </span>
              </div>
              {presetMode && (
                <span className="text-xs text-gray-500">• {presetMode}</span>
              )}
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      
      {/* Temperature Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="text-3xl font-bold text-white">
            {currentTemp !== undefined ? `${Math.round(currentTemp)}°` : '--°'}
          </div>
          <div className="text-sm text-gray-400">Current</div>
        </div>
        
        {targetTemp !== undefined && hvacMode !== 'off' && (
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                adjustTemperature(-1);
              }}
              disabled={isAdjusting}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <div className="text-center">
              <div className="text-2xl font-semibold text-white">
                {Math.round(targetTemp)}°
              </div>
              <div className="text-xs text-gray-400">Target</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                adjustTemperature(1);
              }}
              disabled={isAdjusting}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
      
      {/* Additional Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {humidity !== undefined && (
            <div className="flex items-center gap-1 text-gray-400">
              <Droplets className="w-4 h-4" />
              <span>{humidity}%</span>
            </div>
          )}
          {fanMode && (
            <div className="flex items-center gap-1 text-gray-400">
              <Fan className="w-4 h-4" />
              <span className="capitalize">{fanMode}</span>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Quick Mode Controls */}
      <div className="mt-4 bg-gray-700/50 rounded-lg p-1 flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePower();
          }}
          className={`flex-1 p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
            hvacMode === 'off' 
              ? 'bg-gray-600 text-white' 
              : 'bg-transparent text-gray-400 hover:bg-gray-600/50'
          }`}
          title="Power"
        >
          <Power className="w-4 h-4" />
        </button>
        
        {attributes.hvac_modes?.includes('cool') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              callService('climate', 'set_hvac_mode', {
                entity_id: entityId,
                hvac_mode: 'cool'
              });
            }}
            className={`flex-1 p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
              hvacMode === 'cool' 
                ? 'bg-blue-600 text-white' 
                : 'bg-transparent text-gray-400 hover:bg-gray-600/50'
            }`}
            title="Cool"
          >
            <Snowflake className="w-4 h-4" />
          </button>
        )}
        
        {attributes.hvac_modes?.includes('heat') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              callService('climate', 'set_hvac_mode', {
                entity_id: entityId,
                hvac_mode: 'heat'
              });
            }}
            className={`flex-1 p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
              hvacMode === 'heat' 
                ? 'bg-orange-600 text-white' 
                : 'bg-transparent text-gray-400 hover:bg-gray-600/50'
            }`}
            title="Heat"
          >
            <Flame className="w-4 h-4" />
          </button>
        )}
        
        {attributes.hvac_modes?.includes('fan_only') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              callService('climate', 'set_hvac_mode', {
                entity_id: entityId,
                hvac_mode: 'fan_only'
              });
            }}
            className={`flex-1 p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
              hvacMode === 'fan_only' 
                ? 'bg-purple-600 text-white' 
                : 'bg-transparent text-gray-400 hover:bg-gray-600/50'
            }`}
            title="Fan"
          >
            <Fan className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
    
    {/* Climate Modal */}
    {showModal && (
      <ClimateModal
        entityId={entityId}
        entity={entity}
        onClose={() => setShowModal(false)}
      />
    )}
    </>
  );
};

export default ClimateCard;