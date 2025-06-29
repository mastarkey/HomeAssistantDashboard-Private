import React, { useState } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  X, 
  ChevronUp, 
  ChevronDown, 
  Square,
  Edit2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { DeviceInfoSection } from './DeviceInfoSection';
import EditDeviceModal from './EditDeviceModal';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { getDeviceForEntity } from '../utils/deviceRegistry';

interface CoverModalProps {
  entityId: string;
  entity: any;
  relatedEntities?: Array<[string, any]>; // For grouped blinds (top/bottom, left/right)
  onClose: () => void;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const CoverModal: React.FC<CoverModalProps> = ({ 
  entityId, 
  entity, 
  relatedEntities = [],
  onClose, 
  onEntityUpdate, 
  rooms = [] 
}) => {
  const { callService, entities, devices, areas } = useHomeAssistant();
  const { customCategories } = useCustomCategories();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const isOpening = state === 'opening';
  const isClosing = state === 'closing';
  
  // Check for supported features
  const supportedFeatures = entity.attributes?.supported_features || 0;
  const supportsPosition = (supportedFeatures & 4) !== 0;
  const supportsTilt = (supportedFeatures & 128) !== 0;
  const supportsStop = (supportedFeatures & 8) !== 0;
  
  // Get device information
  const device = getDeviceForEntity(entityId, entities || {}, devices);
  
  // Check if we have related entities (top/bottom or left/right)
  const hasMultipleParts = relatedEntities.length > 0;
  const allEntities = hasMultipleParts ? [[entityId, entity], ...relatedEntities] : [[entityId, entity]];
  
  // Group entities by their position (top/bottom, left/right)
  const groupedEntities = allEntities.reduce((acc, [eid, ent]) => {
    const position = eid.includes('_top') || ent.attributes?.friendly_name?.toLowerCase().includes('top') ? 'top' :
                    eid.includes('_bottom') || ent.attributes?.friendly_name?.toLowerCase().includes('bottom') ? 'bottom' :
                    eid.includes('_left') || ent.attributes?.friendly_name?.toLowerCase().includes('left') ? 'left' :
                    eid.includes('_right') || ent.attributes?.friendly_name?.toLowerCase().includes('right') ? 'right' :
                    'main';
    acc[position] = [eid, ent];
    return acc;
  }, {} as Record<string, [string, any]>);
  
  const handleOpen = async (targetEntityId?: string) => {
    setIsControlling(true);
    try {
      await callService('cover', 'open_cover', {
        entity_id: targetEntityId || entityId
      });
    } catch (error) {
      console.error('Failed to open cover:', error);
    } finally {
      setTimeout(() => setIsControlling(false), 1000);
    }
  };
  
  const handleClose = async (targetEntityId?: string) => {
    setIsControlling(true);
    try {
      await callService('cover', 'close_cover', {
        entity_id: targetEntityId || entityId
      });
    } catch (error) {
      console.error('Failed to close cover:', error);
    } finally {
      setTimeout(() => setIsControlling(false), 1000);
    }
  };
  
  const handleStop = async (targetEntityId?: string) => {
    setIsControlling(true);
    try {
      await callService('cover', 'stop_cover', {
        entity_id: targetEntityId || entityId
      });
    } catch (error) {
      console.error('Failed to stop cover:', error);
    } finally {
      setTimeout(() => setIsControlling(false), 500);
    }
  };
  
  const handleSetPosition = async (position: number, targetEntityId?: string) => {
    setIsControlling(true);
    try {
      await callService('cover', 'set_cover_position', {
        entity_id: targetEntityId || entityId,
        position: position
      });
    } catch (error) {
      console.error('Failed to set cover position:', error);
    } finally {
      setTimeout(() => setIsControlling(false), 1000);
    }
  };
  
  const handleSetTiltPosition = async (tiltPosition: number, targetEntityId?: string) => {
    setIsControlling(true);
    try {
      await callService('cover', 'set_cover_tilt_position', {
        entity_id: targetEntityId || entityId,
        tilt_position: tiltPosition
      });
    } catch (error) {
      console.error('Failed to set tilt position:', error);
    } finally {
      setTimeout(() => setIsControlling(false), 1000);
    }
  };
  
  // Format last updated time
  const lastUpdated = entity.last_updated || entity.last_changed;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
  };
  
