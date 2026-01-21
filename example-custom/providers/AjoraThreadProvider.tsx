import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useCallback,
} from "react";
import uuid from "react-native-uuid";

// Helper to generate UUID
const randomUUID = (): string => uuid.v4() as string;

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a single chat thread
 */
export interface Thread {
  /** Unique identifier for the thread */
  id: string;
  /** Display name/title of the thread */
  name: string;
  /** Optional subtitle or preview text */
  subtitle?: string;
  /** Timestamp when the thread was created */
  createdAt: Date;
  /** Timestamp when the thread was last updated */
  updatedAt: Date;
  /** Custom metadata for the thread */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for creating a new thread
 */
export interface CreateThreadOptions {
  /** Optional name for the new thread (defaults to generated name) */
  name?: string;
  /** Optional custom ID (defaults to UUID) */
  id?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for updating a thread
 */
export interface UpdateThreadOptions {
  /** New name for the thread */
  name?: string;
  /** New subtitle for the thread */
  subtitle?: string;
  /** Updated metadata (merged with existing) */
  metadata?: Record<string, unknown>;
}

/**
 * Context value for the thread provider
 */
export interface AjoraThreadContextValue {
  /** List of all available threads */
  threads: Thread[];
  /** Currently active thread ID */
  currentThreadId: string | null;
  /** Currently active thread object */
  currentThread: Thread | null;
  /** Whether the thread drawer is open */
  isDrawerOpen: boolean;
  /** Set the drawer open state */
  setDrawerOpen: (open: boolean) => void;
  /** Toggle the drawer open state */
  toggleDrawer: () => void;
  /** Select a thread by ID */
  selectThread: (threadId: string) => void;
  /** Create a new thread */
  createThread: (options?: CreateThreadOptions) => Thread;
  /** Delete a thread by ID */
  deleteThread: (threadId: string) => void;
  /** Update a thread's properties */
  updateThread: (threadId: string, options: UpdateThreadOptions) => void;
  /** Rename a thread */
  renameThread: (threadId: string, newName: string) => void;
  /** Clear all threads */
  clearAllThreads: () => void;
  /** Get a thread by ID */
  getThread: (threadId: string) => Thread | undefined;
}

// ============================================================================
// Context
// ============================================================================

const AjoraThreadContext = createContext<AjoraThreadContextValue | null>(null);

// ============================================================================
// Provider Props
// ============================================================================

export interface AjoraThreadProviderProps {
  children: ReactNode;
  /** Initial list of threads */
  initialThreads?: Thread[];
  /** Initial thread ID to select */
  initialThreadId?: string;
  /** Whether to auto-create a thread if none exist */
  autoCreateThread?: boolean;
  /** Default name generator for new threads */
  generateThreadName?: (index: number) => string;
  /** Callback when the current thread changes */
  onThreadChange?: (thread: Thread | null) => void;
  /** Callback when a thread is created */
  onThreadCreate?: (thread: Thread) => void;
  /** Callback when a thread is deleted */
  onThreadDelete?: (threadId: string) => void;
  /** Callback when a thread is updated */
  onThreadUpdate?: (thread: Thread) => void;
  /** Controlled drawer open state */
  isDrawerOpen?: boolean;
  /** Callback when drawer state changes */
  onDrawerOpenChange?: (open: boolean) => void;
}

// ============================================================================
// Default Name Generator
// ============================================================================

const defaultGenerateThreadName = (index: number): string => {
  return `New Chat ${index}`;
};

// ============================================================================
// Provider Component
// ============================================================================

export function AjoraThreadProvider({
  children,
  initialThreads = [],
  initialThreadId,
  autoCreateThread = true,
  generateThreadName = defaultGenerateThreadName,
  onThreadChange,
  onThreadCreate,
  onThreadDelete,
  onThreadUpdate,
  isDrawerOpen: controlledDrawerOpen,
  onDrawerOpenChange,
}: AjoraThreadProviderProps) {
  const [threads, setThreads] = useState<Thread[]>(() => {
    if (initialThreads.length > 0) {
      return initialThreads;
    }
    if (autoCreateThread) {
      const now = new Date();
      return [
        {
          id: initialThreadId ?? randomUUID(),
          name: generateThreadName(1),
          createdAt: now,
          updatedAt: now,
        },
      ];
    }
    return [];
  });

  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(
    () => initialThreadId ?? threads[0]?.id ?? null
  );

  // Use controlled drawer state if provided
  const isDrawerOpen = controlledDrawerOpen ?? internalDrawerOpen;
  const setDrawerOpen = useCallback(
    (open: boolean) => {
      if (onDrawerOpenChange) {
        onDrawerOpenChange(open);
      } else {
        setInternalDrawerOpen(open);
      }
    },
    [onDrawerOpenChange]
  );

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(!isDrawerOpen);
  }, [isDrawerOpen, setDrawerOpen]);

