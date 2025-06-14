import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { Lightbulb, Power } from 'lucide-react';
import DeviceModal from '../DeviceModal';

interface LightCardProps {
  entityId: string;
  entity: any;
}

const LightCard: React.FC<LightCardProps> = ({ entityId, entity }) => {
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
  const colorTemp = attributes.color_temp;
  const rgbColor = attributes.rgb_color;
  const supportedFeatures = attributes.supported_features || 0;
  
  const supportsColorTemp = (supportedFeatures & 2) !== 0 || colorTemp !== undefined;
  
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
  
  
  const handleColorTempChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColorTemp = parseInt(e.target.value);
    if (isAdjusting) return;
    
    setIsAdjusting(true);
    try {
      await callService('light', 'turn_on', {
        entity_id: entityId,
        color_temp: newColorTemp
      });
    } catch (error) {
      console.error('Failed to adjust color temperature:', error);
    } finally {
      setTimeout(() => setIsAdjusting(false), 100);
    }
  };
  
  const getBackgroundGradient = () => {
    if (state === 'off') return '';
    if (rgbColor) {
      return `linear-gradient(135deg, rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, 0.2), transparent)`;
    }
    return '';
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
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(e);
            }}
            className={`p-2 rounded-lg transition-all ${
              state === 'on' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
        
        {/* Brightness Control - Show for all lights */}
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
                  // Turn off if dragged to 0
                  callService('light', 'turn_off', {
                    entity_id: entityId
                  });
                } else {
                  // Turn on with brightness
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
        
        {/* Color Temperature Control */}
        {supportsColorTemp && state === 'on' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Warm</span>
              <span>Cool</span>
            </div>
            <input
              type="range"
              min={attributes.min_mireds || 153}
              max={attributes.max_mireds || 500}
              value={colorTemp || 250}
              onChange={(e) => {
                e.stopPropagation();
                handleColorTempChange(e);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #ff8c42, #ffd166, #ffffff, #6bcbff, #4a90e2)'
              }}
            />
          </div>
        )}
        
        {/* Light Type */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider">LIGHT</span>
        </div>
      </div>
    </div>
    
    {/* Device Modal */}
    {showModal && (
      <DeviceModal
        entityId={entityId}
        entity={entity}
        onClose={() => setShowModal(false)}
      />
    )}
    </>
  );
};

export default LightCard;