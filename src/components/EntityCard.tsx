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
import EditDeviceModal from './EditDeviceModal';
import { SelectionOverlay } from './cards/SelectionOverlay';

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
import VacuumCard from './cards/VacuumCard';
import EVChargerCard from './cards/EVChargerCard';
import NASCard from './cards/NASCard';
import GenericDeviceCard from './cards/GenericDeviceCard';

// Import device type detection
import { getDeviceForEntity } from '../utils/deviceRegistry';
import { getDeviceTypeConfig, getDeviceTypeById } from '../config/deviceTypes';

interface EntityCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  onDelete?: (entityId: string) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: () => void;
}

const EntityCard: React.FC<EntityCardProps> = ({ 
  entityId, 
  entity, 
  onEntityUpdate, 
  onDelete,
  rooms, 
  isCustom,
  isSelectionMode = false,
  isSelected = false,
  onSelectionToggle
}) => {
  const { entities, devices } = useHomeAssistant();
  const domain = entityId.split('.')[0];
  
  // @ts-ignore - onDelete will be passed through to child components
  onDelete;
  
  // DEBUG: Log Tesla entities
  if (entityId.toLowerCase().includes('tesla')) {
    console.log(`[DEBUG] EntityCard rendering Tesla entity: ${entityId}`, {
      domain,
      state: entity.state,
      friendlyName: entity.attributes?.friendly_name
    });
  }
  
  // Try to detect device type from device registry or entity patterns
  const device = devices && entities ? getDeviceForEntity(entityId, entities, devices) : null;
  let deviceTypeConfig = getDeviceTypeConfig(device, entities || { [entityId]: entity }, entityId);
  
  // FALLBACK: Check if this is a Tesla Wall Connector even without device registry
  if (!deviceTypeConfig && 
      (entityId.toLowerCase().includes('tesla_wall_connector') || 
       entityId.toLowerCase().includes('wall_connector') ||
       entity.attributes?.friendly_name?.toLowerCase().includes('tesla wall connector') ||
       entity.attributes?.friendly_name?.toLowerCase().includes('wall connector'))) {
    console.log(`[DEBUG] Fallback detection for Tesla Wall Connector: ${entityId}`);
    // Find the EV charger config
    const evChargerConfig = getDeviceTypeById('ev_charger');
    if (evChargerConfig) {
      deviceTypeConfig = evChargerConfig;
    }
  }
  
  // DEBUG: Log device type detection results for Tesla
  if (entityId.toLowerCase().includes('tesla')) {
    console.log(`[DEBUG] Device type detection for ${entityId}:`, {
      hasDevice: !!device,
      deviceName: device?.name,
      deviceTypeConfig: deviceTypeConfig?.name,
      deviceTypeId: deviceTypeConfig?.id
    });
  }
  
  // If we have a device type configuration, check if we have a specialized card for it
  if (deviceTypeConfig) {
    // Use specialized cards for specific device types
    switch (deviceTypeConfig.id) {
      case 'ev_charger':
        console.log(`[DEBUG] Using EVChargerCard for ${entityId}`);
        return <EVChargerCard 
          entityId={entityId} 
          entity={entity} 
          onEntityUpdate={onEntityUpdate} 
          rooms={rooms || []} 
          isCustom={isCustom}
          isSelectionMode={isSelectionMode}
          isSelected={isSelected}
          onSelectionToggle={onSelectionToggle}
        />;
      case 'nas':
        return <NASCard 
          entityId={entityId} 
          entity={entity} 
          onEntityUpdate={onEntityUpdate} 
          rooms={rooms || []} 
          isCustom={isCustom}
          isSelectionMode={isSelectionMode}
          isSelected={isSelected}
          onSelectionToggle={onSelectionToggle}
        />;
      default:
        // Use generic device card for other device types
        return (
          <GenericDeviceCard 
            entityId={entityId} 
            entity={entity} 
            deviceType={deviceTypeConfig}
            onEntityUpdate={onEntityUpdate} 
            rooms={rooms || []} 
            isCustom={isCustom}
            isSelectionMode={isSelectionMode}
            isSelected={isSelected}
            onSelectionToggle={onSelectionToggle}
          />
        );
    }
  }
  
  // Fall back to specialized cards for specific domains
  switch (domain) {
    case 'climate':
      return <ClimateCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'weather':
      return <WeatherCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'media_player':
      return <MediaPlayerCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'light':
      return <LightCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'camera':
      return <CameraCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'switch':
      return <SwitchCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'sensor':
    case 'binary_sensor':
      return <SensorCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'cover':
      return <CoverCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'lock':
      return <LockCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'fan':
      return <FanCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    case 'vacuum':
      return <VacuumCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
    default:
      // Fall back to generic entity card for other domains
      return <GenericEntityCard 
        entityId={entityId} 
        entity={entity} 
        onEntityUpdate={onEntityUpdate} 
        rooms={rooms || []} 
        isCustom={isCustom}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      />;
  }
};