  // Get current thread object
  const currentThread = useMemo(() => {
    if (!currentThreadId) return null;
    return threads.find((t) => t.id === currentThreadId) ?? null;
  }, [threads, currentThreadId]);

  // Select a thread
  const selectThread = useCallback(
    (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        setCurrentThreadId(threadId);
        onThreadChange?.(thread);
      }
    },
    [threads, onThreadChange]
  );

  // Create a new thread
  const createThread = useCallback(
    (options?: CreateThreadOptions): Thread => {
      const now = new Date();
      const newThread: Thread = {
        id: options?.id ?? randomUUID(),
        name: options?.name ?? generateThreadName(threads.length + 1),
        createdAt: now,
        updatedAt: now,
        metadata: options?.metadata,
      };

      setThreads((prev) => [newThread, ...prev]);
      setCurrentThreadId(newThread.id);
      onThreadCreate?.(newThread);
      onThreadChange?.(newThread);

      return newThread;
    },
    [threads.length, generateThreadName, onThreadCreate, onThreadChange]
  );

  // Delete a thread
  const deleteThread = useCallback(
    (threadId: string) => {
      setThreads((prev) => {
        const filtered = prev.filter((t) => t.id !== threadId);

        // If we deleted the current thread, switch to another one
        if (currentThreadId === threadId) {
          const newCurrentThread = filtered[0] ?? null;
          setCurrentThreadId(newCurrentThread?.id ?? null);
          onThreadChange?.(newCurrentThread);
        }

        return filtered;
      });
      onThreadDelete?.(threadId);
    },
    [currentThreadId, onThreadDelete, onThreadChange]
  );

  // Update a thread
  const updateThread = useCallback(
    (threadId: string, options: UpdateThreadOptions) => {
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== threadId) return thread;

          const updated: Thread = {
            ...thread,
            ...(options.name !== undefined ? { name: options.name } : {}),
            ...(options.subtitle !== undefined
              ? { subtitle: options.subtitle }
              : {}),
            ...(options.metadata !== undefined
              ? { metadata: { ...thread.metadata, ...options.metadata } }
              : {}),
            updatedAt: new Date(),
          };

          onThreadUpdate?.(updated);
          return updated;
        })
      );
    },
    [onThreadUpdate]
  );

  // Rename a thread
  const renameThread = useCallback(
    (threadId: string, newName: string) => {
      updateThread(threadId, { name: newName });
    },
    [updateThread]
  );

  // Clear all threads
  const clearAllThreads = useCallback(() => {
    setThreads([]);
    setCurrentThreadId(null);
    onThreadChange?.(null);
  }, [onThreadChange]);

  // Get a thread by ID
  const getThread = useCallback(
    (threadId: string): Thread | undefined => {
      return threads.find((t) => t.id === threadId);
    },
    [threads]
  );

  const contextValue: AjoraThreadContextValue = useMemo(
    () => ({
      threads,
      currentThreadId,
      currentThread,
      isDrawerOpen,
      setDrawerOpen,
      toggleDrawer,
      selectThread,
      createThread,
      deleteThread,
      updateThread,
      renameThread,
      clearAllThreads,
      getThread,
    }),
    [
      threads,
      currentThreadId,
      currentThread,
      isDrawerOpen,
      setDrawerOpen,
      toggleDrawer,
      selectThread,
      createThread,
      deleteThread,
      updateThread,
      renameThread,
      clearAllThreads,
      getThread,
    ]
  );

  return (
    <AjoraThreadContext.Provider value={contextValue}>
      {children}
    </AjoraThreadContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the thread context
 * @returns The thread context value, or null if not within a provider
 */
export function useAjoraThreadContext(): AjoraThreadContextValue | null {
  return useContext(AjoraThreadContext);
}

/**
 * Hook to access the thread context (throws if not within a provider)
 * @returns The thread context value
 * @throws Error if not within a AjoraThreadProvider
 */
export function useAjoraThreads(): AjoraThreadContextValue {
  const context = useContext(AjoraThreadContext);
  if (!context) {
    throw new Error(
      "useAjoraThreads must be used within an AjoraThreadProvider"
    );
  }
  return context;
}

export default AjoraThreadProvider;
