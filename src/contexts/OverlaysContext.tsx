import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OverlaysState {
  selectedOverlayId: string | null;
  selectedOverlayUrl: string;
  overlayCoordinates: number[];
  isOverlaySelected: boolean;
  selectedPosition: string;
  // Drag and resize state
  xCoordinate: number;
  yCoordinate: number;
  rndWidth: number;
  rndHeight: number;
  x1Coordinate: number;
  y1Coordinate: number;
  x2Coordinate: number;
  y2Coordinate: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

interface OverlaysContextType {
  overlaysState: OverlaysState;
  setSelectedOverlay: (id: string | null, url: string) => void;
  setOverlayCoordinates: (coordinates: number[]) => void;
  setIsOverlaySelected: (selected: boolean) => void;
  setSelectedPosition: (position: string) => void;
  clearOverlaysSelection: () => void;
  // Drag and resize functions
  setDragPosition: (x: number, y: number) => void;
  setResizeData: (width: number, height: number, x: number, y: number) => void;
  setCoordinatePercentages: (x1: number, y1: number, x2: number, y2: number) => void;
  updatePositionIndicator: () => void;
  // Additional functions for ReactVideoPlayer
  setOverlayDragPosition: (x: number, y: number) => void;
  setOverlayResizeData: (width: number, height: number, x: number, y: number) => void;
  setOverlayCoordinatePercentages: (x1: number, y1: number, x2: number, y2: number) => void;
  setOverlayAssetDimensions: (width: number, height: number) => void;
}

const OverlaysContext = createContext<OverlaysContextType | undefined>(undefined);

export const OverlaysProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [overlaysState, setOverlaysState] = useState<OverlaysState>({
    selectedOverlayId: null,
    selectedOverlayUrl: '',
    overlayCoordinates: [],
    isOverlaySelected: false,
    selectedPosition: '1', // Default to first position (top-left)
    // Drag and resize state
    xCoordinate: 0,
    yCoordinate: 0,
    rndWidth: 100,
    rndHeight: 100,
    x1Coordinate: 0,
    y1Coordinate: 0,
    x2Coordinate: 0,
    y2Coordinate: 0,
    naturalWidth: undefined,
    naturalHeight: undefined,
  });

  const setSelectedOverlay = (id: string | null, url: string) => {
    setOverlaysState(prev => ({
      ...prev,
      selectedOverlayId: id,
      selectedOverlayUrl: url,
      isOverlaySelected: id !== null,
      // Initialize default size and position for Rnd component
      rndWidth: id !== null ? 100 : 0,
      rndHeight: id !== null ? 75 : 0,
      xCoordinate: id !== null ? 0 : 0,
      yCoordinate: id !== null ? 0 : 0,
      naturalWidth: undefined,
      naturalHeight: undefined,
    }));
  };

  const setOverlayCoordinates = (coordinates: number[]) => {
    setOverlaysState(prev => ({
      ...prev,
      overlayCoordinates: coordinates,
    }));
  };

  const setIsOverlaySelected = (selected: boolean) => {
    setOverlaysState(prev => ({
      ...prev,
      isOverlaySelected: selected,
    }));
  };

  const setSelectedPosition = (position: string) => {
    setOverlaysState(prev => ({
      ...prev,
      selectedPosition: position,
    }));
  };

  const setDragPosition = (x: number, y: number) => {
    setOverlaysState(prev => ({
      ...prev,
      xCoordinate: x,
      yCoordinate: y,
    }));
  };

  const setResizeData = (width: number, height: number, x: number, y: number) => {
    setOverlaysState(prev => ({
      ...prev,
      rndWidth: width,
      rndHeight: height,
      xCoordinate: x,
      yCoordinate: y,
    }));
  };

  const setCoordinatePercentages = (x1: number, y1: number, x2: number, y2: number) => {
    setOverlaysState(prev => ({
      ...prev,
      x1Coordinate: x1,
      y1Coordinate: y1,
      x2Coordinate: x2,
      y2Coordinate: y2,
    }));
  };

  const updatePositionIndicator = () => {
    const { xCoordinate, yCoordinate, rndWidth, rndHeight } = overlaysState;
    const videoWidth = 1920;
    const videoHeight = 1080;
    const padding = 20;
    
    // Calculate center points of the current overlay
    const centerX = xCoordinate + rndWidth / 2;
    const centerY = yCoordinate + rndHeight / 2;
    
    // Define position regions with some tolerance
    const tolerance = 50;
    const leftRegion = padding + tolerance;
    const rightRegion = videoWidth - padding - tolerance;
    const topRegion = padding + tolerance;
    const bottomRegion = videoHeight - padding - tolerance;
    const centerRegionX = videoWidth / 2;
    const centerRegionY = videoHeight / 2;
    
    let newPosition = '1'; // default to top-left
    
    // Determine position based on center coordinates
    if (Math.abs(centerX - centerRegionX) < tolerance && Math.abs(centerY - centerRegionY) < tolerance) {
      newPosition = '5'; // center
    } else if (centerX <= leftRegion && centerY <= topRegion) {
      newPosition = '1'; // top-left
    } else if (centerX >= rightRegion && centerY <= topRegion) {
      newPosition = '2'; // top-right
    } else if (centerX <= leftRegion && centerY >= bottomRegion) {
      newPosition = '3'; // bottom-left
    } else if (centerX >= rightRegion && centerY >= bottomRegion) {
      newPosition = '4'; // bottom-right
    } else {
      // If not in any specific region, keep current position or default to center
      newPosition = overlaysState.selectedPosition || '5';
    }
    
    // Update selected position if it changed
    if (newPosition !== overlaysState.selectedPosition) {
      setOverlaysState(prev => ({
        ...prev,
        selectedPosition: newPosition,
      }));
    }
  };

  const clearOverlaysSelection = () => {
    setOverlaysState({
      selectedOverlayId: null,
      selectedOverlayUrl: '',
      overlayCoordinates: [],
      isOverlaySelected: false,
      selectedPosition: '1',
      xCoordinate: 0,
      yCoordinate: 0,
      rndWidth: 100,
      rndHeight: 100,
      x1Coordinate: 0,
      y1Coordinate: 0,
      x2Coordinate: 0,
      y2Coordinate: 0,
    });
  };

  // Additional functions for ReactVideoPlayer compatibility
  const setOverlayDragPosition = (x: number, y: number) => {
    setDragPosition(x, y);
  };

  const setOverlayResizeData = (width: number, height: number, x: number, y: number) => {
    setResizeData(width, height, x, y);
  };

  const setOverlayCoordinatePercentages = (x1: number, y1: number, x2: number, y2: number) => {
    setCoordinatePercentages(x1, y1, x2, y2);
  };

  const setOverlayAssetDimensions = (width: number, height: number) => {
    setOverlaysState(prev => ({
      ...prev,
      naturalWidth: width,
      naturalHeight: height,
    }));
  };

  return (
    <OverlaysContext.Provider
      value={{
        overlaysState,
        setSelectedOverlay,
        setOverlayCoordinates,
        setIsOverlaySelected,
        setSelectedPosition,
        clearOverlaysSelection,
        setDragPosition,
        setResizeData,
        setCoordinatePercentages,
        updatePositionIndicator,
        setOverlayDragPosition,
        setOverlayResizeData,
        setOverlayCoordinatePercentages,
        setOverlayAssetDimensions,
      }}
    >
      {children}
    </OverlaysContext.Provider>
  );
};

export const useOverlays = (): OverlaysContextType => {
  const context = useContext(OverlaysContext);
  if (context === undefined) {
    throw new Error('useOverlays must be used within an OverlaysProvider');
  }
  return context;
};
