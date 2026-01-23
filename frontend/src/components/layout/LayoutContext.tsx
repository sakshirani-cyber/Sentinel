import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Available pages in the application
 */
export type PageType = 'inbox' | 'sent' | 'labels' | 'groups' | 'settings';

/**
 * Layout context type definition
 */
export interface LayoutContextType {
  // Current page navigation
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  
  // Sidebar state (for mobile)
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  
  // Sidebar collapsed state (for desktop) - always collapsed by default
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  
  // Sidebar hover state - expands sidebar on hover
  isSidebarHovered: boolean;
  setIsSidebarHovered: (hovered: boolean) => void;
  
  // Computed: sidebar should show expanded (hovered or pinned open)
  isSidebarExpanded: boolean;
  
  // Create Signal panel state
  isCreatePanelOpen: boolean;
  openCreatePanel: () => void;
  closeCreatePanel: () => void;
  
  // Panel has unsaved changes
  panelHasChanges: boolean;
  setPanelHasChanges: (hasChanges: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
  defaultPage?: PageType;
}

/**
 * Layout Provider Component
 * 
 * Provides layout state management for the entire application.
 * Handles navigation, sidebar visibility, and panel state.
 */
export function LayoutProvider({ children, defaultPage = 'inbox' }: LayoutProviderProps) {
  // Current page state
  const [currentPage, setCurrentPage] = useState<PageType>(defaultPage);
  
  // Sidebar state (primarily for mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Sidebar collapsed state (for desktop - persisted in localStorage)
  // When true, sidebar stays expanded always (pinned open)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    // Default to collapsed (true) - show only icons
    return saved !== 'false';
  });
  
  // Sidebar hover state - expands sidebar temporarily on hover
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  // Computed: sidebar should show expanded content when hovered OR when pinned open (not collapsed)
  const isSidebarExpanded = isSidebarHovered || !isSidebarCollapsed;
  
  // Create Signal panel state
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [panelHasChanges, setPanelHasChanges] = useState(false);

  // Sidebar handlers
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  
  // Sidebar collapsed handler (persists to localStorage)
  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  }, []);

  // Create Panel handlers
  const openCreatePanel = useCallback(() => {
    setIsCreatePanelOpen(true);
  }, []);

  const closeCreatePanel = useCallback(() => {
    // If there are unsaved changes, this will be handled by the panel component
    // which should show a confirmation dialog
    setIsCreatePanelOpen(false);
    setPanelHasChanges(false);
  }, []);

  // Navigation handler - closes sidebar on mobile after navigation
  const handleSetCurrentPage = useCallback((page: PageType) => {
    setCurrentPage(page);
    closeSidebar(); // Close mobile sidebar on navigation
  }, [closeSidebar]);

  const value: LayoutContextType = {
    currentPage,
    setCurrentPage: handleSetCurrentPage,
    isSidebarOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isSidebarHovered,
    setIsSidebarHovered,
    isSidebarExpanded,
    isCreatePanelOpen,
    openCreatePanel,
    closeCreatePanel,
    panelHasChanges,
    setPanelHasChanges,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

/**
 * Hook to access layout context
 * 
 * @throws Error if used outside of LayoutProvider
 */
export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  
  return context;
}

export default LayoutContext;
