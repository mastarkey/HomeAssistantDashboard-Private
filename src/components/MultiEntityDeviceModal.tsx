import React, { useState } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  X, 
  Activity, 
  Power, 
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Gauge,
  Edit2,
  Trash2
} from 'lucide-react';
import { DeviceInfoSection } from './DeviceInfoSection';
import EditDeviceModal from './EditDeviceModal';
import { useCustomCategories } from '../hooks/useCustomCategories';
import type { Device } from '../utils/deviceRegistry';

interface MultiEntityDeviceModalProps {
  deviceId: string;
  device?: Device;
  entities: Array<[string, any]>;
  primaryEntity: [string, any];
  onClose: () => void;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  onDelete?: (entityId: string) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const MultiEntityDeviceModal: React.FC<MultiEntityDeviceModalProps> = ({ 
  deviceId,
  device,
  entities,
  primaryEntity,
  onClose, 
  onEntityUpdate, 
  onDelete,
  rooms = [], 
  isCustom = false 
}) => {
  const { callService, areas } = useHomeAssistant();
  const { customCategories } = useCustomCategories();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [primaryId, primaryData] = primaryEntity;
  const deviceName = device?.name || primaryData.attributes?.friendly_name || deviceId;
  
  // Group entities by domain
  const groupedEntities = React.useMemo(() => {
    const groups: Record<string, Array<[string, any]>> = {};
    
    entities.forEach(([entityId, entity]) => {
      const domain = entityId.split('.')[0];
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push([entityId, entity]);
    });
    
    // Sort domains by importance
    const domainOrder = ['switch', 'light', 'fan', 'climate', 'sensor', 'binary_sensor'];
    const sortedGroups: Record<string, Array<[string, any]>> = {};
    
    // Add domains in order
    domainOrder.forEach(domain => {
      if (groups[domain]) {
        sortedGroups[domain] = groups[domain];
      }
    });
    
    // Add any remaining domains
    Object.keys(groups).forEach(domain => {
      if (!sortedGroups[domain]) {
        sortedGroups[domain] = groups[domain];
      }
    });
    
    return sortedGroups;
  }, [entities]);
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Render entity based on type
  const renderEntity = ([entityId, entity]: [string, any]) => {
    const domain = entityId.split('.')[0];
    const name = entity.attributes?.friendly_name || entityId.split('.')[1];
    const unit = entity.attributes?.unit_of_measurement || '';
    const isOn = entity.state === 'on';
    
    // Get appropriate icon
    const getIcon = () => {
      if (entityId.includes('_power')) return <Zap className="w-4 h-4 text-gray-500" />;
      if (entityId.includes('_energy')) return <Activity className="w-4 h-4 text-gray-500" />;
      if (entityId.includes('_current') || entityId.includes('_voltage')) return <Gauge className="w-4 h-4 text-gray-500" />;
      if (domain === 'switch') return <Power className="w-4 h-4 text-gray-500" />;
      if (domain === 'binary_sensor') return <Info className="w-4 h-4 text-gray-500" />;
      return <Activity className="w-4 h-4 text-gray-500" />;
    };
    
    return (
      <div key={entityId} className="flex items-center justify-between py-3 px-4 hover:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className="text-sm text-gray-300">{name}</p>
            <p className="text-xs text-gray-500 font-mono">{entityId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* State display */}
          <span className={`text-sm font-medium ${
            isOn ? 'text-green-400' : 
            entity.state === 'unavailable' ? 'text-red-400' : 
            'text-gray-400'
          }`}>
            {entity.state}{unit && ` ${unit}`}
          </span>
          
          {/* Control for switches */}
          {domain === 'switch' && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await callService('switch', isOn ? 'turn_off' : 'turn_on', {
                  entity_id: entityId
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isOn 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {isOn ? 'On' : 'Off'}
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Format last updated time
  const lastUpdated = primaryData.last_updated || primaryData.last_changed;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-semibold text-white">{deviceName}</h2>
            <div className="flex items-center gap-2">
              {onEntityUpdate && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Edit device"
                >
                  <Edit2 className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6 space-y-6">
              {/* Primary Entity Info */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">Primary Entity</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Entity ID:</span>
                    <span className="ml-2 text-white font-mono">{primaryId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">State:</span>
                    <span className="ml-2 text-white">{primaryData.state}</span>
                  </div>
                  {lastUpdated && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Last Updated:</span>
                      <span className="ml-2 text-white">{formatDate(lastUpdated)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Device Information */}
              {(device || entities.length > 1) && (
                <DeviceInfoSection
                  entityId={primaryId}
                  entity={primaryData}
                  device={device}
                  areas={areas}
                  onCategoryAssign={(categoryId) => {
                    console.log('Assigning to category:', categoryId);
                  }}
                  categories={customCategories}
                />
              )}
              
              {/* All Entities */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white">
                  All Entities ({entities.length})
                </h3>
                
                {Object.entries(groupedEntities).map(([domain, domainEntities]) => (
                  <div key={domain} className="border border-gray-700/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(domain)}
                      className="w-full px-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm font-medium text-gray-300 capitalize flex items-center gap-2">
                        {domain.replace('_', ' ')} 
                        <span className="text-xs text-gray-500">({domainEntities.length})</span>
                      </span>
                      {expandedSections[domain] ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    {expandedSections[domain] && (
                      <div className="border-t border-gray-700/50">
                        {domainEntities.map(renderEntity)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-800 flex justify-between">
            {isCustom && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this device?')) {
                    // Handle device deletion
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Device
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-auto px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && onEntityUpdate && (
        <EditDeviceModal
          entityId={primaryId}
          entity={primaryData}
          onClose={() => setShowEditModal(false)}
          onSave={(name, room) => {
            onEntityUpdate(primaryId, { name, room });
            setShowEditModal(false);
          }}
          onDelete={onDelete}
          rooms={rooms}
        />
      )}
    </>
  );
};

export default MultiEntityDeviceModal;