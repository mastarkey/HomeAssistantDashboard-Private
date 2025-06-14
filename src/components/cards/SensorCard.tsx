import React from 'react';
import { Activity, Droplets, Thermometer, Wind, Zap, Eye, Volume2 } from 'lucide-react';

interface SensorCardProps {
  entityId: string;
  entity: any;
}

const SensorCard: React.FC<SensorCardProps> = ({ entityId, entity }) => {
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
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{friendlyName}</h3>
          {deviceClass && (
            <p className="text-xs text-gray-500 capitalize mt-1">{deviceClass.replace('_', ' ')}</p>
          )}
        </div>
        <div className="text-gray-400 ml-3">
          {getIcon()}
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
  );
};

export default SensorCard;