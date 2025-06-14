import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { Lock, Unlock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LockCardProps {
  entityId: string;
  entity: any;
}

const LockCard: React.FC<LockCardProps> = ({ entityId, entity }) => {
  const { callService } = useHomeAssistant();
  const [isControlling, setIsControlling] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const isLocked = state === 'locked';
  const isLocking = state === 'locking';
  const isUnlocking = state === 'unlocking';
  const isJammed = state === 'jammed';
  
  const handleToggle = async () => {
    if (isControlling || isLocking || isUnlocking) return;
    setIsControlling(true);
    
    try {
      const service = isLocked ? 'unlock' : 'lock';
      await callService('lock', service, {
        entity_id: entityId,
      });
    } catch (error) {
      console.error('Failed to toggle lock:', error);
    } finally {
      setTimeout(() => setIsControlling(false), 300);
    }
  };
  
  const getStateColor = () => {
    if (isJammed) return 'bg-red-500';
    if (isLocking || isUnlocking) return 'bg-yellow-500';
    if (isLocked) return 'bg-green-500';
    return 'bg-orange-500';
  };
  
  const getIcon = () => {
    const iconProps = { className: "w-6 h-6" };
    if (isJammed) return <AlertTriangle {...iconProps} />;
    if (isLocked || isLocking) return <Lock {...iconProps} />;
    return <Unlock {...iconProps} />;
  };
  
  const getStateText = () => {
    if (isJammed) return 'Jammed';
    if (isLocking) return 'Locking...';
    if (isUnlocking) return 'Unlocking...';
    if (isLocked) return 'Locked';
    return 'Unlocked';
  };
  
  const getButtonText = () => {
    if (isLocking) return 'Locking...';
    if (isUnlocking) return 'Unlocking...';
    if (isLocked) return 'Unlock';
    return 'Lock';
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-3 h-3 rounded-full ${getStateColor()}`}></div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-medium truncate">{friendlyName}</h3>
            <p className="text-sm text-gray-400">{getStateText()}</p>
          </div>
        </div>
        <div className={`p-2 rounded-lg ${isLocked ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
          {getIcon()}
        </div>
      </div>
      
      {/* Lock Status Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-center py-4">
          {isLocked ? (
            <ShieldCheck className="w-12 h-12 text-green-400" />
          ) : (
            <Unlock className="w-12 h-12 text-orange-400" />
          )}
        </div>
      </div>
      
      {/* Control Button */}
      <button
        onClick={handleToggle}
        disabled={isControlling || isJammed || isLocking || isUnlocking}
        className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
          isLocked 
            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {getIcon()}
        {getButtonText()}
      </button>
      
      {/* Additional Info */}
      {entity.attributes?.lock_status && (
        <div className="mt-3 text-xs text-gray-500">
          Status: {entity.attributes.lock_status}
        </div>
      )}
      
      <div className="mt-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">LOCK</span>
      </div>
    </div>
  );
};

export default LockCard;