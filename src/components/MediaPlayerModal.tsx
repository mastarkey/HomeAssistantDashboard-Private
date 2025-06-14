import React, { useState, useEffect } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Volume2, 
  VolumeX,
  Power,
  Tv,
  Speaker,
  Monitor,
  Smartphone,
  Cast,
  List,
  Shuffle,
  Repeat,
  MoreHorizontal,
  Info,
  Activity
} from 'lucide-react';
import { getRelatedEntities } from '../utils/deviceFiltering';

interface MediaPlayerModalProps {
  entityId: string;
  entity: any;
  deviceType: 'tv' | 'speaker' | 'receiver' | 'streaming' | 'phone';
  onClose: () => void;
}

const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ entityId, entity, deviceType, onClose }) => {
  const { callService, entities } = useHomeAssistant();
  const [isControlling, setIsControlling] = useState(false);
  const [showSources, setShowSources] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  const isPlaying = state === 'playing';
  const isPaused = state === 'paused';
  const isOff = state === 'off';
  const mediaTitle = attributes.media_title;
  const mediaArtist = attributes.media_artist;
  const mediaAlbum = attributes.media_album_name;
  const volume = attributes.volume_level;
  const isMuted = attributes.is_volume_muted;
  const source = attributes.source;
  const sourceList = attributes.source_list || [];
  const mediaContentType = attributes.media_content_type;
  const mediaDuration = attributes.media_duration;
  const mediaPosition = attributes.media_position;
  const mediaPositionUpdatedAt = attributes.media_position_updated_at;
  const shuffle = attributes.shuffle;
  const repeat = attributes.repeat;
  const entityPicture = attributes.entity_picture;
  
  // Calculate current position with time update
  const [currentPosition, setCurrentPosition] = useState(mediaPosition || 0);
  
  useEffect(() => {
    if (isPlaying && mediaPosition !== undefined && mediaPositionUpdatedAt) {
      const interval = setInterval(() => {
        const updatedAt = new Date(mediaPositionUpdatedAt).getTime();
        const now = new Date().getTime();
        const elapsed = (now - updatedAt) / 1000;
        setCurrentPosition(Math.min(mediaPosition + elapsed, mediaDuration || Infinity));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, mediaPosition, mediaPositionUpdatedAt, mediaDuration]);
  
  // Get device info
  const deviceModel = attributes.model_name || attributes.model || 'Unknown Model';
  const deviceManufacturer = attributes.manufacturer || 'Unknown';
  const deviceFirmware = attributes.sw_version || attributes.firmware_version || 'Unknown';
  
  // Check supported features
  const supportedFeatures = attributes.supported_features || 0;
  const supportsVolumeControl = (supportedFeatures & 4) !== 0;
  const supportsPreviousTrack = (supportedFeatures & 16) !== 0;
  const supportsNextTrack = (supportedFeatures & 32) !== 0;
  const supportsVolumeStep = (supportedFeatures & 256) !== 0;
  const supportsSelectSource = (supportedFeatures & 2048) !== 0;
  const supportsShuffle = (supportedFeatures & 16384) !== 0;
  const supportsRepeat = (supportedFeatures & 262144) !== 0;
  
  // Get related entities
  const relatedEntities = getRelatedEntities(entityId, entities || {});
  
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
  
  const handleSourceChange = async (newSource: string) => {
    setShowSources(false);
    await handleControl('select_source', { source: newSource });
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getDeviceIcon = () => {
    const iconProps = { className: "w-6 h-6" };
    switch (deviceType) {
      case 'tv': return <Tv {...iconProps} />;
      case 'receiver': return <Monitor {...iconProps} />;
      case 'phone': return <Smartphone {...iconProps} />;
      case 'streaming': return <Cast {...iconProps} />;
      case 'speaker': 
      default: return <Speaker {...iconProps} />;
    }
  };
  
  const getStateColor = () => {
    if (isPlaying) return 'text-green-400';
    if (isPaused) return 'text-yellow-400';
    if (isOff) return 'text-gray-600';
    return 'text-gray-400';
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className={`${getStateColor()}`}>
              {getDeviceIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{friendlyName}</h2>
              <p className="text-sm text-gray-400 mt-1 capitalize">
                {state} {source && `• ${source}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-100px)]">
          {/* Main Content */}
          <div className="lg:w-2/3 p-6 overflow-y-auto">
            {/* Now Playing */}
            {!isOff && (mediaTitle || entityPicture) && (
              <div className="bg-gray-800/50 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-6">
                  {entityPicture && (
                    <img 
                      src={entityPicture} 
                      alt={mediaTitle || 'Album art'}
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-white truncate">{mediaTitle || 'No Media'}</h3>
                    {mediaArtist && (
                      <p className="text-gray-400 mt-1 truncate">{mediaArtist}</p>
                    )}
                    {mediaAlbum && (
                      <p className="text-gray-500 text-sm mt-1 truncate">{mediaAlbum}</p>
                    )}
                    {mediaDuration && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>{formatTime(currentPosition)}</span>
                          <span>{formatTime(mediaDuration)}</span>
                        </div>
                        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 transition-all duration-1000"
                            style={{ width: `${(currentPosition / mediaDuration) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Controls */}
            {!isOff && (
              <div className="space-y-6">
                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4">
                  {supportsShuffle && (
                    <button
                      onClick={() => handleControl('shuffle_set', { shuffle: !shuffle })}
                      className={`p-2 rounded-full transition-all ${
                        shuffle ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                      disabled={isControlling}
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>
                  )}
                  
                  {supportsPreviousTrack && (
                    <button
                      onClick={() => handleControl('media_previous_track')}
                      className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                      disabled={isControlling}
                    >
                      <SkipBack className="w-6 h-6" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleControl(isPlaying ? 'media_pause' : 'media_play')}
                    className="p-4 rounded-full bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-50"
                    disabled={isControlling}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                  
                  {supportsNextTrack && (
                    <button
                      onClick={() => handleControl('media_next_track')}
                      className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                      disabled={isControlling}
                    >
                      <SkipForward className="w-6 h-6" />
                    </button>
                  )}
                  
                  {supportsRepeat && (
                    <button
                      onClick={() => handleControl('repeat_set', { repeat: repeat === 'off' ? 'all' : 'off' })}
                      className={`p-2 rounded-full transition-all ${
                        repeat !== 'off' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                      disabled={isControlling}
                    >
                      <Repeat className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Volume Control */}
                {supportsVolumeControl && volume !== undefined && (
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleControl('volume_mute', { is_volume_muted: !isMuted })}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume || 0}
                        onChange={handleVolumeChange}
                        className="flex-1 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer 
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                                 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-purple-600 
                                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                                 [&::-webkit-slider-thumb]:hover:bg-purple-500"
                      />
                      <span className="text-sm text-gray-400 w-12 text-right">
                        {Math.round((volume || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Source Selection */}
                {supportsSelectSource && sourceList.length > 0 && (
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium flex items-center gap-2">
                        <List className="w-4 h-4" />
                        Source
                      </h4>
                      <button
                        onClick={() => setShowSources(!showSources)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                    {showSources ? (
                      <div className="grid grid-cols-2 gap-2">
                        {sourceList.map((src: string) => (
                          <button
                            key={src}
                            onClick={() => handleSourceChange(src)}
                            className={`p-2 rounded-lg text-sm transition-all ${
                              src === source 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                            }`}
                          >
                            {src}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-300">{source || 'No source selected'}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Device Info */}
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Device Info
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Model:</span>
                  <span className="ml-2 text-white">{deviceManufacturer} {deviceModel}</span>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="ml-2 text-white capitalize">{deviceType}</span>
                </div>
                {deviceFirmware !== 'Unknown' && (
                  <div>
                    <span className="text-gray-400">Firmware:</span>
                    <span className="ml-2 text-white">{deviceFirmware}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Content Type:</span>
                  <span className="ml-2 text-white capitalize">{mediaContentType || 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 border-l border-gray-800 overflow-y-auto">
            {/* Quick Actions */}
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleControl(isOff ? 'turn_on' : 'turn_off')}
                  className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    isOff ? 'bg-gray-700 hover:bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <Power className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">{isOff ? 'Turn On' : 'Turn Off'}</span>
                </button>
                
                {supportsVolumeStep && (
                  <>
                    <button
                      onClick={() => handleControl('volume_up')}
                      className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                      disabled={isControlling}
                    >
                      <span className="text-white text-sm">Volume +</span>
                    </button>
                    <button
                      onClick={() => handleControl('volume_down')}
                      className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                      disabled={isControlling}
                    >
                      <span className="text-white text-sm">Volume -</span>
                    </button>
                  </>
                )}
                
                {!isOff && (
                  <button
                    onClick={() => handleControl('media_stop')}
                    className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    disabled={isControlling}
                  >
                    <span className="text-white text-sm">Stop</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Related Entities */}
            {relatedEntities.length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-white mb-4">Related Devices</h3>
                <div className="space-y-2">
                  {relatedEntities.map(([relatedId, relatedEntity]: [string, any]) => {
                    const relatedName = relatedEntity.attributes?.friendly_name || relatedId;
                    const relatedState = relatedEntity.state;
                    
                    return (
                      <div key={relatedId} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">{relatedName}</span>
                        <span className="text-sm text-gray-500">{relatedState}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Activity Log */}
            <div className="p-6 border-t border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500">Activity log would appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayerModal;