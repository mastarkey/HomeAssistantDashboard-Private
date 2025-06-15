import React, { useState, useEffect } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  X, 
  Car,
  Zap,
  BatteryCharging,
  Power,
  Activity,
  Gauge,
  TrendingUp,
  Calendar,
  Info,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { getRelatedEntities } from '../utils/deviceFiltering';
import EditDeviceModal from './EditDeviceModal';
import { useCustomEntities } from '../hooks/useCustomEntities';
import { useEntityOverrides } from '../hooks/useEntityOverrides';

interface EVChargerModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const EVChargerModal: React.FC<EVChargerModalProps> = ({ entityId, entity, onClose, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService, entities } = useHomeAssistant();
  const { deleteCustomEntity } = useCustomEntities();
  const { setEntityOverride } = useEntityOverrides();
  const [isControlling, setIsControlling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<'today' | 'week' | 'month'>('today');
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Common EV charger states and attributes
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
  const temperature = attributes.temperature || null;
  
  // Time metrics
  const chargingTime = attributes.charging_time || attributes.session_time || null;
  const chargingStartTime = attributes.charging_start_time || null;
  const lastSession = attributes.last_session || null;
  
  // Energy stats
  const energyToday = attributes.energy_today || 0;
  const energyWeek = attributes.energy_week || 0;
  const energyMonth = attributes.energy_month || 0;
  const energyTotal = attributes.energy_total || 0;
  
  // Find related entities
  const relatedEntities = getRelatedEntities(entityId, entities || {});
  
  // Find specific related sensors
  const findRelatedEntity = (pattern: RegExp): any => {
    if (!entities) return null;
    const relatedId = Object.keys(entities).find(id => 
      id.includes(entityId.split('.')[1]) && pattern.test(id)
    );
    return relatedId ? entities[relatedId] : null;
  };
  
  const powerSensor = findRelatedEntity(/_(power|charging_power)$/);
  const energySensor = findRelatedEntity(/_(energy|session_energy)$/);
  const currentSensor = findRelatedEntity(/_(current|charging_current)$/);
  const statusSensor = findRelatedEntity(/_(status|charging_status)$/);
  const voltageSensor = findRelatedEntity(/_voltage$/);
  const temperatureSensor = findRelatedEntity(/_temperature$/);
  
  // Get actual values from sensors if available
  const actualPower = powerSensor?.state ? parseFloat(powerSensor.state) : chargingPower;
  const actualEnergy = energySensor?.state ? parseFloat(energySensor.state) : energyDelivered;
  const actualCurrent = currentSensor?.state ? parseFloat(currentSensor.state) : currentCurrent;
  const actualVoltage = voltageSensor?.state ? parseFloat(voltageSensor.state) : voltage;
  const actualTemperature = temperatureSensor?.state ? parseFloat(temperatureSensor.state) : temperature;
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
  
  // Calculate charging session time
  const [sessionTime, setSessionTime] = useState(chargingTime || 0);
  
  useEffect(() => {
    if (chargingState === 'charging' && chargingStartTime) {
      const interval = setInterval(() => {
        const start = new Date(chargingStartTime).getTime();
        const now = new Date().getTime();
        const elapsed = (now - start) / 1000 / 60; // minutes
        setSessionTime(elapsed);
      }, 10000); // Update every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [chargingState, chargingStartTime]);
  
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
  
  const handleCurrentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCurrent = parseInt(e.target.value);
    await handleControl('set_current_limit', { current: newCurrent });
  };
  
  const getStateColor = () => {
    switch (chargingState) {
      case 'charging': return 'text-green-400';
      case 'connected': return 'text-yellow-400';
      case 'available': return 'text-blue-400';
      case 'off': return 'text-gray-600';
      default: return 'text-gray-400';
    }
  };
  
  const getStateText = () => {
    switch (chargingState) {
      case 'charging': return 'Charging';
      case 'connected': return 'Vehicle Connected';
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
      return `${energy.toFixed(2)} kWh`;
    }
    return `${Math.round(energy * 1000)} Wh`;
  };
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };
  
  const getEnergyForTimeFrame = () => {
    switch (selectedTimeFrame) {
      case 'today': return energyToday;
      case 'week': return energyWeek;
      case 'month': return energyMonth;
      default: return energyToday;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className={`${getStateColor()}`}>
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{friendlyName}</h2>
              <p className="text-sm text-gray-400 mt-1">{getStateText()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-100px)]">
          {/* Main Content */}
          <div className="lg:w-2/3 p-6 overflow-y-auto">
            {/* Current Session */}
            {(chargingState === 'charging' || chargingState === 'connected') && (
              <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Current Session
                </h3>
                
                {chargingState === 'charging' && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-400">Power</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{formatPower(actualPower)}</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BatteryCharging className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Energy Delivered</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{formatEnergy(actualEnergy)}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <span className="text-xs text-gray-400">Current</span>
                    <p className="text-lg font-semibold text-white mt-1">{actualCurrent} A</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <span className="text-xs text-gray-400">Voltage</span>
                    <p className="text-lg font-semibold text-white mt-1">{actualVoltage} V</p>
                  </div>
                  {sessionTime > 0 && (
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <span className="text-xs text-gray-400">Duration</span>
                      <p className="text-lg font-semibold text-white mt-1">{formatTime(sessionTime)}</p>
                    </div>
                  )}
                </div>
                
                {/* Current Limit Control */}
                {chargingState === 'charging' && (
                  <div className="mt-4 bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        Current Limit
                      </span>
                      <span className="text-sm text-gray-400">{actualCurrent} / {maxCurrent} A</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max={maxCurrent}
                      step="1"
                      value={actualCurrent}
                      onChange={handleCurrentChange}
                      className="w-full h-2 bg-gray-600 rounded-full appearance-none cursor-pointer 
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                               [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-600 
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-webkit-slider-thumb]:hover:bg-purple-500"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Energy Statistics */}
            <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Energy Statistics
                </h3>
                <div className="flex gap-2">
                  {['today', 'week', 'month'].map((timeFrame) => (
                    <button
                      key={timeFrame}
                      onClick={() => setSelectedTimeFrame(timeFrame as any)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        selectedTimeFrame === timeFrame 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400 capitalize">{selectedTimeFrame}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatEnergy(getEnergyForTimeFrame())}</p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BatteryCharging className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatEnergy(energyTotal)}</p>
                </div>
              </div>
              
              {lastSession && (
                <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">Last Session</p>
                  <p className="text-white mt-1">
                    {formatEnergy(lastSession.energy)} in {formatTime(lastSession.duration)}
                  </p>
                </div>
              )}
            </div>
            
            {/* Device Info */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Charger Info
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Max Current:</span>
                  <span className="ml-2 text-white">{maxCurrent} A</span>
                </div>
                <div>
                  <span className="text-gray-400">Max Power:</span>
                  <span className="ml-2 text-white">{formatPower(maxCurrent * actualVoltage)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Voltage:</span>
                  <span className="ml-2 text-white">{actualVoltage} V</span>
                </div>
                {actualTemperature !== null && (
                  <div>
                    <span className="text-gray-400">Temperature:</span>
                    <span className="ml-2 text-white">{actualTemperature}°C</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 border-l border-gray-800 overflow-y-auto">
            {/* Quick Actions */}
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {chargingState === 'connected' && (
                  <button
                    onClick={() => handleControl('start_charging')}
                    className="w-full p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-2"
                    disabled={isControlling}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Start Charging</span>
                  </button>
                )}
                
                {chargingState === 'charging' && (
                  <button
                    onClick={() => handleControl('stop_charging')}
                    className="w-full p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2"
                    disabled={isControlling}
                  >
                    <Power className="w-4 h-4" />
                    <span>Stop Charging</span>
                  </button>
                )}
                
                {chargingState === 'off' && (
                  <button
                    onClick={() => handleControl('turn_on')}
                    className="w-full p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                    <span>Turn On</span>
                  </button>
                )}
                
                {chargingState !== 'off' && (
                  <button
                    onClick={() => handleControl('turn_off')}
                    className="w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                    <span>Turn Off</span>
                  </button>
                )}
              </div>
              
              {/* Edit/Delete Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to ${isCustom ? 'delete' : 'hide'} ${friendlyName}?`)) {
                      if (isCustom) {
                        deleteCustomEntity(entityId);
                      } else {
                        setEntityOverride(entityId, { hidden: true });
                        if (onEntityUpdate) {
                          onEntityUpdate(entityId, { hidden: true });
                        }
                      }
                      onClose();
                    }
                  }}
                  className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">{isCustom ? 'Delete' : 'Hide'}</span>
                </button>
              </div>
            </div>
            
            {/* Safety Notice */}
            {chargingState === 'charging' && actualCurrent > maxCurrent * 0.8 && (
              <div className="p-6 border-b border-gray-800">
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-200 font-medium">High Current Draw</p>
                      <p className="text-xs text-yellow-300/70 mt-1">
                        Charging at {Math.round((actualCurrent / maxCurrent) * 100)}% capacity
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Related Entities */}
            {relatedEntities.length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-white mb-4">Related Sensors</h3>
                <div className="space-y-2">
                  {relatedEntities.map(([relatedId, relatedEntity]: [string, any]) => {
                    const relatedName = relatedEntity.attributes?.friendly_name || relatedId;
                    const relatedState = relatedEntity.state;
                    const unit = relatedEntity.attributes?.unit_of_measurement || '';
                    
                    return (
                      <div key={relatedId} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">{relatedName}</span>
                        <span className="text-sm text-gray-500">
                          {relatedState} {unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

export default EVChargerModal;