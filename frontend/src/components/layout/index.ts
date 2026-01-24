/**
 * Ribbit Layout Components
 * 
 * This module exports all layout-related components for the Ribbit application.
 * These components form the main application shell with persistent navigation.
 * 
 * Usage:
 * ```tsx
 * import { RibbitLayout, PageHeader, useLayout } from '@/components/layout';
 * ```
 */

// Main layout shell - wraps the entire authenticated app
export { default as RibbitLayout } from './RibbitLayout';

// Topbar components
export { default as Topbar } from './Topbar';
export { default as ThemeToggle } from './ThemeToggle';
export { default as NotificationBell } from './NotificationBell';
export { default as ProfileMenu } from './ProfileMenu';

// Sidebar components
export { default as Sidebar } from './Sidebar';
export { default as SidebarNavItem } from './SidebarNavItem';

// Page components
export { default as PageHeader } from './PageHeader';
export { default as StatusFilterCards } from './StatusFilterCards';
export type { StatusFilter } from './StatusFilterCards';

// Search, Filter, Sort components
export { default as SearchBar } from './SearchBar';
export { default as SortDropdown } from './SortDropdown';
export { default as FiltersButton } from './FiltersButton';
export { default as SearchFilterRow, defaultFilterState } from './SearchFilterRow';
export type { SortOption } from './SortDropdown';
export type { FilterState } from './FiltersButton';

// Panel components - sliding panels for create/edit signals
export { default as CreateSignalPanel } from './CreateSignalPanel';
export { default as EditSignalPanel } from './EditSignalPanel';

// Context - for accessing layout state from child components
export { LayoutProvider, useLayout } from './LayoutContext';

// Types
export type { LayoutContextType, PageType } from './LayoutContext';
