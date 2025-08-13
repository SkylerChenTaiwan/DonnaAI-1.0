/**
 * 儲存格狀態機 Hook - 管理儲存格的狀態轉換
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { CellState, CellPosition, CellStateContext } from '../types';

type CellStateAction =
  | { type: 'MOUSE_ENTER'; position: CellPosition }
  | { type: 'MOUSE_LEAVE'; position: CellPosition }
  | { type: 'CLICK'; position: CellPosition }
  | { type: 'DOUBLE_CLICK'; position: CellPosition }
  | { type: 'KEY_F2'; position: CellPosition }
  | { type: 'KEY_ENTER'; position: CellPosition }
  | { type: 'KEY_ESCAPE' }
  | { type: 'BLUR' }
  | { type: 'TAB' }
  | { type: 'RESET' }
  | { type: 'SET_SELECTED'; position: CellPosition | null }
  | { type: 'SET_EDITING'; position: CellPosition | null };

interface CellStateMachineState {
  hoveredCell: CellPosition | null;
  selectedCell: CellPosition | null;
  editingCell: CellPosition | null;
  cellStates: Map<string, CellState>;
}

const initialState: CellStateMachineState = {
  hoveredCell: null,
  selectedCell: null,
  editingCell: null,
  cellStates: new Map() };

function getCellKey(position: CellPosition): string {
  return `${position.row}-${position.col}`;
}

function cellStateReducer(
  state: CellStateMachineState,
  action: CellStateAction
): CellStateMachineState {
  const newCellStates = new Map(state.cellStates);
  
  // Clear previous states
  const clearStates = () => {
    newCellStates.forEach((_, key) => {
      newCellStates.set(key, 'default');
    });
  };
  
  switch (action.type) {
    case 'MOUSE_ENTER': {
      const key = getCellKey(action.position);
      
      // Don't change hover state if cell is selected or editing
      if (state.selectedCell && getCellKey(state.selectedCell) === key) {
        return state;
      }
      if (state.editingCell && getCellKey(state.editingCell) === key) {
        return state;
      }
      
      // Clear previous hover
      if (state.hoveredCell) {
        const prevKey = getCellKey(state.hoveredCell);
        if (newCellStates.get(prevKey) === 'hover') {
          newCellStates.set(prevKey, 'default');
        }
      }
      
      newCellStates.set(key, 'hover');
      return {
        ...state,
        hoveredCell: action.position,
        cellStates: newCellStates };
    }
    
    case 'MOUSE_LEAVE': {
      const key = getCellKey(action.position);
      
      // Only clear hover state
      if (newCellStates.get(key) === 'hover') {
        newCellStates.set(key, 'default');
      }
      
      return {
        ...state,
        hoveredCell: null,
        cellStates: newCellStates };
    }
    
    case 'CLICK': {
      const key = getCellKey(action.position);
      
      // Exit editing mode if clicking a different cell
      if (state.editingCell) {
        const editKey = getCellKey(state.editingCell);
        if (editKey !== key) {
          newCellStates.set(editKey, 'default');
        }
      }
      
      // Clear previous selection
      if (state.selectedCell) {
        const prevKey = getCellKey(state.selectedCell);
        if (prevKey !== key) {
          newCellStates.set(prevKey, 'default');
        }
      }
      
      newCellStates.set(key, 'selected');
      
      return {
        ...state,
        selectedCell: action.position,
        editingCell: null,
        hoveredCell: null,
        cellStates: newCellStates };
    }
    
    case 'DOUBLE_CLICK':
    case 'KEY_F2':
    case 'KEY_ENTER': {
      if (!state.selectedCell) return state;
      
      const key = getCellKey(state.selectedCell);
      newCellStates.set(key, 'editing');
      
      return {
        ...state,
        editingCell: state.selectedCell,
        cellStates: newCellStates };
    }
    
    case 'KEY_ESCAPE':
    case 'BLUR': {
      if (!state.editingCell) return state;
      
      const key = getCellKey(state.editingCell);
      newCellStates.set(key, 'selected');
      
      return {
        ...state,
        editingCell: null,
        cellStates: newCellStates };
    }
    
    case 'TAB': {
      if (state.editingCell) {
        const key = getCellKey(state.editingCell);
        newCellStates.set(key, 'default');
      }
      
      return {
        ...state,
        editingCell: null,
        selectedCell: null,
        cellStates: newCellStates };
    }
    
    case 'RESET': {
      clearStates();
      return {
        ...initialState,
        cellStates: newCellStates };
    }
    
    case 'SET_SELECTED': {
      clearStates();
      
      if (action.position) {
        const key = getCellKey(action.position);
        newCellStates.set(key, 'selected');
      }
      
      return {
        ...state,
        selectedCell: action.position,
        editingCell: null,
        hoveredCell: null,
        cellStates: newCellStates };
    }
    
    case 'SET_EDITING': {
      if (!action.position) {
        // Exit editing mode
        if (state.editingCell) {
          const key = getCellKey(state.editingCell);
          newCellStates.set(key, 'selected');
        }
        
        return {
          ...state,
          editingCell: null,
          cellStates: newCellStates };
      }
      
      const key = getCellKey(action.position);
      newCellStates.set(key, 'editing');
      
      return {
        ...state,
        selectedCell: action.position,
        editingCell: action.position,
        cellStates: newCellStates };
    }
    
    default:
      return state;
  }
}

export const useCellStateMachine = () => {
  const [state, dispatch] = useReducer(cellStateReducer, initialState);
  const lastClickTime = useRef<number>(0);
  const lastClickPosition = useRef<CellPosition | null>(null);
  
  // Get cell state
  const getCellState = useCallback((position: CellPosition): CellState => {
    const key = getCellKey(position);
    return state.cellStates.get(key) || 'default';
  }, [state.cellStates]);
  
  // Handle mouse events
  const handleMouseEnter = useCallback((position: CellPosition) => {
    dispatch({ type: 'MOUSE_ENTER', position });
  }, []);
  
  const handleMouseLeave = useCallback((position: CellPosition) => {
    dispatch({ type: 'MOUSE_LEAVE', position });
  }, []);
  
  // Handle click with double-click detection
  const handleClick = useCallback((position: CellPosition) => {
    const now = Date.now();
    const isDoubleClick = 
      lastClickPosition.current &&
      lastClickPosition.current.row === position.row &&
      lastClickPosition.current.col === position.col &&
      now - lastClickTime.current < 300;
    
    if (isDoubleClick) {
      dispatch({ type: 'DOUBLE_CLICK', position });
      lastClickTime.current = 0;
      lastClickPosition.current = null;
    } else {
      dispatch({ type: 'CLICK', position });
      lastClickTime.current = now;
      lastClickPosition.current = position;
    }
  }, []);
  
  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent, position: CellPosition) => {
    switch (e.key) {
      case 'F2':
        e.preventDefault();
        dispatch({ type: 'KEY_F2', position });
        break;
      case 'Enter':
        if (state.editingCell) {
          dispatch({ type: 'TAB' });
        } else {
          dispatch({ type: 'KEY_ENTER', position });
        }
        break;
      case 'Escape':
        e.preventDefault();
        dispatch({ type: 'KEY_ESCAPE' });
        break;
      case 'Tab':
        if (state.editingCell) {
          e.preventDefault();
          dispatch({ type: 'TAB' });
        }
        break;
    }
  }, [state.editingCell]);
  
  // Handle blur
  const handleBlur = useCallback(() => {
    dispatch({ type: 'BLUR' });
  }, []);
  
  // Reset state
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  // Programmatically set states
  const setSelectedCell = useCallback((position: CellPosition | null) => {
    dispatch({ type: 'SET_SELECTED', position });
  }, []);
  
  const setEditingCell = useCallback((position: CellPosition | null) => {
    dispatch({ type: 'SET_EDITING', position });
  }, []);
  
  // Check if a cell is in a specific state
  const isCellSelected = useCallback((position: CellPosition): boolean => {
    return state.selectedCell?.row === position.row && 
           state.selectedCell?.col === position.col;
  }, [state.selectedCell]);
  
  const isCellEditing = useCallback((position: CellPosition): boolean => {
    return state.editingCell?.row === position.row && 
           state.editingCell?.col === position.col;
  }, [state.editingCell]);
  
  const isCellHovered = useCallback((position: CellPosition): boolean => {
    return state.hoveredCell?.row === position.row && 
           state.hoveredCell?.col === position.col;
  }, [state.hoveredCell]);
  
  return {
    // State
    hoveredCell: state.hoveredCell,
    selectedCell: state.selectedCell,
    editingCell: state.editingCell,
    
    // State getters
    getCellState,
    isCellSelected,
    isCellEditing,
    isCellHovered,
    
    // Event handlers
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleKeyDown,
    handleBlur,
    
    // State setters
    setSelectedCell,
    setEditingCell,
    reset };
};