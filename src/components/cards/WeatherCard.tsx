import React, { useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, Zap, Wind, Droplets, Eye, MoreVertical } from 'lucide-react';
import EditDeviceModal from '../EditDeviceModal';

interface WeatherCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ entityId, entity, onEntityUpdate, rooms = [], isCustom = false }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  const temperature = attributes.temperature;
  const humidity = attributes.humidity;
  const pressure = attributes.pressure;
  const windSpeed = attributes.wind_speed;
  const visibility = attributes.visibility;
  const forecast = attributes.forecast || [];
  
  // Get weather icon based on state
  const getWeatherIcon = (condition: string) => {
    const iconProps = { className: "w-8 h-8" };
    switch (condition?.toLowerCase()) {
      case 'sunny':
      case 'clear-night':
        return <Sun {...iconProps} />;
      case 'cloudy':
      case 'partlycloudy':
        return <Cloud {...iconProps} />;
      case 'rainy':
        return <CloudRain {...iconProps} />;
      case 'snowy':
        return <CloudSnow {...iconProps} />;
      case 'lightning':
      case 'lightning-rainy':
        return <Zap {...iconProps} />;
      case 'fog':
      case 'hail':
        return <CloudDrizzle {...iconProps} />;
      default:
        return <Cloud {...iconProps} />;
    }
  };
  
  return (
    <>
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-medium text-lg">{friendlyName}</h3>
          <p className="text-sm text-gray-400 capitalize">{state}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-blue-400">
            {getWeatherIcon(state)}
          </div>
          <div className="relative">
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
      </div>
      
      {/* Current Temperature */}
      {temperature !== undefined && (
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-white">
            {Math.round(temperature)}°
          </div>
        </div>
      )}
      
      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {humidity !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">{humidity}%</span>
          </div>
        )}
        {windSpeed !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Wind className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">{windSpeed} km/h</span>
          </div>
        )}
        {pressure !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 text-gray-400 text-xs font-bold flex items-center justify-center">hPa</div>
            <span className="text-gray-300">{pressure}</span>
          </div>
        )}
        {visibility !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">{visibility} km</span>
          </div>
        )}
      </div>
      
      {/* Mini Forecast */}
      {forecast.length > 0 && (
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="flex items-center justify-between gap-2">
            {forecast.slice(0, 3).map((day: any, index: number) => (
              <div key={index} className="text-center flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(day.datetime).toLocaleDateString('en', { weekday: 'short' })}
                </div>
                <div className="text-blue-400 flex justify-center mb-1">
                  {React.cloneElement(getWeatherIcon(day.condition), { className: "w-5 h-5" })}
                </div>
                <div className="text-xs text-gray-300">
                  {Math.round(day.temperature)}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">WEATHER</span>
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

export default WeatherCard;