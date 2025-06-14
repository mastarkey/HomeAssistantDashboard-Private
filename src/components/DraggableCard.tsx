import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
  showHandle?: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ id, children, showHandle = true }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      {showHandle && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1 rounded cursor-move hover:bg-gray-700/50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <div className={`${isDragging ? 'opacity-50' : ''} ${showHandle ? 'group' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default DraggableCard;