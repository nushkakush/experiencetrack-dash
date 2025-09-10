import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ExperienceType } from '@/types/experience';

interface DragDropState {
  isDragging: boolean;
  draggedType: ExperienceType | null;
  dragOverSlot: {
    date: Date;
    sessionNumber: number;
  } | null;
}

interface DragDropContextType {
  dragState: DragDropState;
  startDrag: (type: ExperienceType) => void;
  endDrag: () => void;
  setDragOverSlot: (slot: { date: Date; sessionNumber: number } | null) => void;
  clearDragState: () => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(
  undefined
);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: ReactNode;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
}) => {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedType: null,
    dragOverSlot: null,
  });

  const startDrag = (type: ExperienceType) => {
    setDragState({
      isDragging: true,
      draggedType: type,
      dragOverSlot: null,
    });
  };

  const endDrag = () => {
    setDragState({
      isDragging: false,
      draggedType: null,
      dragOverSlot: null,
    });
  };

  const setDragOverSlot = (
    slot: { date: Date; sessionNumber: number } | null
  ) => {
    setDragState(prev => ({
      ...prev,
      dragOverSlot: slot,
    }));
  };

  const clearDragState = () => {
    setDragState({
      isDragging: false,
      draggedType: null,
      dragOverSlot: null,
    });
  };

  return (
    <DragDropContext.Provider
      value={{
        dragState,
        startDrag,
        endDrag,
        setDragOverSlot,
        clearDragState,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
};
