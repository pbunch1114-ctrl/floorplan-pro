import { useState, useCallback, useMemo } from 'react';
import { generateId } from '../utils/measurements';
import { useHistory } from './useHistory';

// Initial floor template
const createEmptyFloor = (id, name) => ({
  id,
  name,
  walls: [],
  doors: [],
  windows: [],
  furniture: [],
  rooms: [],
  stairs: [],
  electrical: [],
  plumbing: [],
  plumbingLines: [],
  dimensions: [],
  texts: [],
  lines: [],
  polylines: [],
  hatches: [],
  porches: [],
  roofs: [],
});

/**
 * useFloorPlan hook for managing floor plan state
 *
 * @returns {object} - Floor plan state and actions
 */
export const useFloorPlan = () => {
  // Floors with history
  const {
    state: floors,
    setState: setFloors,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useHistory([createEmptyFloor('floor-1', 'Floor 1')]);

  // Active floor ID
  const [activeFloorId, setActiveFloorId] = useState('floor-1');

  // Selection state
  const [selectedItems, setSelectedItems] = useState([]);

  // Clipboard for copy/paste
  const [clipboard, setClipboard] = useState(null);

  // Get active floor
  const activeFloor = useMemo(() => {
    return floors.find(f => f.id === activeFloorId) || floors[0];
  }, [floors, activeFloorId]);

  // Update active floor
  const updateActiveFloor = useCallback((updater) => {
    setFloors(prev => prev.map(floor =>
      floor.id === activeFloorId
        ? (typeof updater === 'function' ? updater(floor) : { ...floor, ...updater })
        : floor
    ));
  }, [activeFloorId, setFloors]);

  // Add floor
  const addFloor = useCallback((name) => {
    const id = generateId();
    setFloors(prev => [...prev, createEmptyFloor(id, name || `Floor ${prev.length + 1}`)]);
    setActiveFloorId(id);
    return id;
  }, [setFloors]);

  // Remove floor
  const removeFloor = useCallback((floorId) => {
    if (floors.length <= 1) return; // Keep at least one floor

    setFloors(prev => {
      const newFloors = prev.filter(f => f.id !== floorId);
      if (activeFloorId === floorId) {
        setActiveFloorId(newFloors[0].id);
      }
      return newFloors;
    });
  }, [floors.length, activeFloorId, setFloors]);

  // Duplicate floor
  const duplicateFloor = useCallback((floorId) => {
    const floor = floors.find(f => f.id === floorId);
    if (!floor) return;

    const newId = generateId();
    const newFloor = {
      ...JSON.parse(JSON.stringify(floor)),
      id: newId,
      name: `${floor.name} (Copy)`,
    };

    // Generate new IDs for all items
    const regenerateIds = (items) => items.map(item => ({ ...item, id: generateId() }));

    newFloor.walls = regenerateIds(newFloor.walls);
    newFloor.doors = regenerateIds(newFloor.doors);
    newFloor.windows = regenerateIds(newFloor.windows);
    newFloor.furniture = regenerateIds(newFloor.furniture);
    newFloor.rooms = regenerateIds(newFloor.rooms);
    newFloor.stairs = regenerateIds(newFloor.stairs);
    newFloor.electrical = regenerateIds(newFloor.electrical);
    newFloor.plumbing = regenerateIds(newFloor.plumbing);
    newFloor.plumbingLines = regenerateIds(newFloor.plumbingLines);
    newFloor.dimensions = regenerateIds(newFloor.dimensions);
    newFloor.texts = regenerateIds(newFloor.texts);
    newFloor.lines = regenerateIds(newFloor.lines);
    newFloor.polylines = regenerateIds(newFloor.polylines);
    newFloor.hatches = regenerateIds(newFloor.hatches);
    newFloor.porches = regenerateIds(newFloor.porches);
    newFloor.roofs = regenerateIds(newFloor.roofs);

    setFloors(prev => [...prev, newFloor]);
    setActiveFloorId(newId);
    return newId;
  }, [floors, setFloors]);

  // Add wall
  const addWall = useCallback((wall) => {
    const newWall = { ...wall, id: wall.id || generateId() };
    updateActiveFloor(floor => ({ ...floor, walls: [...floor.walls, newWall] }));
    return newWall.id;
  }, [updateActiveFloor]);

  // Update wall
  const updateWall = useCallback((wallId, updates) => {
    updateActiveFloor(floor => ({
      ...floor,
      walls: floor.walls.map(w => w.id === wallId ? { ...w, ...updates } : w),
    }));
  }, [updateActiveFloor]);

  // Remove wall
  const removeWall = useCallback((wallId) => {
    updateActiveFloor(floor => ({
      ...floor,
      walls: floor.walls.filter(w => w.id !== wallId),
      // Also remove doors and windows on this wall
      doors: floor.doors.filter(d => d.wallId !== wallId),
      windows: floor.windows.filter(w => w.wallId !== wallId),
    }));
  }, [updateActiveFloor]);

  // Add door
  const addDoor = useCallback((door) => {
    const newDoor = { ...door, id: door.id || generateId() };
    updateActiveFloor(floor => ({ ...floor, doors: [...floor.doors, newDoor] }));
    return newDoor.id;
  }, [updateActiveFloor]);

  // Update door
  const updateDoor = useCallback((doorId, updates) => {
    updateActiveFloor(floor => ({
      ...floor,
      doors: floor.doors.map(d => d.id === doorId ? { ...d, ...updates } : d),
    }));
  }, [updateActiveFloor]);

  // Remove door
  const removeDoor = useCallback((doorId) => {
    updateActiveFloor(floor => ({
      ...floor,
      doors: floor.doors.filter(d => d.id !== doorId),
    }));
  }, [updateActiveFloor]);

  // Add window
  const addWindow = useCallback((window) => {
    const newWindow = { ...window, id: window.id || generateId() };
    updateActiveFloor(floor => ({ ...floor, windows: [...floor.windows, newWindow] }));
    return newWindow.id;
  }, [updateActiveFloor]);

  // Update window
  const updateWindow = useCallback((windowId, updates) => {
    updateActiveFloor(floor => ({
      ...floor,
      windows: floor.windows.map(w => w.id === windowId ? { ...w, ...updates } : w),
    }));
  }, [updateActiveFloor]);

  // Remove window
  const removeWindow = useCallback((windowId) => {
    updateActiveFloor(floor => ({
      ...floor,
      windows: floor.windows.filter(w => w.id !== windowId),
    }));
  }, [updateActiveFloor]);

  // Add furniture
  const addFurniture = useCallback((furniture) => {
    const newFurniture = { ...furniture, id: furniture.id || generateId() };
    updateActiveFloor(floor => ({ ...floor, furniture: [...floor.furniture, newFurniture] }));
    return newFurniture.id;
  }, [updateActiveFloor]);

  // Update furniture
  const updateFurniture = useCallback((furnitureId, updates) => {
    updateActiveFloor(floor => ({
      ...floor,
      furniture: floor.furniture.map(f => f.id === furnitureId ? { ...f, ...updates } : f),
    }));
  }, [updateActiveFloor]);

  // Remove furniture
  const removeFurniture = useCallback((furnitureId) => {
    updateActiveFloor(floor => ({
      ...floor,
      furniture: floor.furniture.filter(f => f.id !== furnitureId),
    }));
  }, [updateActiveFloor]);

  // Add room
  const addRoom = useCallback((room) => {
    const newRoom = { ...room, id: room.id || generateId() };
    updateActiveFloor(floor => ({ ...floor, rooms: [...floor.rooms, newRoom] }));
    return newRoom.id;
  }, [updateActiveFloor]);

  // Update room
  const updateRoom = useCallback((roomId, updates) => {
    updateActiveFloor(floor => ({
      ...floor,
      rooms: floor.rooms.map(r => r.id === roomId ? { ...r, ...updates } : r),
    }));
  }, [updateActiveFloor]);

  // Remove room
  const removeRoom = useCallback((roomId) => {
    updateActiveFloor(floor => ({
      ...floor,
      rooms: floor.rooms.filter(r => r.id !== roomId),
    }));
  }, [updateActiveFloor]);

  // Add roof
  const addRoof = useCallback((roof) => {
    const newRoof = { ...roof, id: roof.id || generateId() };
    updateActiveFloor(floor => ({ ...floor, roofs: [...floor.roofs, newRoof] }));
    return newRoof.id;
  }, [updateActiveFloor]);

  // Update roof
  const updateRoof = useCallback((roofId, updates) => {
    updateActiveFloor(floor => ({
      ...floor,
      roofs: floor.roofs.map(r => r.id === roofId ? { ...r, ...updates } : r),
    }));
  }, [updateActiveFloor]);

  // Remove roof
  const removeRoof = useCallback((roofId) => {
    updateActiveFloor(floor => ({
      ...floor,
      roofs: floor.roofs.filter(r => r.id !== roofId),
    }));
  }, [updateActiveFloor]);

  // Generic add item
  const addItem = useCallback((type, item) => {
    const newItem = { ...item, id: item.id || generateId() };
    updateActiveFloor(floor => ({
      ...floor,
      [type]: [...(floor[type] || []), newItem],
    }));
    return newItem.id;
  }, [updateActiveFloor]);

  // Generic update item
  const updateItem = useCallback((type, itemId, updates) => {
    updateActiveFloor(floor => ({
      ...floor,
      [type]: (floor[type] || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  }, [updateActiveFloor]);

  // Generic remove item
  const removeItem = useCallback((type, itemId) => {
    updateActiveFloor(floor => ({
      ...floor,
      [type]: (floor[type] || []).filter(item => item.id !== itemId),
    }));
  }, [updateActiveFloor]);

  // Copy selected items
  const copySelected = useCallback(() => {
    if (selectedItems.length === 0) return;

    const copiedItems = selectedItems.map(sel => {
      const floor = activeFloor;
      let item = null;

      switch (sel.type) {
        case 'wall': item = floor.walls.find(w => w.id === sel.id); break;
        case 'door': item = floor.doors.find(d => d.id === sel.id); break;
        case 'window': item = floor.windows.find(w => w.id === sel.id); break;
        case 'furniture': item = floor.furniture.find(f => f.id === sel.id); break;
        case 'room': item = floor.rooms.find(r => r.id === sel.id); break;
        case 'roof': item = floor.roofs.find(r => r.id === sel.id); break;
        default: break;
      }

      return item ? { type: sel.type, item: JSON.parse(JSON.stringify(item)) } : null;
    }).filter(Boolean);

    setClipboard(copiedItems);
  }, [selectedItems, activeFloor]);

  // Paste clipboard items
  const paste = useCallback((offsetX = 20, offsetY = 20) => {
    if (!clipboard || clipboard.length === 0) return;

    const newSelectedItems = [];

    clipboard.forEach(({ type, item }) => {
      const newItem = { ...item, id: generateId() };

      // Offset the position
      if (newItem.x !== undefined) newItem.x += offsetX;
      if (newItem.y !== undefined) newItem.y += offsetY;
      if (newItem.start) {
        newItem.start = { x: newItem.start.x + offsetX, y: newItem.start.y + offsetY };
      }
      if (newItem.end) {
        newItem.end = { x: newItem.end.x + offsetX, y: newItem.end.y + offsetY };
      }
      if (newItem.points) {
        newItem.points = newItem.points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
      }

      addItem(type === 'wall' ? 'walls' :
              type === 'door' ? 'doors' :
              type === 'window' ? 'windows' :
              type === 'furniture' ? 'furniture' :
              type === 'room' ? 'rooms' :
              type === 'roof' ? 'roofs' : type, newItem);

      newSelectedItems.push({ type, id: newItem.id });
    });

    setSelectedItems(newSelectedItems);
  }, [clipboard, addItem]);

  // Delete selected items - requires items to be passed to avoid stale closure
  const deleteSelected = useCallback((itemsToDelete) => {
    if (!itemsToDelete || itemsToDelete.length === 0) return;

    itemsToDelete.forEach(sel => {
      const typeMap = {
        wall: 'walls',
        door: 'doors',
        window: 'windows',
        furniture: 'furniture',
        room: 'rooms',
        roof: 'roofs',
        dimension: 'dimensions',
        line: 'lines',
        text: 'texts',
      };
      const type = typeMap[sel.type] || sel.type;
      // Get the item id - selection objects store the id inside sel.item.id
      const itemId = sel.item?.id || sel.id;

      if (sel.type === 'wall') {
        removeWall(itemId);
      } else {
        removeItem(type, itemId);
      }
    });

    setSelectedItems([]);
  }, [removeWall, removeItem, setSelectedItems]);

  // Clear floor
  const clearFloor = useCallback(() => {
    updateActiveFloor(floor => ({
      ...floor,
      walls: [],
      doors: [],
      windows: [],
      furniture: [],
      rooms: [],
      stairs: [],
      electrical: [],
      plumbing: [],
      plumbingLines: [],
      dimensions: [],
      texts: [],
      lines: [],
      polylines: [],
      hatches: [],
      porches: [],
      roofs: [],
    }));
    setSelectedItems([]);
  }, [updateActiveFloor]);

  // New file (reset everything)
  const newFile = useCallback(() => {
    setFloors([createEmptyFloor('floor-1', 'Floor 1')]);
    setActiveFloorId('floor-1');
    setSelectedItems([]);
    setClipboard(null);
    clearHistory();
  }, [setFloors, clearHistory]);

  // Export to JSON
  const exportToJSON = useCallback(() => {
    return JSON.stringify({
      version: '1.0',
      floors,
    }, null, 2);
  }, [floors]);

  // Import from JSON
  const importFromJSON = useCallback((json) => {
    try {
      const data = JSON.parse(json);
      if (data.floors && Array.isArray(data.floors)) {
        setFloors(data.floors);
        setActiveFloorId(data.floors[0]?.id || 'floor-1');
        setSelectedItems([]);
        clearHistory();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import JSON:', e);
      return false;
    }
  }, [setFloors, clearHistory]);

  return {
    // State
    floors,
    activeFloorId,
    activeFloor,
    selectedItems,
    clipboard,

    // Floor management
    setActiveFloorId,
    addFloor,
    removeFloor,
    duplicateFloor,
    updateActiveFloor,

    // Selection
    setSelectedItems,

    // Wall operations
    addWall,
    updateWall,
    removeWall,

    // Door operations
    addDoor,
    updateDoor,
    removeDoor,

    // Window operations
    addWindow,
    updateWindow,
    removeWindow,

    // Furniture operations
    addFurniture,
    updateFurniture,
    removeFurniture,

    // Room operations
    addRoom,
    updateRoom,
    removeRoom,

    // Roof operations
    addRoof,
    updateRoof,
    removeRoof,

    // Generic operations
    addItem,
    updateItem,
    removeItem,

    // Clipboard
    copySelected,
    paste,
    deleteSelected,

    // File operations
    clearFloor,
    newFile,
    exportToJSON,
    importFromJSON,

    // History
    undo,
    redo,
    canUndo,
    canRedo,
  };
};

export default useFloorPlan;
