import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

import { UndoBar } from '@/components';

type UndoState = { message: string; onUndo: () => void };
type UndoContextValue = { showUndo: (message: string, onUndo: () => void) => void };

const UndoContext = createContext<UndoContextValue | null>(null);

/**
 * One Undo bar for the whole logging surface, so every create / edit / delete
 * (quick-log, swipe-delete, editor) offers the same immediate undo affordance.
 */
export function UndoProvider({ children }: { children: ReactNode }) {
  const [undo, setUndo] = useState<UndoState | null>(null);
  const showUndo = useCallback((message: string, onUndo: () => void) => {
    setUndo({ message, onUndo });
  }, []);

  return (
    <UndoContext.Provider value={{ showUndo }}>
      {children}
      <UndoBar
        visible={undo != null}
        message={undo?.message ?? ''}
        onAction={() => {
          undo?.onUndo();
          setUndo(null);
        }}
        onDismiss={() => setUndo(null)}
      />
    </UndoContext.Provider>
  );
}

export function useUndo(): UndoContextValue {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error('useUndo must be used within <UndoProvider>.');
  return ctx;
}