// Generic card for switches, sensors, and other entities
const GenericEntityCard: React.FC<EntityCardProps> = ({ 
  entityId, 
  entity, 
  onEntityUpdate, 
  onDelete,
  rooms, 
  isCustom,
  isSelectionMode = false,
  isSelected = false,
  onSelectionToggle
}) => {
  const { callService } = useHomeAssistant();
  const [isToggling, setIsToggling] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
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
      <>
        <SelectionOverlay
          isSelectionMode={isSelectionMode}
          isSelected={isSelected}
          onSelectionToggle={onSelectionToggle}
        >
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative"
          >
          
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStateColor()}`}></div>
              <span className="text-white font-medium">{friendlyName}</span>
            </div>
            {onEntityUpdate && !isSelectionMode && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Edit device"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{domain}</span>
            <button
              onClick={handleToggle}
              disabled={isToggling || isSelectionMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                state === 'on' ? 'bg-purple-600' : 'bg-gray-700'
              } ${
                isToggling || isSelectionMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
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
        </SelectionOverlay>
        
        {/* Edit Device Modal */}
        {showEditModal && onEntityUpdate && (
          <EditDeviceModal
            entityId={entityId}
            entity={entity}
            onClose={() => setShowEditModal(false)}
            onSave={onEntityUpdate}
            onDelete={onDelete}
            rooms={rooms || []}
            isCustom={isCustom}
          />
        )}
      </>
    );
  }

  // Render scene/script/automation card
  if (isActivatable) {
    return (
      <>
        <SelectionOverlay
          isSelectionMode={isSelectionMode}
          isSelected={isSelected}
          onSelectionToggle={onSelectionToggle}
        >
          <div 
            onClick={!isSelectionMode ? handleActivate : undefined}
            className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group cursor-pointer relative"
          >
          
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
                {getIcon()}
              </div>
              <span className="text-white font-medium">{friendlyName}</span>
            </div>
            {onEntityUpdate && !isSelectionMode && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Edit device"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Status: {state}</p>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{domain}</span>
          </div>
        </div>
        </SelectionOverlay>
        
        {/* Edit Device Modal */}
        {showEditModal && onEntityUpdate && (
          <EditDeviceModal
            entityId={entityId}
            entity={entity}
            onClose={() => setShowEditModal(false)}
            onSave={onEntityUpdate}
            onDelete={onDelete}
            rooms={rooms || []}
            isCustom={isCustom}
          />
        )}
      </>
    );
  }

  // Render sensor card
  if (domain === 'sensor' || domain === 'binary_sensor') {
    const unit = entity.attributes?.unit_of_measurement || '';
    const deviceClass = entity.attributes?.device_class || '';
    
    return (
      <>
        <SelectionOverlay
          isSelectionMode={isSelectionMode}
          isSelected={isSelected}
          onSelectionToggle={onSelectionToggle}
        >
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative"
          >
          
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
        </SelectionOverlay>
        
        {/* Edit Device Modal */}
        {showEditModal && onEntityUpdate && (
          <EditDeviceModal
            entityId={entityId}
            entity={entity}
            onClose={() => setShowEditModal(false)}
            onSave={onEntityUpdate}
            onDelete={onDelete}
            rooms={rooms || []}
            isCustom={isCustom}
          />
        )}
      </>
    );
  }

  // Default card for unknown entities
  return (
    <>
      <SelectionOverlay
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onSelectionToggle={onSelectionToggle}
      >
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative"
        >
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStateColor()}`}></div>
            <span className="text-white font-medium">{friendlyName}</span>
          </div>
          {onEntityUpdate && !isSelectionMode && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              title="Edit device"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-400">Status: {state}</p>
        </div>
        
        <div className="mt-3">
          <span className="text-xs text-gray-500 uppercase tracking-wider">{domain.replace('_', ' ')}</span>
        </div>
      </div>
      </SelectionOverlay>
      
      {/* Edit Device Modal */}
      {showEditModal && onEntityUpdate && (
        <EditDeviceModal
          entityId={entityId}
          entity={entity}
          onClose={() => setShowEditModal(false)}
          onSave={onEntityUpdate}
          onDelete={onDelete}
          rooms={rooms || []}
          isCustom={isCustom}
        />
      )}
    </>
  );
};

export default EntityCard;