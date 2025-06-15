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
  Clock,
  PlugZap
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
  
  // DEBUG: Log when component is rendered
  console.log(`[DEBUG] EVChargerCard rendering for ${entityId}`, {
    state: entity.state,
    attributes: entity.attributes,
    domain: entityId.split('.')[0]
  });
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Common EV charger states - handle sensor entities that might have numeric states
  const domain = entityId.split('.')[0];
  const isSensor = domain === 'sensor' || domain === 'binary_sensor';
  
  // For sensor entities, check attributes or use default states
  const isCharging = state === 'charging' || attributes.charging_status === 'charging' || 
                    (isSensor && parseFloat(state) > 0 && !isNaN(parseFloat(state)));
  const isConnected = state === 'connected' || attributes.vehicle_connected === true || 
                     attributes.charging_status === 'connected' || 
                     (isSensor && attributes.vehicle_connected);
  const isAvailable = state === 'available' || state === 'on' || 
                     (isSensor && !attributes.vehicle_connected && state !== 'unavailable') || 
                     (!isCharging && !isConnected);
  const isOff = state === 'off' || state === 'unavailable';
  
  // Power and energy metrics
  const chargingPower = attributes.charging_power || attributes.power || attributes.current_power || 0;
  const energyDelivered = attributes.energy_delivered || attributes.session_energy || attributes.energy_session || 0;
  const maxCurrent = attributes.max_current || attributes.current_limit || 32;
  const currentCurrent = attributes.current || attributes.charging_current || 0;
  const voltage = attributes.voltage || 240;
  
  // Time metrics
  const chargingTime = attributes.charging_time || attributes.session_time || null;
  
  // Find related entities - for Tesla Wall Connector, search more broadly
  const findRelatedEntity = (pattern: RegExp): any => {
    if (!entities) return null;
    
    // For Tesla Wall Connector, search all Tesla entities
    if (entityId.toLowerCase().includes('tesla_wall_connector')) {
      const allTeslaEntities = Object.keys(entities).filter(id => 
        id.toLowerCase().includes('tesla_wall_connector')
      );
      
      console.log(`[DEBUG] Looking for pattern ${pattern} in Tesla entities:`, allTeslaEntities);
      
      const relatedId = allTeslaEntities.find(id => pattern.test(id));
      if (relatedId) {
        console.log(`[DEBUG] Found related entity: ${relatedId} = ${entities[relatedId].state}`);
      }
      return relatedId ? entities[relatedId] : null;
    }
    
    // For other chargers, use the original logic
    const relatedId = Object.keys(entities).find(id => 
      id.includes(entityId.split('.')[1]) && pattern.test(id)
    );
    return relatedId ? entities[relatedId] : null;
  };
  
  // Try to find related sensor entities - add Tesla-specific patterns
  const powerSensor = findRelatedEntity(/_(power|charging_power|grid_power)$/);
  const energySensor = findRelatedEntity(/_(energy|session_energy|grid_frequency)$/);
  const currentSensor = findRelatedEntity(/_(current|charging_current|phase_[abc]_current)$/);
  const statusSensor = findRelatedEntity(/_(status|charging_status|handle_temperature|mcu_temperature|pcba_temperature)$/);
  const vehicleConnectedSensor = findRelatedEntity(/vehicle_connected$/);
  const voltagePhaseASensor = findRelatedEntity(/phase_a_voltage$/);
  const contactor = findRelatedEntity(/contactor_closed$/);
  
  // Get actual values from sensors if available
  const actualPower = powerSensor?.state ? parseFloat(powerSensor.state) : chargingPower;
  const actualEnergy = energySensor?.state ? parseFloat(energySensor.state) : energyDelivered;
  const actualCurrent = currentSensor?.state ? parseFloat(currentSensor.state) : currentCurrent;
  const actualStatus = statusSensor?.state || state;
  const isVehicleConnected = vehicleConnectedSensor?.state === 'on' || vehicleConnectedSensor?.state === true;
  const actualVoltage = voltagePhaseASensor?.state ? parseFloat(voltagePhaseASensor.state) : voltage;
  const isContactorClosed = contactor?.state === 'on' || contactor?.state === true;
  
  // Count related Tesla entities
  const relatedTeslaCount = entities ? Object.keys(entities).filter(id => 
    id.toLowerCase().includes('tesla_wall_connector') && id !== entityId
  ).length : 0;
  
  // Determine actual charging state - Tesla-specific logic
  const getChargingState = () => {
    // For Tesla Wall Connector
    if (entityId.toLowerCase().includes('tesla_wall_connector')) {
      if (isContactorClosed && actualCurrent > 0) return 'charging';
      if (isVehicleConnected) return 'connected';
      return 'available';
    }
    
    // For other chargers
    if (actualStatus === 'charging' || isCharging) return 'charging';
    if (actualStatus === 'connected' || actualStatus === 'plugged_in' || isConnected) return 'connected';
    if (actualStatus === 'available' || actualStatus === 'ready' || isAvailable) return 'available';
    if (actualStatus === 'off' || actualStatus === 'unavailable' || isOff) return 'off';
    // For sensor entities with numeric states, determine based on value
    if (isSensor && !isNaN(parseFloat(actualStatus))) {
      const value = parseFloat(actualStatus);
      if (value > 0) return 'charging';
      return 'available';
    }
    return actualStatus || 'off';
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
          
          {/* Status Display */}
          <div className="bg-gray-700/30 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {chargingState === 'charging' ? (
                  <>
                    <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-sm text-white font-medium">Charging</span>
                  </>
                ) : chargingState === 'connected' ? (
                  <>
                    <Car className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white font-medium">Vehicle Connected</span>
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Ready</span>
                  </>
                )}
              </div>
              {chargingState === 'charging' && actualPower > 0 && (
                <span className="text-sm text-yellow-400 font-medium">{formatPower(actualPower)}</span>
              )}
            </div>
            
            {/* Power/Energy Display */}
            {(chargingState === 'charging' || actualEnergy > 0) && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {actualEnergy > 0 && (
                  <div className="flex items-center gap-1">
                    <BatteryCharging className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-gray-300">{formatEnergy(actualEnergy)}</span>
                  </div>
                )}
                {chargingTime && (
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{formatTime(chargingTime)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-700/30 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Current</span>
              </div>
              <p className="text-sm text-white font-medium">{actualCurrent || 0} A</p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <Gauge className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Voltage</span>
              </div>
              <p className="text-sm text-white font-medium">{Math.round(actualVoltage || 0)} V</p>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <PlugZap className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Max</span>
              </div>
              <p className="text-sm text-white font-medium">{maxCurrent || 32} A</p>
            </div>
          </div>
          
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
            
            {chargingState === 'off' && !isSensor && (
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
            {entityId.includes('tesla_wall_connector') && relatedTeslaCount > 0 && (
              <span className="text-xs text-gray-400">+{relatedTeslaCount} sensors</span>
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