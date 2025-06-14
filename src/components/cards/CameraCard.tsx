import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { Maximize2, RefreshCw } from 'lucide-react';
import CameraModal from '../CameraModal';
import CameraImage from '../CameraImage';

interface CameraCardProps {
  entityId: string;
  entity: any;
}

const CameraCard: React.FC<CameraCardProps> = ({ entityId, entity }) => {
  const { config } = useHomeAssistant();
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const entityPicture = entity.attributes?.entity_picture;

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    setRefreshKey(Date.now());
    // Reset refresh animation after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  return (
    <>
      <div 
        className="bg-gray-800/50 backdrop-blur rounded-2xl overflow-hidden hover:bg-gray-800 transition-all duration-150 group cursor-pointer relative"
        onClick={() => setShowModal(true)}
      >
        {/* Camera Stream */}
        <div className="relative aspect-video bg-gray-900">
          <CameraImage
            entityId={entityId}
            entityPicture={entityPicture}
            hassUrl={config?.hassUrl || ''}
            alt={friendlyName}
            className="w-full h-full object-cover"
            refreshKey={refreshKey}
          />
          
          {/* Overlay with camera info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-medium text-lg">{friendlyName}</h3>
              <p className="text-xs text-gray-300">{state === 'recording' ? 'Recording' : 'Live'}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <button 
                onClick={handleRefresh}
                className={`p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
              <button className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors">
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${state === 'recording' ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">CAMERA</span>
          </div>
        </div>
      </div>
      
      {/* Camera Modal */}
      {showModal && (
        <CameraModal
          entityId={entityId}
          entity={entity}
          onClose={() => setShowModal(false)}
          initialRefreshKey={refreshKey}
        />
      )}
    </>
  );
};

export default CameraCard;