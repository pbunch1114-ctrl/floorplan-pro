import { useState, useCallback, useRef } from 'react';

// Maximum number of history states to keep
const MAX_HISTORY_SIZE = 50;

/**
 * useHistory hook for undo/redo functionality
 *
 * @param {any} initialState - The initial state
 * @returns {object} - { state, setState, undo, redo, canUndo, canRedo, clearHistory }
 */
export const useHistory = (initialState) => {
  // Current state
  const [state, setStateInternal] = useState(initialState);

  // History stacks
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // Flag to prevent recording during undo/redo operations
  const isUndoRedoAction = useRef(false);

  // Set state with history recording
  const setState = useCallback((newState) => {
    if (isUndoRedoAction.current) {
      // During undo/redo, just update state without recording
      setStateInternal(newState);
      return;
    }

    setStateInternal(prevState => {
      // Get the actual new state value
      const actualNewState = typeof newState === 'function' ? newState(prevState) : newState;

      // Push current state to undo stack
      undoStack.current.push(JSON.stringify(prevState));

      // Limit history size
      if (undoStack.current.length > MAX_HISTORY_SIZE) {
        undoStack.current.shift();
      }

      // Clear redo stack on new action
      redoStack.current = [];

      return actualNewState;
    });
  }, []);

  // Undo action
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;

    isUndoRedoAction.current = true;

    // Get the previous state
    const previousState = JSON.parse(undoStack.current.pop());

    // Push current state to redo stack
    setStateInternal(currentState => {
      redoStack.current.push(JSON.stringify(currentState));
      return previousState;
    });

    isUndoRedoAction.current = false;
  }, []);

  // Redo action
  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;

    isUndoRedoAction.current = true;

    // Get the next state
    const nextState = JSON.parse(redoStack.current.pop());

    // Push current state to undo stack
    setStateInternal(currentState => {
      undoStack.current.push(JSON.stringify(currentState));
      return nextState;
    });

    isUndoRedoAction.current = false;
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    undoStack.current.push(JSON.stringify(state));
    redoStack.current = [];
    setStateInternal(initialState);
  }, [initialState, state]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    clearHistory,
    reset,
    historyLength: undoStack.current.length,
  };
};

export default useHistory;
