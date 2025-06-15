import React, { useState } from 'react';
import { Activity, Droplets, Thermometer, Wind, Zap, Eye, Volume2, MoreVertical } from 'lucide-react';
import EditDeviceModal from '../EditDeviceModal';

interface SensorCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const SensorCard: React.FC<SensorCardProps> = ({ entityId, entity, onEntityUpdate, rooms = [], isCustom = false }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  
  // SPECIAL CASE: Check if this is a Tesla Wall Connector sensor
  // If so, import and use EVChargerCard instead
  if (entityId.toLowerCase().includes('tesla_wall_connector')) {
    console.log(`[DEBUG] SensorCard detected Tesla entity ${entityId}, redirecting to EVChargerCard`);
    const EVChargerCard = React.lazy(() => import('./EVChargerCard'));
    return (
      <React.Suspense fallback={<div className="bg-gray-800/50 rounded-2xl p-4 animate-pulse h-32" />}>
        <EVChargerCard 
          entityId={entityId} 
          entity={entity} 
          onEntityUpdate={onEntityUpdate} 
          rooms={rooms} 
          isCustom={isCustom} 
        />
      </React.Suspense>
    );
  }
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const unit = entity.attributes?.unit_of_measurement || '';
  const deviceClass = entity.attributes?.device_class || '';
  
  // Get appropriate icon based on device class or entity name
  const getIcon = () => {
    const iconProps = { className: "w-8 h-8" };
    
    if (deviceClass === 'temperature' || entityId.includes('temperature')) {
      return <Thermometer {...iconProps} />;
    }
    if (deviceClass === 'humidity' || entityId.includes('humidity')) {
      return <Droplets {...iconProps} />;
    }
    if (deviceClass === 'power' || entityId.includes('power') || unit === 'W' || unit === 'kW') {
      return <Zap {...iconProps} />;
    }
    if (deviceClass === 'energy' || entityId.includes('energy') || unit === 'kWh') {
      return <Zap {...iconProps} />;
    }
    if (deviceClass === 'pressure' || entityId.includes('pressure')) {
      return <Wind {...iconProps} />;
    }
    if (deviceClass === 'illuminance' || entityId.includes('illuminance') || unit === 'lx') {
      return <Eye {...iconProps} />;
    }
    if (deviceClass === 'sound_pressure' || entityId.includes('sound') || unit === 'dB') {
      return <Volume2 {...iconProps} />;
    }
    
    return <Activity {...iconProps} />;
  };
  
  // Get color based on device class
  const getValueColor = () => {
    if (state === 'unavailable' || state === 'unknown') return 'text-gray-500';
    
    if (deviceClass === 'temperature') {
      const temp = parseFloat(state);
      if (temp > 30) return 'text-red-400';
      if (temp > 25) return 'text-orange-400';
      if (temp < 15) return 'text-blue-400';
      return 'text-green-400';
    }
    
    if (deviceClass === 'humidity') {
      const humidity = parseFloat(state);
      if (humidity > 70) return 'text-blue-400';
      if (humidity < 30) return 'text-orange-400';
      return 'text-green-400';
    }
    
    if (deviceClass === 'power' || deviceClass === 'energy') {
      const power = parseFloat(state);
      if (power > 1000) return 'text-red-400';
      if (power > 500) return 'text-orange-400';
      return 'text-green-400';
    }
    
    return 'text-white';
  };
  
  // Format value for display
  const formatValue = () => {
    if (state === 'unavailable' || state === 'unknown') return state;
    
    // For numeric values, limit decimal places
    const numValue = parseFloat(state);
    if (!isNaN(numValue)) {
      if (unit === '°C' || unit === '°F' || unit === '%') {
        return numValue.toFixed(1);
      }
      if (unit === 'W' || unit === 'kW' || unit === 'kWh') {
        return numValue.toFixed(2);
      }
      return numValue.toFixed(0);
    }
    
    return state;
  };
  
  return (
    <>
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{friendlyName}</h3>
          {deviceClass && (
            <p className="text-xs text-gray-500 capitalize mt-1">{deviceClass.replace('_', ' ')}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-gray-400">
            {getIcon()}
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
      
      <div className="mt-4">
        <p className={`text-3xl font-bold ${getValueColor()}`}>
          {formatValue()}
          {unit && <span className="text-xl font-normal text-gray-400 ml-1">{unit}</span>}
        </p>
      </div>
      
      {entity.attributes?.last_updated && (
        <div className="mt-3">
          <p className="text-xs text-gray-500">
            Updated: {new Date(entity.attributes.last_updated).toLocaleTimeString()}
          </p>
        </div>
      )}
      
      <div className="mt-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">SENSOR</span>
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

export default SensorCard;