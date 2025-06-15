import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { 
  Car, 
  Zap, 
  BatteryCharging, 
  Power,
  MoreVertical,
  Activity,
  Gauge,
  Clock
} from 'lucide-react';
import EVChargerModal from '../EVChargerModal';

interface EVChargerCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const EVChargerCard: React.FC<EVChargerCardProps> = ({ entityId, entity, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService, entities } = useHomeAssistant();
  const [isControlling, setIsControlling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Common EV charger states
  const isCharging = state === 'charging' || attributes.charging_status === 'charging';
  const isConnected = state === 'connected' || attributes.vehicle_connected === true || attributes.charging_status === 'connected';
  const isAvailable = state === 'available' || state === 'on' || (!isCharging && !isConnected);
  const isOff = state === 'off' || state === 'unavailable';
  
  // Power and energy metrics
  const chargingPower = attributes.charging_power || attributes.power || attributes.current_power || 0;
  const energyDelivered = attributes.energy_delivered || attributes.session_energy || attributes.energy_session || 0;
  const maxCurrent = attributes.max_current || attributes.current_limit || 32;
  const currentCurrent = attributes.current || attributes.charging_current || 0;
  const voltage = attributes.voltage || 240;
  
  // Time metrics
  const chargingTime = attributes.charging_time || attributes.session_time || null;
  
  // Find related entities
  const findRelatedEntity = (pattern: RegExp): any => {
    if (!entities) return null;
    const relatedId = Object.keys(entities).find(id => 
      id.includes(entityId.split('.')[1]) && pattern.test(id)
    );
    return relatedId ? entities[relatedId] : null;
  };
  
  // Try to find related sensor entities
  const powerSensor = findRelatedEntity(/_(power|charging_power)$/);
  const energySensor = findRelatedEntity(/_(energy|session_energy)$/);
  const currentSensor = findRelatedEntity(/_(current|charging_current)$/);
  const statusSensor = findRelatedEntity(/_(status|charging_status)$/);
  
  // Get actual values from sensors if available
  const actualPower = powerSensor?.state ? parseFloat(powerSensor.state) : chargingPower;
  const actualEnergy = energySensor?.state ? parseFloat(energySensor.state) : energyDelivered;
  const actualCurrent = currentSensor?.state ? parseFloat(currentSensor.state) : currentCurrent;
  const actualStatus = statusSensor?.state || state;
  
  // Determine actual charging state
  const getChargingState = () => {
    if (actualStatus === 'charging' || isCharging) return 'charging';
    if (actualStatus === 'connected' || actualStatus === 'plugged_in' || isConnected) return 'connected';
    if (actualStatus === 'available' || actualStatus === 'ready' || isAvailable) return 'available';
    if (actualStatus === 'off' || isOff) return 'off';
    return actualStatus;
  };
  
  const chargingState = getChargingState();
  
  const handleControl = async (service: string, data?: any) => {
    if (isControlling) return;
    setIsControlling(true);
    
    try {
      const domain = entityId.split('.')[0];
      await callService(domain, service, {
        entity_id: entityId,
        ...data
      });
    } catch (error) {
      console.error(`Failed to ${service}:`, error);
    } finally {
      setTimeout(() => setIsControlling(false), 300);
    }
  };
  
  const getStateColor = () => {
    switch (chargingState) {
      case 'charging': return 'bg-green-500 animate-pulse';
      case 'connected': return 'bg-yellow-500';
      case 'available': return 'bg-blue-500';
      case 'off': return 'bg-gray-600';
      default: return 'bg-gray-700';
    }
  };
  
  const getStateText = () => {
    switch (chargingState) {
      case 'charging': return 'Charging';
      case 'connected': return 'Connected';
      case 'available': return 'Available';
      case 'off': return 'Off';
      default: return chargingState;
    }
  };
  
  const formatPower = (power: number) => {
    if (power >= 1000) {
      return `${(power / 1000).toFixed(1)} kW`;
    }
    return `${Math.round(power)} W`;
  };
  
  const formatEnergy = (energy: number) => {
    if (energy >= 1) {
      return `${energy.toFixed(1)} kWh`;
    }
    return `${Math.round(energy * 1000)} Wh`;
  };
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  return (
    <>
      <div 
        className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group cursor-pointer relative overflow-hidden"
        onClick={() => setShowModal(true)}
      >
        {/* Background gradient for charging state */}
        {chargingState === 'charging' && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-blue-600/10" />
        )}
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative p-2 bg-gray-700 rounded-lg">
                <Car className="w-5 h-5 text-white" />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStateColor()}`}></div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-medium truncate">{friendlyName}</h3>
                <p className="text-xs text-gray-400">
                  {getStateText()}
                </p>
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
          
          {/* Charging Info */}
          {chargingState === 'charging' && (
            <div className="bg-gray-700/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white font-medium">{formatPower(actualPower)}</span>
                </div>
                {chargingTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">{formatTime(chargingTime)}</span>
                  </div>
                )}
              </div>
              {actualEnergy > 0 && (
                <div className="flex items-center gap-2">
                  <BatteryCharging className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-300">{formatEnergy(actualEnergy)} delivered</span>
                </div>
              )}
            </div>
          )}
          
          {/* Quick Stats */}
          {(chargingState === 'connected' || chargingState === 'charging') && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-700/30 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Current</span>
                </div>
                <p className="text-sm text-white font-medium">{actualCurrent} A</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Gauge className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Max</span>
                </div>
                <p className="text-sm text-white font-medium">{maxCurrent} A</p>
              </div>
            </div>
          )}
          
          {/* Quick Controls */}
          <div className="space-y-2">
            {chargingState === 'connected' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl('start_charging');
                }}
                className="w-full p-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all flex items-center justify-center gap-2"
                disabled={isControlling}
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Start Charging</span>
              </button>
            )}
            
            {chargingState === 'charging' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl('stop_charging');
                }}
                className="w-full p-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all flex items-center justify-center gap-2"
                disabled={isControlling}
              >
                <Power className="w-4 h-4" />
                <span className="text-sm">Stop Charging</span>
              </button>
            )}
            
            {chargingState === 'off' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl('turn_on');
                }}
                className="w-full p-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center justify-center gap-2"
              >
                <Power className="w-4 h-4" />
                <span className="text-sm">Turn On</span>
              </button>
            )}
          </div>
          
          {/* Type Label */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider">EV CHARGER</span>
            {chargingState !== 'off' && chargingState !== 'available' && (
              <span className="text-xs text-gray-400">{voltage}V</span>
            )}
          </div>
        </div>
      </div>
      
      {/* EV Charger Modal */}
      {showModal && (
        <EVChargerModal
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

export default EVChargerCard;