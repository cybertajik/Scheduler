import { useState, useCallback } from 'react';

export interface HistoryAction {
  id: string;
  type: 'ASSIGN' | 'UNASSIGN' | 'MOVE' | 'LOCK' | 'UNLOCK';
  description: string;
  timestamp: string;
  previousState: any;
  newState: any;
  undoHandler: () => Promise<void>;
  redoHandler: () => Promise<void>;
}

export function useScheduleHistory() {
  const [past, setPast] = useState<HistoryAction[]>([]);
  const [future, setFuture] = useState<HistoryAction[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const pushAction = useCallback((action: HistoryAction) => {
    setPast((prev) => [...prev, action]);
    setFuture([]); // Clear redo stack on new action
  }, []);

  const undo = useCallback(async () => {
    if (past.length === 0 || isExecuting) return;
    setIsExecuting(true);
    const actionToUndo = past[past.length - 1];
    
    try {
      await actionToUndo.undoHandler();
      setPast((prev) => prev.slice(0, prev.length - 1));
      setFuture((prev) => [actionToUndo, ...prev]);
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      setIsExecuting(false);
    }
  }, [past, isExecuting]);

  const redo = useCallback(async () => {
    if (future.length === 0 || isExecuting) return;
    setIsExecuting(true);
    const actionToRedo = future[0];

    try {
      await actionToRedo.redoHandler();
      setFuture((prev) => prev.slice(1));
      setPast((prev) => [...prev, actionToRedo]);
    } catch (err) {
      console.error('Redo failed:', err);
    } finally {
      setIsExecuting(false);
    }
  }, [future, isExecuting]);

  return {
    canUndo: past.length > 0 && !isExecuting,
    canRedo: future.length > 0 && !isExecuting,
    pastActions: past,
    futureActions: future,
    pushAction,
    undo,
    redo,
    isExecuting,
  };
}
