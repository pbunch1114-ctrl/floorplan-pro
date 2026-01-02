import { useState, useCallback } from 'react';

// Default layers configuration
const DEFAULT_LAYERS = {
  walls: { visible: true, locked: false, name: 'Walls', color: '#ffffff' },
  doors: { visible: true, locked: false, name: 'Doors', color: '#00c8ff' },
  windows: { visible: true, locked: false, name: 'Windows', color: '#00ffaa' },
  furniture: { visible: true, locked: false, name: 'Furniture', color: '#ffaa00' },
  electrical: { visible: true, locked: false, name: 'Electrical', color: '#ffff00' },
  plumbing: { visible: true, locked: false, name: 'Plumbing', color: '#00aaff' },
  dimensions: { visible: true, locked: false, name: 'Dimensions', color: '#888888' },
  rooms: { visible: true, locked: false, name: 'Rooms', color: '#446688' },
  text: { visible: true, locked: false, name: 'Text', color: '#ffffff' },
  lines: { visible: true, locked: false, name: 'Lines', color: '#aaaaaa' },
  hatches: { visible: true, locked: false, name: 'Hatches', color: '#668844' },
  porches: { visible: true, locked: false, name: 'Porches', color: '#886644' },
  roofs: { visible: true, locked: false, name: 'Roofs', color: '#aa8866' },
  stairs: { visible: true, locked: false, name: 'Stairs', color: '#aaaaaa' },
};

/**
 * useLayers hook for managing layer visibility and locking
 *
 * @param {object} initialLayers - Initial layers configuration (optional)
 * @returns {object} - Layers state and actions
 */
export const useLayers = (initialLayers = DEFAULT_LAYERS) => {
  const [layers, setLayers] = useState(initialLayers);

  // Toggle layer visibility
  const toggleVisibility = useCallback((layerId) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        visible: !prev[layerId]?.visible,
      },
    }));
  }, []);

  // Toggle layer lock
  const toggleLock = useCallback((layerId) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        locked: !prev[layerId]?.locked,
      },
    }));
  }, []);

  // Set layer visibility
  const setVisibility = useCallback((layerId, visible) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        visible,
      },
    }));
  }, []);

  // Set layer lock
  const setLocked = useCallback((layerId, locked) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        locked,
      },
    }));
  }, []);

  // Set layer color
  const setColor = useCallback((layerId, color) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        color,
      },
    }));
  }, []);

  // Show all layers
  const showAll = useCallback(() => {
    setLayers(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = { ...prev[key], visible: true };
      });
      return updated;
    });
  }, []);

  // Hide all layers
  const hideAll = useCallback(() => {
    setLayers(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = { ...prev[key], visible: false };
      });
      return updated;
    });
  }, []);

  // Unlock all layers
  const unlockAll = useCallback(() => {
    setLayers(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = { ...prev[key], locked: false };
      });
      return updated;
    });
  }, []);

  // Lock all layers
  const lockAll = useCallback(() => {
    setLayers(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        updated[key] = { ...prev[key], locked: true };
      });
      return updated;
    });
  }, []);

  // Check if layer is visible
  const isVisible = useCallback((layerId) => {
    return layers[layerId]?.visible ?? true;
  }, [layers]);

  // Check if layer is locked
  const isLocked = useCallback((layerId) => {
    return layers[layerId]?.locked ?? false;
  }, [layers]);

  // Get layer color
  const getColor = useCallback((layerId) => {
    return layers[layerId]?.color ?? '#ffffff';
  }, [layers]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setLayers(DEFAULT_LAYERS);
  }, []);

  // Add custom layer
  const addLayer = useCallback((layerId, config) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        visible: true,
        locked: false,
        name: layerId,
        color: '#ffffff',
        ...config,
      },
    }));
  }, []);

  // Remove custom layer
  const removeLayer = useCallback((layerId) => {
    setLayers(prev => {
      const updated = { ...prev };
      delete updated[layerId];
      return updated;
    });
  }, []);

  return {
    layers,
    setLayers,
    toggleVisibility,
    toggleLock,
    setVisibility,
    setLocked,
    setColor,
    showAll,
    hideAll,
    unlockAll,
    lockAll,
    isVisible,
    isLocked,
    getColor,
    resetToDefaults,
    addLayer,
    removeLayer,
  };
};

export default useLayers;
