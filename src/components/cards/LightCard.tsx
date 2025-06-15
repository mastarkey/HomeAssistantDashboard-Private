import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { Lightbulb, Power, Palette } from 'lucide-react';
import LightModal from '../LightModal';

interface LightCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const LightCard: React.FC<LightCardProps> = ({ entityId, entity, onEntityUpdate, rooms, isCustom }) => {
  const { callService } = useHomeAssistant();
  const [isToggling, setIsToggling] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  const domain = entityId.split('.')[0];
  
  const brightness = attributes.brightness;
  const brightnessPercent = brightness ? Math.round((brightness / 255) * 100) : 0;
  const colorTemp = attributes.color_temp_kelvin || attributes.color_temp;
  const rgbColor = attributes.rgb_color;
  const hsColor = attributes.hs_color;
  const supportedFeatures = attributes.supported_features || 0;
  const supportedColorModes = attributes.supported_color_modes || [];
  const effectList = attributes.effect_list || [];
  const currentEffect = attributes.effect;
  
  // Check supported features
  const supportsColorTemp = (supportedFeatures & 2) !== 0 || supportedColorModes.includes('color_temp');
  const supportsColor = (supportedFeatures & 16) !== 0 || 
    supportedColorModes.includes('rgb') || 
    supportedColorModes.includes('hs') || 
    supportedColorModes.includes('xy');
  const supportsEffects = (supportedFeatures & 4) !== 0 || effectList.length > 0;
  
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      await callService('light', state === 'on' ? 'turn_off' : 'turn_on', {
        entity_id: entityId,
      });
    } catch (error) {
      console.error('Failed to toggle light:', error);
    } finally {
      setTimeout(() => setIsToggling(false), 300);
    }
  };
  
  const handleColorChange = async (color: { h: number; s: number; v: number }) => {
    if (isAdjusting) return;
    
    setIsAdjusting(true);
    try {
      // Convert HSV to HS for Home Assistant (0-360, 0-100)
      await callService('light', 'turn_on', {
        entity_id: entityId,
        hs_color: [color.h, color.s],
        brightness_pct: Math.round(color.v)
      });
    } catch (error) {
      console.error('Failed to change color:', error);
    } finally {
      setTimeout(() => setIsAdjusting(false), 100);
    }
  };
  
  const getBackgroundGradient = () => {
    if (state === 'off') return '';
    if (rgbColor) {
      return `linear-gradient(135deg, rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, 0.3), rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, 0.05))`;
    }
    if (colorTemp && supportsColorTemp) {
      // Warmer colors for lower kelvin values
      const warmth = colorTemp < 3000 ? 'rgba(255, 140, 66, 0.2)' : 
                     colorTemp < 4000 ? 'rgba(255, 209, 102, 0.2)' : 
                     colorTemp < 5000 ? 'rgba(255, 255, 255, 0.2)' : 
                     'rgba(107, 203, 255, 0.2)';
      return `linear-gradient(135deg, ${warmth}, transparent)`;
    }
    return '';
  };
  
  // Simple color wheel slider component
  const ColorSlider = () => {
    const hue = hsColor ? hsColor[0] : 0;
    
    return (
      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => {
              const newHue = parseInt(e.target.value);
              handleColorChange({
                h: newHue,
                s: hsColor ? hsColor[1] : 100,
                v: brightnessPercent
              });
            }}
            className="w-full h-3 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                     [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-gray-800"
            style={{
              background: `linear-gradient(to right, 
                hsl(0, 100%, 50%), 
                hsl(60, 100%, 50%), 
                hsl(120, 100%, 50%), 
                hsl(180, 100%, 50%), 
                hsl(240, 100%, 50%), 
                hsl(300, 100%, 50%), 
                hsl(360, 100%, 50%))`
            }}
          />
          {supportsEffects && currentEffect && (
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Palette className="w-3 h-3" />
              <span>{currentEffect}</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <>
      <div 
        className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group relative overflow-hidden cursor-pointer"
        style={{ background: getBackgroundGradient() }}
        onClick={() => setShowModal(true)}
      >
      {/* Glow effect when on */}
      {state === 'on' && (
        <div className="absolute inset-0 bg-yellow-500/10 blur-2xl" />
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${state === 'on' ? 'bg-yellow-500/20' : 'bg-gray-700'}`}>
              <Lightbulb className={`w-5 h-5 ${state === 'on' ? 'text-yellow-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-white font-medium">{friendlyName}</h3>
              {brightnessPercent > 0 && (
                <p className="text-xs text-gray-400">{brightnessPercent}% brightness</p>
              )}
            </div>
          </div>
          <button 
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all ${
              state === 'on' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
        
        {/* Brightness Control - Always show for lights that support it */}
        {domain === 'light' && (
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max="100"
              value={state === 'on' ? brightnessPercent : 0}
              onChange={(e) => {
                e.stopPropagation();
                const value = parseInt(e.target.value);
                if (value === 0) {
                  callService('light', 'turn_off', {
                    entity_id: entityId
                  });
                } else {
                  callService('light', 'turn_on', {
                    entity_id: entityId,
                    brightness_pct: value
                  });
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                       [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-purple-500 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:bg-purple-400
                       [&::-webkit-slider-thumb]:transition-colors"
              style={{
                background: state === 'on' 
                  ? `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${brightnessPercent}%, rgb(55 65 81) ${brightnessPercent}%, rgb(55 65 81) 100%)`
                  : 'rgb(55 65 81)'
              }}
            />
          </div>
        )}
        
        {/* Color Control - Show color slider if supported */}
        {state === 'on' && supportsColor && <ColorSlider />}
        
        {/* Light Type */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider">LIGHT</span>
          {supportsEffects && effectList.length > 0 && (
            <span className="text-xs text-purple-400">
              {effectList.length} effects
            </span>
          )}
        </div>
      </div>
    </div>
    
    {/* Light Modal */}
    {showModal && (
      <LightModal
        entityId={entityId}
        entity={entity}
        onClose={() => setShowModal(false)}
        onEntityUpdate={onEntityUpdate}
        rooms={rooms}
        isCustom={isCustom}
      />
    )}
    </>
  );
};

export default LightCard;