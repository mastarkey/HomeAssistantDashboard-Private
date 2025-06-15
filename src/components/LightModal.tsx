import React, { useState, useEffect, useRef } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { X, Lightbulb, Palette, Sparkles, Edit2 } from 'lucide-react';
import EditDeviceModal from './EditDeviceModal';

interface LightModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const LightModal: React.FC<LightModalProps> = ({ entityId, entity, onClose, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService } = useHomeAssistant();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Light attributes
  const brightness = attributes.brightness;
  const brightnessPercent = brightness ? Math.round((brightness / 255) * 100) : 0;
  const colorTemp = attributes.color_temp_kelvin || attributes.color_temp;
  const rgbColor = attributes.rgb_color;
  const hsColor = attributes.hs_color || [0, 0];
  const supportedFeatures = attributes.supported_features || 0;
  const supportedColorModes = attributes.supported_color_modes || [];
  const effectList = attributes.effect_list || [];
  const currentEffect = attributes.effect || 'None';
  
  // Check supported features
  const supportsBrightness = (supportedFeatures & 1) !== 0 || supportedColorModes.includes('brightness');
  const supportsColorTemp = (supportedFeatures & 2) !== 0 || supportedColorModes.includes('color_temp');
  const supportsColor = (supportedFeatures & 16) !== 0 || 
    supportedColorModes.includes('rgb') || 
    supportedColorModes.includes('hs') || 
    supportedColorModes.includes('xy');
  const supportsEffects = (supportedFeatures & 4) !== 0 || effectList.length > 0;
  
  const [localState, setLocalState] = useState({
    brightness: brightnessPercent,
    colorTemp: colorTemp || 250,
    hue: hsColor[0],
    saturation: hsColor[1],
  });

  useEffect(() => {
    setLocalState({
      brightness: brightnessPercent,
      colorTemp: colorTemp || 250,
      hue: hsColor[0],
      saturation: hsColor[1],
    });
  }, [brightnessPercent, colorTemp, hsColor]);

  const handleToggle = async () => {
    try {
      await callService('light', state === 'on' ? 'turn_off' : 'turn_on', {
        entity_id: entityId,
      });
    } catch (error) {
      console.error('Failed to toggle light:', error);
    }
  };

  const handleBrightnessChange = async (value: number) => {
    setLocalState(prev => ({ ...prev, brightness: value }));
    if (!isAdjusting) {
      setIsAdjusting(true);
      try {
        if (value === 0) {
          await callService('light', 'turn_off', { entity_id: entityId });
        } else {
          await callService('light', 'turn_on', {
            entity_id: entityId,
            brightness_pct: value
          });
        }
      } finally {
        setTimeout(() => setIsAdjusting(false), 100);
      }
    }
  };

  const handleColorTempChange = async (value: number) => {
    setLocalState(prev => ({ ...prev, colorTemp: value }));
    if (!isAdjusting) {
      setIsAdjusting(true);
      try {
        await callService('light', 'turn_on', {
          entity_id: entityId,
          color_temp_kelvin: value
        });
      } finally {
        setTimeout(() => setIsAdjusting(false), 100);
      }
    }
  };

  const handleColorChange = async (h: number, s: number) => {
    setLocalState(prev => ({ ...prev, hue: h, saturation: s }));
    if (!isAdjusting) {
      setIsAdjusting(true);
      try {
        await callService('light', 'turn_on', {
          entity_id: entityId,
          hs_color: [h, s],
          brightness_pct: localState.brightness > 0 ? localState.brightness : 100
        });
      } finally {
        setTimeout(() => setIsAdjusting(false), 100);
      }
    }
  };

  const handleEffectChange = async (effect: string) => {
    try {
      await callService('light', 'turn_on', {
        entity_id: entityId,
        effect: effect === 'None' ? 'none' : effect
      });
    } catch (error) {
      console.error('Failed to set effect:', error);
    }
  };

  const handleColorPickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!colorPickerRef.current) return;
    
    const rect = colorPickerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = Math.min(rect.width, rect.height) / 2;
    
    if (distance <= maxRadius) {
      // Calculate angle (hue)
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      angle = (angle + 360) % 360;
      
      // Calculate saturation based on distance from center
      const saturation = Math.min(100, (distance / maxRadius) * 100);
      
      handleColorChange(angle, saturation);
    }
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  const currentRgb = rgbColor || hslToRgb(localState.hue, localState.saturation, 50);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${state === 'on' ? 'bg-yellow-500/20' : 'bg-gray-800'}`}>
              <Lightbulb className={`w-6 h-6 ${state === 'on' ? 'text-yellow-400' : 'text-gray-400'}`} />
            </div>
            <h2 className="text-2xl font-semibold text-white">{friendlyName}</h2>
          </div>
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

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* Power Toggle */}
            <button
              onClick={handleToggle}
              className={`w-full mb-6 flex items-center gap-3 p-4 ${
                state === 'on' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'
              } text-white rounded-lg transition-colors`}
            >
              <Lightbulb className="w-6 h-6" />
              <span className="text-lg font-medium">
                {state === 'on' ? 'Turn Off' : 'Turn On'}
              </span>
            </button>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Basic Controls */}
              <div className="space-y-6">
                {/* Brightness Control */}
                {supportsBrightness && (
                  <div>
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
                {supportsColorTemp && !supportsColor && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-400">Color Temperature</label>
                      <span className="text-white">{localState.colorTemp}K</span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="6500"
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
                      <span>Warm</span>
                      <span>Cool</span>
                    </div>
                  </div>
                )}

                {/* Effects */}
                {supportsEffects && effectList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <label className="text-gray-400">Effects</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['None', ...effectList].map((effect) => (
                        <button
                          key={effect}
                          onClick={() => handleEffectChange(effect)}
                          className={`p-2 rounded-lg text-sm transition-all ${
                            currentEffect === effect || (currentEffect === 'none' && effect === 'None')
                              ? 'bg-purple-600 text-white' 
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {effect}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Color Picker */}
              {supportsColor && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <label className="text-gray-400">Color</label>
                  </div>
                  
                  {/* Color Wheel */}
                  <div className="relative mb-4">
                    <div
                      ref={colorPickerRef}
                      className="w-64 h-64 mx-auto rounded-full cursor-pointer relative overflow-hidden"
                      onClick={handleColorPickerClick}
                      style={{
                        background: `conic-gradient(from 0deg, 
                          hsl(0, 100%, 50%), 
                          hsl(30, 100%, 50%), 
                          hsl(60, 100%, 50%), 
                          hsl(90, 100%, 50%), 
                          hsl(120, 100%, 50%), 
                          hsl(150, 100%, 50%), 
                          hsl(180, 100%, 50%), 
                          hsl(210, 100%, 50%), 
                          hsl(240, 100%, 50%), 
                          hsl(270, 100%, 50%), 
                          hsl(300, 100%, 50%), 
                          hsl(330, 100%, 50%), 
                          hsl(360, 100%, 50%))`
                      }}
                    >
                      {/* Saturation overlay */}
                      <div className="absolute inset-0 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, transparent 0%, white 100%)'
                        }}
                      />
                      {/* Current color indicator */}
                      <div 
                        className="absolute w-6 h-6 rounded-full border-4 border-white shadow-lg"
                        style={{
                          backgroundColor: `rgb(${currentRgb[0]}, ${currentRgb[1]}, ${currentRgb[2]})`,
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) 
                            rotate(${localState.hue}deg) 
                            translateX(${localState.saturation * 1.28}px) 
                            rotate(-${localState.hue}deg)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-lg shadow-inner"
                        style={{
                          backgroundColor: `rgb(${currentRgb[0]}, ${currentRgb[1]}, ${currentRgb[2]})`
                        }}
                      />
                      <div className="text-sm">
                        <div className="text-gray-400">Current Color</div>
                        <div className="text-white font-mono">
                          RGB({currentRgb[0]}, {currentRgb[1]}, {currentRgb[2]})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Colors */}
                  <div className="mt-4">
                    <label className="text-gray-400 text-sm mb-2 block">Quick Colors</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { h: 0, s: 100, name: 'Red' },
                        { h: 30, s: 100, name: 'Orange' },
                        { h: 60, s: 100, name: 'Yellow' },
                        { h: 120, s: 100, name: 'Green' },
                        { h: 180, s: 100, name: 'Cyan' },
                        { h: 240, s: 100, name: 'Blue' },
                        { h: 280, s: 100, name: 'Purple' },
                        { h: 300, s: 100, name: 'Magenta' },
                        { h: 0, s: 0, name: 'White' },
                      ].map((color) => {
                        const rgb = hslToRgb(color.h, color.s, 50);
                        return (
                          <button
                            key={color.name}
                            onClick={() => handleColorChange(color.h, color.s)}
                            className="w-10 h-10 rounded-lg shadow-md hover:scale-110 transition-transform"
                            style={{
                              backgroundColor: color.s === 0 ? 'white' : `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
                            }}
                            title={color.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Entity Info */}
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Entity ID:</span>
                  <span className="ml-2 text-white font-mono">{entityId}</span>
                </div>
                <div>
                  <span className="text-gray-400">State:</span>
                  <span className="ml-2 text-white">{state}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Device Modal */}
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
    </div>
  );
};

export default LightModal;