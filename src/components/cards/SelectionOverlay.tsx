import React from 'react';
import { Check } from 'lucide-react';

interface SelectionOverlayProps {
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelectionToggle?: () => void;
  children: React.ReactNode;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  isSelectionMode,
  isSelected,
  onSelectionToggle,
  children,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    console.log('[SelectionOverlay] Click event:', {
      isSelectionMode,
      hasToggleFunction: !!onSelectionToggle,
      isSelected
    });
    if (isSelectionMode && onSelectionToggle) {
      e.preventDefault();
      e.stopPropagation();
      onSelectionToggle();
    }
  };

  return (
    <div className="relative">
      {children}
      
      {isSelectionMode && (
        <>
          {/* Selection overlay */}
          <div
            className={`absolute inset-0 rounded-2xl transition-all cursor-pointer z-10 ${
              isSelected
                ? 'ring-2 ring-purple-500 bg-purple-500/10'
                : 'hover:ring-2 hover:ring-gray-600 hover:bg-gray-800/20'
            }`}
            onClick={handleClick}
          />
          
          {/* Checkbox indicator */}
          <div
            className={`absolute top-3 right-3 w-6 h-6 rounded transition-all z-20 flex items-center justify-center cursor-pointer ${
              isSelected
                ? 'bg-purple-500 text-white'
                : 'bg-gray-700 border border-gray-600'
            }`}
            onClick={handleClick}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </div>
        </>
      )}
    </div>
  );
};