import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import EditDeviceModal from '../EditDeviceModal';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import type { DeviceTypeConfig } from '../../config/deviceTypes';

interface GenericDeviceCardProps {
  entityId: string;
  entity: any;
  deviceType: DeviceTypeConfig;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const GenericDeviceCard: React.FC<GenericDeviceCardProps> = ({ 
  entityId, 
  entity, 
  deviceType,
  onEntityUpdate, 
  rooms = [], 
  isCustom = false 
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const { callService } = useHomeAssistant();
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const domain = entityId.split('.')[0];
  const Icon = deviceType.icon;
  
  // Get state color based on device type and state
  const getStateColor = () => {
    if (state === 'unavailable') return 'text-gray-500';
    if (state === 'unknown') return 'text-yellow-600';
    
    // For binary states
    if (state === 'on' || state === 'active' || state === 'open') {
      return deviceType.primaryColor;
    }
    
    // For numeric states (sensors)
    if (!isNaN(parseFloat(state))) {
      return deviceType.primaryColor;
    }
    
    return 'text-gray-400';
  };
  
  // Format metric value
  const formatMetricValue = (metricKey: string, value: any) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Handle special metric types
    switch (metricKey) {
      case 'power':
      case 'current_power':
      case 'charging_power':
        return `${parseFloat(value).toFixed(1)} W`;
      case 'energy':
      case 'energy_today':
      case 'energy_total':
      case 'energy_delivered':
        return `${parseFloat(value).toFixed(2)} kWh`;
      case 'battery_level':
      case 'battery_charge':
      case 'disk_usage':
      case 'cpu_usage':
      case 'memory_usage':
      case 'load_percentage':
        return `${parseFloat(value).toFixed(0)}%`;
      case 'temperature':
        return `${parseFloat(value).toFixed(1)}°C`;
      case 'uptime':
        const days = Math.floor(value / 86400);
        const hours = Math.floor((value % 86400) / 3600);
        return `${days}d ${hours}h`;
      case 'runtime_remaining':
        const minutes = Math.floor(value);
        return `${minutes} min`;
      case 'clients_connected':
        return `${value} devices`;
      case 'network_speed':
      case 'bandwidth_usage':
        return `${parseFloat(value).toFixed(1)} Mbps`;
      default:
        return String(value);
    }
  };
  
  // Get metric value from entity
  const getMetricValue = (metricKey: string) => {
    // First check if it's the main state
    if (metricKey === 'state' || metricKey === deviceType.display.primaryMetric) {
      if (domain === 'sensor' || domain === 'binary_sensor') {
        return state;
      }
    }
    
    // Check attributes
    if (entity.attributes?.[metricKey] !== undefined) {
      return entity.attributes[metricKey];
    }
    
    // Check for common attribute mappings
    const mappings: Record<string, string[]> = {
      'power': ['power', 'current_power', 'power_consumption'],
      'energy': ['energy', 'total_energy', 'energy_consumption'],
      'battery_level': ['battery_level', 'battery', 'battery_charge'],
      'temperature': ['temperature', 'current_temperature', 'temp'],
      'disk_usage': ['disk_use_percent', 'disk_usage', 'storage_used'],
      'cpu_usage': ['cpu_percent', 'cpu_usage', 'processor_use'],
      'memory_usage': ['memory_percent', 'memory_usage', 'ram_usage'],
    };
    
    if (mappings[metricKey]) {
      for (const attr of mappings[metricKey]) {
        if (entity.attributes?.[attr] !== undefined) {
          return entity.attributes[attr];
        }
      }
    }
    
    return null;
  };
  
  // Handle device actions
  const handleAction = async (action: any) => {
    if (!callService || isPerformingAction) return;
    
    setIsPerformingAction(true);
    try {
      await callService(domain, action.service, {
        entity_id: entityId,
      });
    } catch (error) {
      console.error('Failed to perform action:', error);
    } finally {
      setTimeout(() => setIsPerformingAction(false), 300);
    }
  };
  
  // Render primary metric
  const renderPrimaryMetric = () => {
    const primaryMetric = deviceType.display.primaryMetric;
    if (!primaryMetric) return null;
    
    const value = getMetricValue(primaryMetric);
    if (value === null) return null;
    
    return (
      <div className="mt-4">
        <p className={`text-3xl font-bold ${getStateColor()}`}>
          {formatMetricValue(primaryMetric, value)}
        </p>
        <p className="text-xs text-gray-500 capitalize mt-1">
          {primaryMetric.replace(/_/g, ' ')}
        </p>
      </div>
    );
  };
  
  // Render secondary metrics
  const renderSecondaryMetrics = () => {
    const metrics = deviceType.display.secondaryMetrics;
    if (!metrics || metrics.length === 0) return null;
    
    const validMetrics = metrics
      .map(metric => ({ key: metric, value: getMetricValue(metric) }))
      .filter(m => m.value !== null);
    
    if (validMetrics.length === 0) return null;
    
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {validMetrics.map(({ key, value }) => (
          <div key={key} className="bg-gray-900/50 rounded-lg p-2">
            <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
            <p className="text-sm font-medium text-white">
              {formatMetricValue(key, value)}
            </p>
          </div>
        ))}
      </div>
    );
  };
  
  // Render action buttons
  const renderActions = () => {
    const actions = deviceType.display.actions;
    if (!actions || actions.length === 0) return null;
    
    return (
      <div className="mt-4 flex gap-2">
        {actions.map(action => {
          const ActionIcon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={isPerformingAction}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                isPerformingAction 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {ActionIcon && <ActionIcon className="w-4 h-4" />}
                <span className="text-sm">{action.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };
  
  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{friendlyName}</h3>
            <p className="text-xs text-gray-500 mt-1">{deviceType.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={getStateColor()}>
              <Icon className="w-8 h-8" />
            </div>
            {onEntityUpdate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Status indicator for non-sensor devices */}
        {deviceType.display.showStatus && domain !== 'sensor' && (
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${
              state === 'on' || state === 'active' ? 'bg-green-500' : 
              state === 'unavailable' ? 'bg-gray-600' : 
              'bg-gray-700'
            }`} />
            <span className="text-sm text-gray-400 capitalize">{state}</span>
          </div>
        )}
        
        {/* Primary metric display */}
        {renderPrimaryMetric()}
        
        {/* Secondary metrics */}
        {renderSecondaryMetrics()}
        
        {/* Action buttons */}
        {renderActions()}
        
        {/* Last updated */}
        {entity.last_changed && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Updated {new Date(entity.last_changed).toLocaleTimeString()}
            </p>
          </div>
        )}
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

export default GenericDeviceCard;