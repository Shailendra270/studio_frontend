import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GraphicsState {
  selectedGraphicId: string | null;
  selectedGraphicUrl: string;
  imageCoordinates: number[];
  isImageSelected: boolean;
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

interface GraphicsContextType {
  graphicsState: GraphicsState;
  setSelectedGraphic: (id: string | null, url: string) => void;
  setImageCoordinates: (coordinates: number[]) => void;
  setIsImageSelected: (selected: boolean) => void;
  setSelectedPosition: (position: string) => void;
  clearGraphicsSelection: () => void;
  // Drag and resize functions
  setDragPosition: (x: number, y: number) => void;
  setResizeData: (width: number, height: number, x: number, y: number) => void;
  setCoordinatePercentages: (x1: number, y1: number, x2: number, y2: number) => void;
  updatePositionIndicator: () => void;
  setAssetDimensions: (width: number, height: number) => void;
}

const GraphicsContext = createContext<GraphicsContextType | undefined>(undefined);

export const GraphicsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [graphicsState, setGraphicsState] = useState<GraphicsState>({
    selectedGraphicId: null,
    selectedGraphicUrl: '',
    imageCoordinates: [],
    isImageSelected: false,
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

  const setSelectedGraphic = (id: string | null, url: string) => {
    setGraphicsState(prev => ({
      ...prev,
      selectedGraphicId: id,
      selectedGraphicUrl: url,
      isImageSelected: id !== null,
      // Initialize default size and position for Rnd component
      rndWidth: id !== null ? 100 : 0,
      rndHeight: id !== null ? 75 : 0,
      xCoordinate: id !== null ? 0 : 0,
      yCoordinate: id !== null ? 0 : 0,
      naturalWidth: undefined,
      naturalHeight: undefined,
    }));
  };

  const setImageCoordinates = (coordinates: number[]) => {
    setGraphicsState(prev => ({
      ...prev,
      imageCoordinates: coordinates,
    }));
  };

  const setIsImageSelected = (selected: boolean) => {
    setGraphicsState(prev => ({
      ...prev,
      isImageSelected: selected,
    }));
  };

  const setSelectedPosition = (position: string) => {
    setGraphicsState(prev => ({
      ...prev,
      selectedPosition: position,
    }));
  };

  const setDragPosition = (x: number, y: number) => {
    setGraphicsState(prev => ({
      ...prev,
      xCoordinate: x,
      yCoordinate: y,
    }));
  };

  const setResizeData = (width: number, height: number, x: number, y: number) => {
    setGraphicsState(prev => ({
      ...prev,
      rndWidth: width,
      rndHeight: height,
      xCoordinate: x,
      yCoordinate: y,
    }));
  };

  const setCoordinatePercentages = (x1: number, y1: number, x2: number, y2: number) => {
    setGraphicsState(prev => ({
      ...prev,
      x1Coordinate: x1,
      y1Coordinate: y1,
      x2Coordinate: x2,
      y2Coordinate: y2,
    }));
  };

  const updatePositionIndicator = () => {
    const { xCoordinate, yCoordinate, rndWidth, rndHeight } = graphicsState;
    const videoWidth = 1920;
    const videoHeight = 1080;
    const padding = 20;
    
    // Calculate center points of the current image
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
      newPosition = graphicsState.selectedPosition || '5';
    }
    
    // Update selected position if it changed
    if (newPosition !== graphicsState.selectedPosition) {
      setGraphicsState(prev => ({
        ...prev,
        selectedPosition: newPosition,
      }));
    }
  };

  const setAssetDimensions = (width: number, height: number) => {
    setGraphicsState(prev => ({
      ...prev,
      naturalWidth: width,
      naturalHeight: height,
    }));
  };

  const clearGraphicsSelection = () => {
    setGraphicsState({
      selectedGraphicId: null,
      selectedGraphicUrl: '',
      imageCoordinates: [],
      isImageSelected: false,
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

  return (
    <GraphicsContext.Provider
      value={{
        graphicsState,
        setSelectedGraphic,
        setImageCoordinates,
        setIsImageSelected,
        setSelectedPosition,
        clearGraphicsSelection,
        setDragPosition,
        setResizeData,
        setCoordinatePercentages,
        updatePositionIndicator,
        setAssetDimensions,
      }}
    >
      {children}
    </GraphicsContext.Provider>
  );
};

export const useGraphics = (): GraphicsContextType => {
  const context = useContext(GraphicsContext);
  if (context === undefined) {
    throw new Error('useGraphics must be used within a GraphicsProvider');
  }
  return context;
};
