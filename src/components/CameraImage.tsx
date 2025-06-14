import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface CameraImageProps {
  entityId: string;
  entityPicture?: string;
  hassUrl: string;
  className?: string;
  alt?: string;
  refreshKey?: number;
}

const CameraImage: React.FC<CameraImageProps> = ({ 
  entityId, 
  entityPicture, 
  hassUrl, 
  className = "w-full h-full object-contain",
  alt = "Camera feed",
  refreshKey = 0
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState(false);
  const [attemptIndex, setAttemptIndex] = useState(0);

  const baseUrl = hassUrl.replace(/\/$/, '');
  const token = localStorage.getItem('ha_access_token');

  // Different URL strategies to try
  const urlStrategies = [
    // Strategy 1: Use entity_picture if available
    () => {
      if (entityPicture) {
        if (entityPicture.startsWith('http')) {
          return entityPicture;
        }
        return `${baseUrl}${entityPicture}`;
      }
      return null;
    },
    // Strategy 2: Standard camera proxy
    () => `${baseUrl}/api/camera_proxy/${entityId}`,
    // Strategy 3: Camera proxy with auth token
    () => token ? `${baseUrl}/api/camera_proxy/${entityId}?token=${token}` : null,
    // Strategy 4: Camera proxy stream
    () => `${baseUrl}/api/camera_proxy_stream/${entityId}`,
    // Strategy 5: Direct image endpoint
    () => `${baseUrl}/api/image/serve/${entityId.replace('camera.', '')}/latest`,
  ];

  useEffect(() => {
    // Reset attempt index when refresh is triggered
    if (refreshKey > 0) {
      setAttemptIndex(0);
      setError(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    const strategy = urlStrategies[attemptIndex];
    const url = strategy();
    if (url) {
      // Add timestamp to force refresh when refreshKey changes
      const refreshedUrl = refreshKey > 0 ? `${url}${url.includes('?') ? '&' : '?'}t=${refreshKey}` : url;
      setImageUrl(refreshedUrl);
      setError(false);
    }
  }, [attemptIndex, entityId, entityPicture, baseUrl, token, refreshKey]);

  const handleError = () => {
    console.log(`Camera URL failed (attempt ${attemptIndex + 1}):`, imageUrl);
    
    if (attemptIndex < urlStrategies.length - 1) {
      setAttemptIndex(attemptIndex + 1);
    } else {
      console.error('All camera URL strategies failed for:', entityId);
      setError(true);
    }
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Camera className="w-16 h-16 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500">No camera feed available</p>
          <p className="text-xs text-gray-600 mt-1">{entityId}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default CameraImage;