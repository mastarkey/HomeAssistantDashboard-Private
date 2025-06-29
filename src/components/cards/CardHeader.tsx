import React from 'react';

interface CardHeaderProps {
  friendlyName: string;
  entityId: string;
  status?: string;
  icon?: React.ReactNode;
  onMenuClick?: (e: React.MouseEvent) => void;
  menuIcon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  friendlyName,
  entityId,
  status,
  icon,
  onMenuClick,
  menuIcon
}) => {
  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium text-lg truncate">{friendlyName}</h3>
        <p className="text-xs text-gray-500 truncate">{entityId}</p>
        {status && (
          <p className="text-sm text-gray-400 mt-1">{status}</p>
        )}
      </div>
      {icon && (
        <div className="ml-2">{icon}</div>
      )}
      {onMenuClick && menuIcon && (
        <button 
          onClick={onMenuClick}
          className="ml-2 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          {menuIcon}
        </button>
      )}
    </div>
  );
};