  // Render controls for a single cover entity
  const renderCoverControls = (eid: string, ent: any, label?: string) => {
    const position = ent.attributes?.current_position ?? 0;
    const tiltPos = ent.attributes?.current_tilt_position ?? null;
    const isMoving = ent.state === 'opening' || ent.state === 'closing';
    
    return (
      <div key={eid} className="space-y-4">
        {label && <h4 className="text-sm font-medium text-gray-400">{label}</h4>}
        
        {/* Position Control */}
        {supportsPosition && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Position</span>
              <span className="text-sm text-gray-300">{position}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={position}
              onChange={(e) => handleSetPosition(parseInt(e.target.value), eid)}
              disabled={isControlling || isMoving}
              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer 
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        )}
        
        {/* Tilt Control */}
        {supportsTilt && tiltPos !== null && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Tilt</span>
              <span className="text-sm text-gray-300">{tiltPos}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tiltPos}
              onChange={(e) => handleSetTiltPosition(parseInt(e.target.value), eid)}
              disabled={isControlling || isMoving}
              className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer 
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        )}
        
        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleOpen(eid)}
            disabled={isControlling || isMoving}
            className="py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg 
                     transition-colors flex flex-col items-center gap-1"
          >
            <ChevronUp className="w-5 h-5" />
            <span className="text-xs">Open</span>
          </button>
          
          {supportsStop && (
            <button
              onClick={() => handleStop(eid)}
              disabled={isControlling || !isMoving}
              className="py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg 
                       transition-colors flex flex-col items-center gap-1"
            >
              <Square className="w-5 h-5" />
              <span className="text-xs">Stop</span>
            </button>
          )}
          
          <button
            onClick={() => handleClose(eid)}
            disabled={isControlling || isMoving}
            className="py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg 
                     transition-colors flex flex-col items-center gap-1"
          >
            <ChevronDown className="w-5 h-5" />
            <span className="text-xs">Close</span>
          </button>
        </div>
        
        {/* Quick Position Buttons */}
        {supportsPosition && (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleSetPosition(0, eid)}
              disabled={isControlling || isMoving}
              className="py-2 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg 
                       transition-colors text-xs"
            >
              0%
            </button>
            <button
              onClick={() => handleSetPosition(25, eid)}
              disabled={isControlling || isMoving}
              className="py-2 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg 
                       transition-colors text-xs"
            >
              25%
            </button>
            <button
              onClick={() => handleSetPosition(50, eid)}
              disabled={isControlling || isMoving}
              className="py-2 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg 
                       transition-colors text-xs"
            >
              50%
            </button>
            <button
              onClick={() => handleSetPosition(100, eid)}
              disabled={isControlling || isMoving}
              className="py-2 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg 
                       transition-colors text-xs"
            >
              100%
            </button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-semibold text-white">{friendlyName}</h2>
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Entity ID:</span>
                    <span className="ml-2 text-white font-mono">{entityId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">State:</span>
                    <span className="ml-2 text-white flex items-center gap-2">
                      {state}
                      {isOpening && <ArrowUp className="w-4 h-4 text-green-400 animate-pulse" />}
                      {isClosing && <ArrowDown className="w-4 h-4 text-red-400 animate-pulse" />}
                    </span>
                  </div>
                  {lastUpdated && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Last Updated:</span>
                      <span className="ml-2 text-white">{formatDate(lastUpdated)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Controls Section */}
              <div className="space-y-6">
                {hasMultipleParts ? (
                  // Multiple parts (top/bottom or left/right)
                  <div className="space-y-6">
                    {groupedEntities.top && (
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        {renderCoverControls(...groupedEntities.top, 'Top Control')}
                      </div>
                    )}
                    {groupedEntities.bottom && (
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        {renderCoverControls(...groupedEntities.bottom, 'Bottom Control')}
                      </div>
                    )}
                    {groupedEntities.left && (
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        {renderCoverControls(...groupedEntities.left, 'Left Control')}
                      </div>
                    )}
                    {groupedEntities.right && (
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        {renderCoverControls(...groupedEntities.right, 'Right Control')}
                      </div>
                    )}
                    {groupedEntities.main && !groupedEntities.top && !groupedEntities.bottom && 
                     !groupedEntities.left && !groupedEntities.right && (
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        {renderCoverControls(...groupedEntities.main)}
                      </div>
                    )}
                  </div>
                ) : (
                  // Single entity
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    {renderCoverControls(entityId, entity)}
                  </div>
                )}
              </div>
              
              {/* Device Information */}
              {device && (
                <DeviceInfoSection
                  entityId={entityId}
                  entity={entity}
                  device={device}
                  areas={areas}
                  onCategoryAssign={(categoryId) => {
                    console.log('Assigning to category:', categoryId);
                  }}
                  categories={customCategories}
                />
              )}
              
              {/* All Entities (if grouped) */}
              {hasMultipleParts && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">All Cover Parts</h3>
                  <div className="space-y-2">
                    {allEntities.map(([eid, ent]) => (
                      <div key={eid} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <span className="text-gray-300">{ent.attributes?.friendly_name || eid}</span>
                          <span className="text-xs text-gray-500 ml-2 font-mono">{eid}</span>
                        </div>
                        <span className="text-gray-400">
                          {ent.state} {ent.attributes?.current_position !== undefined && `(${ent.attributes.current_position}%)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && onEntityUpdate && (
        <EditDeviceModal
          entityId={entityId}
          entity={entity}
          onClose={() => setShowEditModal(false)}
          onSave={(name, room) => {
            onEntityUpdate(entityId, { name, room });
            setShowEditModal(false);
          }}
          rooms={rooms}
        />
      )}
    </>
  );
};

export default CoverModal;