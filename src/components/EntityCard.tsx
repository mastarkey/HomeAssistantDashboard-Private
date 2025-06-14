import React from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  Power, 
  Lock, 
  Camera,
  Activity,
  MoreVertical,
  Home,
  Settings
} from 'lucide-react';

// Import specialized cards
import ClimateCard from './cards/ClimateCard';
import WeatherCard from './cards/WeatherCard';
import MediaPlayerCard from './cards/MediaPlayerCard';
import LightCard from './cards/LightCard';
import CameraCard from './cards/CameraCard';
import SwitchCard from './cards/SwitchCard';
import SensorCard from './cards/SensorCard';
import CoverCard from './cards/CoverCard';
import LockCard from './cards/LockCard';
import FanCard from './cards/FanCard';

interface EntityCardProps {
  entityId: string;
  entity: any;
}

const EntityCard: React.FC<EntityCardProps> = ({ entityId, entity }) => {
  const domain = entityId.split('.')[0];
  
  // Use specialized cards for specific domains
  switch (domain) {
    case 'climate':
      return <ClimateCard entityId={entityId} entity={entity} />;
    case 'weather':
      return <WeatherCard entityId={entityId} entity={entity} />;
    case 'media_player':
      return <MediaPlayerCard entityId={entityId} entity={entity} />;
    case 'light':
      return <LightCard entityId={entityId} entity={entity} />;
    case 'camera':
      return <CameraCard entityId={entityId} entity={entity} />;
    case 'switch':
      return <SwitchCard entityId={entityId} entity={entity} />;
    case 'sensor':
    case 'binary_sensor':
      return <SensorCard entityId={entityId} entity={entity} />;
    case 'cover':
      return <CoverCard entityId={entityId} entity={entity} />;
    case 'lock':
      return <LockCard entityId={entityId} entity={entity} />;
    case 'fan':
      return <FanCard entityId={entityId} entity={entity} />;
    default:
      // Fall back to generic card for other domains
      return <GenericEntityCard entityId={entityId} entity={entity} />;
  }
};

// Generic card for switches, sensors, and other entities
const GenericEntityCard: React.FC<EntityCardProps> = ({ entityId, entity }) => {
  const { callService } = useHomeAssistant();
  const [isToggling, setIsToggling] = React.useState(false);
  const domain = entityId.split('.')[0];
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;

  // Get appropriate icon based on domain
  const getIcon = () => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (domain) {
      case 'switch':
      case 'input_boolean':
        return <Power {...iconProps} />;
      case 'lock':
        return <Lock {...iconProps} />;
      case 'camera':
        return <Camera {...iconProps} />;
      case 'sensor':
      case 'binary_sensor':
        if (entityId.includes('battery')) return <Activity {...iconProps} />;
        if (entityId.includes('temperature')) return <Activity {...iconProps} />;
        if (entityId.includes('humidity')) return <Activity {...iconProps} />;
        return <Activity {...iconProps} />;
      case 'scene':
      case 'script':
      case 'automation':
        return <Settings {...iconProps} />;
      default:
        return <Home {...iconProps} />;
    }
  };

  // Handle toggle for switches and input_boolean
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!callService || (domain !== 'switch' && domain !== 'input_boolean') || isToggling) return;

    setIsToggling(true);
    try {
      const service = state === 'on' ? 'turn_off' : 'turn_on';
      await callService(domain, service, {
        entity_id: entityId,
      });
    } catch (error) {
      console.error('Failed to toggle entity:', error);
    } finally {
      setTimeout(() => setIsToggling(false), 300);
    }
  };

  // Handle scene/script activation
  const handleActivate = async () => {
    if (!callService) return;
    
    try {
      if (domain === 'scene') {
        await callService('scene', 'turn_on', { entity_id: entityId });
      } else if (domain === 'script') {
        await callService('script', 'turn_on', { entity_id: entityId });
      } else if (domain === 'automation') {
        await callService('automation', 'trigger', { entity_id: entityId });
      }
    } catch (error) {
      console.error('Failed to activate:', error);
    }
  };

  // Get state color
  const getStateColor = () => {
    if (state === 'on') return 'bg-green-500';
    if (state === 'unavailable') return 'bg-gray-600';
    if (state === 'unknown') return 'bg-yellow-600';
    return 'bg-gray-700';
  };

  // Check if entity is toggleable
  const isToggleable = ['switch', 'input_boolean'].includes(domain);
  const isActivatable = ['scene', 'script', 'automation'].includes(domain);

  // Render switch/toggle card
  if (isToggleable) {
    return (
      <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStateColor()}`}></div>
            <span className="text-white font-medium">{friendlyName}</span>
          </div>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider">{domain}</span>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
              state === 'on' ? 'bg-purple-600' : 'bg-gray-700'
            } ${
              isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-200 ${
                state === 'on' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    );
  }

  // Render scene/script/automation card
  if (isActivatable) {
    return (
      <div 
        onClick={handleActivate}
        className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
              {getIcon()}
            </div>
            <span className="text-white font-medium">{friendlyName}</span>
          </div>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Status: {state}</p>
          <span className="text-xs text-gray-500 uppercase tracking-wider">{domain}</span>
        </div>
      </div>
    );
  }

  // Render sensor card
  if (domain === 'sensor' || domain === 'binary_sensor') {
    const unit = entity.attributes?.unit_of_measurement || '';
    const deviceClass = entity.attributes?.device_class || '';
    
    return (
      <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group">
        <div className="flex items-start justify-between mb-3">
          <span className="text-white font-medium">{friendlyName}</span>
          <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
            {getIcon()}
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-2xl font-bold text-white">
            {state}
            {unit && <span className="text-lg font-normal text-gray-400 ml-1">{unit}</span>}
          </p>
          {deviceClass && (
            <p className="text-xs text-gray-500 capitalize">{deviceClass}</p>
          )}
        </div>
        
        <div className="mt-3">
          <span className="text-xs text-gray-500 uppercase tracking-wider">SENSOR</span>
        </div>
      </div>
    );
  }

  // Default card for unknown entities
  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStateColor()}`}></div>
          <span className="text-white font-medium">{friendlyName}</span>
        </div>
        <button 
          onClick={(e) => e.stopPropagation()}
          className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mt-2">
        <p className="text-sm text-gray-400">Status: {state}</p>
      </div>
      
      <div className="mt-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{domain.replace('_', ' ')}</span>
      </div>
    </div>
  );
};

export default EntityCard;