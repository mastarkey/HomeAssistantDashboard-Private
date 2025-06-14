import React, { useState, useEffect } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { X, Trash2, Lightbulb, ToggleLeft, ToggleRight } from 'lucide-react';
import { getRelatedEntities } from '../utils/deviceFiltering';

interface DeviceModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
}

const DeviceModal: React.FC<DeviceModalProps> = ({ entityId, entity, onClose }) => {
  const { callService, entities } = useHomeAssistant();
  const [localState, setLocalState] = useState({
    brightness: 0,
    colorTemp: 0,
    rgbColor: [255, 255, 255] as [number, number, number],
  });

  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  const domain = entityId.split('.')[0];
  
  // Extract capabilities
  const brightness = attributes.brightness;
  const brightnessPercent = brightness ? Math.round((brightness / 255) * 100) : 0;
  const colorTemp = attributes.color_temp;
  const rgbColor = attributes.rgb_color;
  const supportedFeatures = attributes.supported_features || 0;
  
  // Check supported features
  const supportsBrightness = (supportedFeatures & 1) !== 0;
  const supportsColorTemp = (supportedFeatures & 2) !== 0;

  // Initialize local state
  useEffect(() => {
    setLocalState({
      brightness: brightnessPercent,
      colorTemp: colorTemp || attributes.min_mireds || 250,
      rgbColor: rgbColor || [255, 255, 255],
    });
  }, [brightnessPercent, colorTemp, rgbColor, attributes.min_mireds]);

  // Find related scenes for this entity/room
  const roomName = attributes.room || friendlyName.split(' ')[0];
  const scenes = Object.entries(entities || {})
    .filter(([id]) => id.startsWith('scene.'))
    .filter(([_, scene]: [string, any]) => {
      const sceneName = scene.attributes?.friendly_name || '';
      return sceneName.toLowerCase().includes(roomName.toLowerCase()) ||
             sceneName.toLowerCase().includes(friendlyName.toLowerCase());
    })
    .slice(0, 12); // Limit to 12 scenes
    
  // Get all related entities (sub-entities, sensors, etc.)
  const relatedEntities = getRelatedEntities(entityId, entities || {});

  const handleToggle = async () => {
    try {
      await callService(domain, state === 'on' ? 'turn_off' : 'turn_on', {
        entity_id: entityId,
      });
    } catch (error) {
      console.error('Failed to toggle device:', error);
    }
  };

  const handleBrightnessChange = (value: number) => {
    setLocalState(prev => ({ ...prev, brightness: value }));
    // Apply immediately for better UX
    callService(domain, 'turn_on', {
      entity_id: entityId,
      brightness_pct: value
    });
  };

  const handleColorTempChange = (value: number) => {
    setLocalState(prev => ({ ...prev, colorTemp: value }));
    // Apply immediately
    callService(domain, 'turn_on', {
      entity_id: entityId,
      color_temp: value
    });
  };

  const handleSceneActivate = async (sceneId: string) => {
    try {
      await callService('scene', 'turn_on', {
        entity_id: sceneId,
      });
    } catch (error) {
      console.error('Failed to activate scene:', error);
    }
  };

  // Format last updated time
  const lastUpdated = entity.last_updated || entity.last_changed;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-semibold text-white">{friendlyName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Entity Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Entity ID:</span>
                  <span className="ml-2 text-white font-mono">{entityId}</span>
                </div>
                <div>
                  <span className="text-gray-400">State:</span>
                  <span className="ml-2 text-white">{state}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="ml-2 text-white">{formatDate(lastUpdated)}</span>
                </div>
              </div>
            </div>

            {/* Light Controls */}
            <div className="mb-6">
              <button
                onClick={handleToggle}
                className="w-full flex items-center gap-3 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <div className="p-3 bg-white/10 rounded-lg">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <span className="text-lg font-medium">
                  {state === 'on' ? 'Turn Off' : 'Turn On'}
                </span>
              </button>

              {/* Brightness Control */}
              {supportsBrightness && (
                <div className="mt-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400">Brightness</label>
                    <span className="text-white">{localState.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localState.brightness}
                    onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 
                             [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white 
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:shadow-lg"
                    style={{
                      background: `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${localState.brightness}%, rgb(55 65 81) ${localState.brightness}%, rgb(55 65 81) 100%)`
                    }}
                  />
                </div>
              )}

              {/* Color Temperature Control */}
              {supportsColorTemp && (
                <div className="mb-4">
                  <label className="text-gray-400 block mb-2">Color Temperature</label>
                  <div className="relative">
                    <input
                      type="range"
                      min={attributes.min_mireds || 153}
                      max={attributes.max_mireds || 500}
                      value={localState.colorTemp}
                      onChange={(e) => handleColorTempChange(parseInt(e.target.value))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 
                               [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white 
                               [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                               [&::-webkit-slider-thumb]:shadow-lg"
                      style={{
                        background: 'linear-gradient(to right, #ff8c42, #ffd166, #ffffff, #6bcbff, #4a90e2)'
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Cool</span>
                      <span>Warm</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scenes */}
            {scenes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Scenes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {scenes.map(([sceneId, scene]: [string, any]) => (
                    <button
                      key={sceneId}
                      onClick={() => handleSceneActivate(sceneId)}
                      className="p-3 bg-gray-800/50 hover:bg-purple-600/20 border border-gray-700 hover:border-purple-600 
                               rounded-lg transition-all text-sm text-gray-300 hover:text-white"
                    >
                      {scene.attributes?.friendly_name || sceneId}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related Entities */}
            {relatedEntities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Related Entities</h3>
                <div className="space-y-2">
                  {relatedEntities.map(([relatedId, relatedEntity]: [string, any]) => {
                    const relatedDomain = relatedId.split('.')[0];
                    const relatedState = relatedEntity.state;
                    const relatedName = relatedEntity.attributes?.friendly_name || relatedId;
                    const isOn = relatedState === 'on' || relatedState === 'true' || relatedState === 'home';
                    
                    return (
                      <div key={relatedId} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{relatedName}</div>
                          <div className="text-xs text-gray-400">
                            {relatedDomain} • {relatedState}
                          </div>
                        </div>
                        {(relatedDomain === 'switch' || relatedDomain === 'input_boolean' || relatedDomain === 'binary_sensor') && (
                          <button
                            onClick={() => {
                              if (relatedDomain === 'switch' || relatedDomain === 'input_boolean') {
                                callService(relatedDomain, isOn ? 'turn_off' : 'turn_on', {
                                  entity_id: relatedId
                                });
                              }
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              relatedDomain === 'binary_sensor' 
                                ? 'cursor-default' 
                                : 'hover:bg-gray-700 cursor-pointer'
                            }`}
                            disabled={relatedDomain === 'binary_sensor'}
                          >
                            {isOn ? (
                              <ToggleRight className="w-5 h-5 text-purple-500" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attributes */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Attributes</h3>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(attributes, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-between">
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${friendlyName}?`)) {
                console.log('Delete functionality would be implemented here');
                onClose();
              }
            }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Device
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;