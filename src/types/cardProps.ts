// Shared interface for selection-related props
export interface SelectionProps {
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: () => void;
}

// Base card props that all cards should extend
export interface BaseCardProps extends SelectionProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}