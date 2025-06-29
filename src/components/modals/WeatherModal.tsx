import React from 'react';
import { 
  X, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  CloudDrizzle, 
  Zap, 
  Wind, 
  Droplets, 
  Eye,
  Thermometer,
  Gauge,
  MapPin,
  Info
} from 'lucide-react';

interface WeatherModalProps {
  entity: any;
  onClose: () => void;
}

const WeatherModal: React.FC<WeatherModalProps> = ({ entity, onClose }) => {
  const attributes = entity.attributes || {};
  const state = entity.state;
  
  // Debug logging
  console.log('[WeatherModal] Entity data:', {
    entityId: entity.entity_id,
    state,
    attributes,
    forecast: attributes.forecast
  });
  
  const temperature = attributes.temperature;
  const humidity = attributes.humidity;
  const pressure = attributes.pressure;
  const windSpeed = attributes.wind_speed;
  const windBearing = attributes.wind_bearing;
  const visibility = attributes.visibility;
  const forecast = attributes.forecast || [];
  const attribution = attributes.attribution || 'Weather data';
  
  // Extract location from friendly name or entity ID
  const friendlyName = attributes.friendly_name || '';
  let location = friendlyName.replace(/weather/i, '').trim();
  
  // If location is just "Home" or empty, try to get more specific info
  if (!location || location.toLowerCase() === 'home') {
    // Check if there's any location data in attributes
    if (attributes.location) {
      location = attributes.location;
    } else if (attributes.station) {
      location = attributes.station;
    } else {
      location = 'Home Location';
    }
  }
  
  // Get weather icon based on state
  const getWeatherIcon = (condition: string, size: string = "w-8 h-8") => {
    const iconProps = { className: size };
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
  
  // Convert wind bearing to compass direction
  const getWindDirection = (bearing: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <h2 className="text-2xl font-bold text-white">{location}</h2>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              <Info className="w-4 h-4" />
              {attribution}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Weather */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-blue-400">
                {getWeatherIcon(state, "w-16 h-16")}
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Conditions</p>
                <p className="text-3xl font-bold text-white capitalize">{state}</p>
              </div>
            </div>
            {temperature !== undefined && (
              <div className="text-6xl font-bold text-white">
                {Math.round(temperature)}°
              </div>
            )}
          </div>
          
          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {humidity !== undefined && (
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Droplets className="w-4 h-4" />
                  <span className="text-xs uppercase">Humidity</span>
                </div>
                <p className="text-xl font-semibold text-white">{humidity}%</p>
              </div>
            )}
            
            {windSpeed !== undefined && (
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Wind className="w-4 h-4" />
                  <span className="text-xs uppercase">Wind</span>
                </div>
                <p className="text-xl font-semibold text-white">
                  {windSpeed} km/h
                  {windBearing !== undefined && (
                    <span className="text-sm text-gray-400 ml-1">
                      {getWindDirection(windBearing)}
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {pressure !== undefined && (
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs uppercase">Pressure</span>
                </div>
                <p className="text-xl font-semibold text-white">{pressure} hPa</p>
              </div>
            )}
            
            {visibility !== undefined && (
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs uppercase">Visibility</span>
                </div>
                <p className="text-xl font-semibold text-white">{visibility} km</p>
              </div>
            )}
          </div>
        </div>

        {/* Extended Forecast */}
        {forecast && forecast.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Extended Forecast</h3>
            <div className="space-y-2">
              {forecast.map((day: any, index: number) => {
                const date = new Date(day.datetime);
                const dayName = date.toLocaleDateString('en', { weekday: 'long' });
                const dateStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                
                return (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-blue-400">
                          {getWeatherIcon(day.condition, "w-10 h-10")}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{dayName}</p>
                          <p className="text-sm text-gray-400">{dateStr}</p>
                          <p className="text-sm text-gray-300 capitalize mt-1">{day.condition}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {/* Temperature */}
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-orange-400" />
                            <span className="text-2xl font-semibold text-white">
                              {Math.round(day.temperature)}°
                            </span>
                          </div>
                          {day.templow !== undefined && (
                            <p className="text-sm text-gray-400">
                              Low: {Math.round(day.templow)}°
                            </p>
                          )}
                        </div>
                        
                        {/* Precipitation */}
                        {(day.precipitation !== undefined || day.precipitation_probability !== undefined) && (
                          <div className="text-right">
                            {day.precipitation !== undefined && (
                              <div className="flex items-center gap-1">
                                <Droplets className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-gray-300">
                                  {day.precipitation}mm
                                </span>
                              </div>
                            )}
                            {day.precipitation_probability !== undefined && (
                              <p className="text-xs text-gray-500">
                                {day.precipitation_probability}% chance
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Wind */}
                        {day.wind_speed !== undefined && (
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Wind className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">
                                {Math.round(day.wind_speed)} km/h
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">No forecast data available</p>
            <p className="text-sm text-gray-500 mt-2">Forecast information may not be provided by your weather integration</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherModal;