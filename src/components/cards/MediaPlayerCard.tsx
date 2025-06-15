import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Volume2, 
  VolumeX,
  Power,
  MoreVertical,
  Tv,
  Speaker,
  Monitor,
  Smartphone,
  Cast
} from 'lucide-react';
import MediaPlayerModal from '../MediaPlayerModal';
import { getDeviceForEntity, getDeviceType } from '../../utils/deviceRegistry';

interface MediaPlayerCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const MediaPlayerCard: React.FC<MediaPlayerCardProps> = ({ entityId, entity, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService, devices, entities } = useHomeAssistant();
  const [isControlling, setIsControlling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  const isPlaying = state === 'playing';
  const isPaused = state === 'paused';
  const isOff = state === 'off';
  const mediaTitle = attributes.media_title;
  const mediaArtist = attributes.media_artist;
  const volume = attributes.volume_level;
  const isMuted = attributes.is_volume_muted;
  const source = attributes.source;
  
  // Determine device type
  const getDeviceTypeForCard = (): 'tv' | 'speaker' | 'receiver' | 'streaming' | 'phone' => {
    // First try to use device registry for accurate detection
    if (devices && entities) {
      const device = getDeviceForEntity(entityId, entities, devices);
      if (device) {
        const deviceType = getDeviceType(device, entities);
        switch (deviceType) {
          case 'tv':
          case 'soundbar':
            return 'tv';
          case 'smart_speaker':
          case 'speaker':
            return 'speaker';
          case 'streaming':
            return 'streaming';
          default:
            // Fall through to manual detection
        }
      }
    }
    
    // Fallback to manual detection
    const name = friendlyName.toLowerCase();
    const model = attributes.model_name?.toLowerCase() || '';
    const manufacturer = attributes.manufacturer?.toLowerCase() || '';
    
    // TV detection
    if (name.includes('tv') || 
        model.includes('tv') || 
        attributes.device_class === 'tv' ||
        name.includes('roku') ||
        name.includes('apple tv') ||
        name.includes('chromecast') ||
        name.includes('fire tv')) {
      return 'tv';
    }
    
    // Receiver/AVR detection
    if (name.includes('receiver') || 
        name.includes('avr') || 
        name.includes('denon') ||
        name.includes('yamaha') ||
        name.includes('onkyo') ||
        name.includes('marantz')) {
      return 'receiver';
    }
    
    // Phone/tablet detection
    if (name.includes('phone') || 
        name.includes('iphone') || 
        name.includes('ipad') ||
        name.includes('tablet') ||
        manufacturer.includes('apple') ||
        manufacturer.includes('samsung')) {
      return 'phone';
    }
    
    // Streaming device detection
    if (name.includes('echo') || 
        name.includes('alexa') || 
        name.includes('google home') ||
        name.includes('nest hub') ||
        name.includes('cast')) {
      return 'streaming';
    }
    
    // Default to speaker
    return 'speaker';
  };
  
  const deviceType = getDeviceTypeForCard();
  
  // Get appropriate icon based on device type
  const getDeviceIcon = () => {
    const iconProps = { className: "w-5 h-5" };
    switch (deviceType) {
      case 'tv': return <Tv {...iconProps} />;
      case 'receiver': return <Monitor {...iconProps} />;
      case 'phone': return <Smartphone {...iconProps} />;
      case 'streaming': return <Cast {...iconProps} />;
      case 'speaker': 
      default: return <Speaker {...iconProps} />;
    }
  };
  
  // Check if device supports specific features
  const supportsVolumeControl = attributes.supported_features ? 
    (attributes.supported_features & 4) !== 0 : volume !== undefined;
  const supportsMediaControl = attributes.supported_features ? 
    (attributes.supported_features & 128) !== 0 : true;
  const supportsPreviousNext = attributes.supported_features ? 
    ((attributes.supported_features & 16) !== 0 && (attributes.supported_features & 32) !== 0) : true;
  
  const handleControl = async (service: string, data?: any) => {
    if (isControlling) return;
    setIsControlling(true);
    
    try {
      await callService('media_player', service, {
        entity_id: entityId,
        ...data
      });
    } catch (error) {
      console.error(`Failed to ${service}:`, error);
    } finally {
      setTimeout(() => setIsControlling(false), 300);
    }
  };
  
  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    await handleControl('volume_set', { volume_level: newVolume });
  };
  
  const getStateColor = () => {
    if (isPlaying) return 'bg-green-500';
    if (isPaused) return 'bg-yellow-500';
    if (isOff) return 'bg-gray-600';
    return 'bg-gray-700';
  };
  
  return (
    <>
      <div 
        className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group cursor-pointer relative overflow-hidden"
        onClick={() => setShowModal(true)}
      >
      {/* Background gradient for playing state */}
      {isPlaying && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10" />
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative p-2 bg-gray-700 rounded-lg">
              {getDeviceIcon()}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStateColor()} ${isPlaying ? 'animate-pulse' : ''}`}></div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium truncate">{friendlyName}</h3>
              <p className="text-xs text-gray-400">
                {isOff ? 'Off' : isPaused ? 'Paused' : isPlaying ? 'Playing' : state}
                {source && ` • ${source}`}
              </p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      
        {/* Media Info */}
        {!isOff && mediaTitle && (
          <div className="bg-gray-700/30 rounded-lg p-3 mb-3">
            <p className="text-sm text-white truncate font-medium">{mediaTitle}</p>
            {mediaArtist && (
              <p className="text-xs text-gray-400 truncate mt-1">{mediaArtist}</p>
            )}
          </div>
        )}
      
        {/* Quick Controls */}
        <div className="space-y-3">
          {/* Playback Controls */}
          {!isOff && supportsMediaControl && (
            <div className="flex items-center justify-center gap-1">
              {supportsPreviousNext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleControl('media_previous_track');
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                  disabled={isControlling}
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl(isPlaying ? 'media_pause' : 'media_play');
                }}
                className="p-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-50"
                disabled={isControlling}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              {supportsPreviousNext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleControl('media_next_track');
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                  disabled={isControlling}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Volume Control */}
          {!isOff && supportsVolumeControl && volume !== undefined && (
            <div className="bg-gray-700/30 rounded-lg p-2 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl('volume_mute', { is_volume_muted: !isMuted });
                }}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume || 0}
                onChange={handleVolumeChange}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:hover:bg-purple-400"
              />
              <span className="text-xs text-gray-400 w-10 text-right">
                {Math.round((volume || 0) * 100)}%
              </span>
            </div>
          )}
          
          {/* Always show basic controls */}
          {isOff && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl('turn_on');
                }}
                className="flex-1 p-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center justify-center gap-2"
              >
                <Power className="w-4 h-4" />
                <span className="text-sm">Turn On</span>
              </button>
            </div>
          )}
          
          {/* Power Button and Type Label */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider">MEDIA PLAYER</span>
            {!isOff && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleControl('turn_off');
                }}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <Power className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
      
      {/* Media Player Modal */}
      {showModal && (
        <MediaPlayerModal
          entityId={entityId}
          entity={entity}
          deviceType={deviceType}
          onClose={() => setShowModal(false)}
          onEntityUpdate={onEntityUpdate}
          rooms={rooms}
          isCustom={isCustom}
        />
      )}
    </>
  );
};

export default MediaPlayerCard;