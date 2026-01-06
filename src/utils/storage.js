/**
 * Storage utilities for auto-save and recent projects
 */

const STORAGE_KEYS = {
  AUTOSAVE: 'floorplan-pro-autosave',
  RECENT_PROJECTS: 'floorplan-pro-recent',
  PROJECT_NAME: 'floorplan-pro-project-name',
};

const MAX_RECENT_PROJECTS = 5;

/**
 * Save current project to auto-save slot
 */
export const saveAutoSave = (data, projectName = 'Untitled') => {
  try {
    const saveData = {
      data,
      projectName,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.AUTOSAVE, JSON.stringify(saveData));
    localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, projectName);
    return true;
  } catch (e) {
    console.warn('Failed to auto-save:', e);
    return false;
  }
};

/**
 * Load auto-saved project
 */
export const loadAutoSave = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTOSAVE);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return {
      data: parsed.data,
      projectName: parsed.projectName || 'Untitled',
      timestamp: parsed.timestamp,
    };
  } catch (e) {
    console.warn('Failed to load auto-save:', e);
    return null;
  }
};

/**
 * Clear auto-save
 */
export const clearAutoSave = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTOSAVE);
    localStorage.removeItem(STORAGE_KEYS.PROJECT_NAME);
  } catch (e) {
    console.warn('Failed to clear auto-save:', e);
  }
};

/**
 * Get saved project name
 */
export const getSavedProjectName = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.PROJECT_NAME) || 'floorplan';
  } catch (e) {
    return 'floorplan';
  }
};

/**
 * Add project to recent projects list
 */
export const addToRecentProjects = (projectName, data) => {
  try {
    const recent = getRecentProjects();

    // Create new entry
    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: projectName,
      data,
      timestamp: Date.now(),
      // Store preview info
      wallCount: 0,
      furnitureCount: 0,
    };

    // Try to extract counts from data
    try {
      const parsed = JSON.parse(data);
      if (parsed.floors && parsed.floors[0]) {
        newEntry.wallCount = parsed.floors[0].walls?.length || 0;
        newEntry.furnitureCount = parsed.floors[0].furniture?.length || 0;
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Remove existing entry with same name if exists
    const filtered = recent.filter(p => p.name !== projectName);

    // Add new entry at the beginning
    const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_PROJECTS);

    localStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn('Failed to add to recent projects:', e);
    return false;
  }
};

/**
 * Get recent projects list
 */
export const getRecentProjects = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RECENT_PROJECTS);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load recent projects:', e);
    return [];
  }
};

/**
 * Remove a project from recent list
 */
export const removeFromRecentProjects = (projectId) => {
  try {
    const recent = getRecentProjects();
    const updated = recent.filter(p => p.id !== projectId);
    localStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn('Failed to remove from recent projects:', e);
    return false;
  }
};

/**
 * Clear all recent projects
 */
export const clearRecentProjects = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECENT_PROJECTS);
  } catch (e) {
    console.warn('Failed to clear recent projects:', e);
  }
};

/**
 * Format timestamp as relative time
 */
export const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return new Date(timestamp).toLocaleDateString();
};

/**
 * Check if there's an auto-saved project
 */
export const hasAutoSave = () => {
  try {
    return !!localStorage.getItem(STORAGE_KEYS.AUTOSAVE);
  } catch (e) {
    return false;
  }
};

export default {
  saveAutoSave,
  loadAutoSave,
  clearAutoSave,
  getSavedProjectName,
  addToRecentProjects,
  getRecentProjects,
  removeFromRecentProjects,
  clearRecentProjects,
  formatRelativeTime,
  hasAutoSave,
};
