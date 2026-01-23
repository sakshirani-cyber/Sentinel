import { ReactNode } from 'react';
import { LayoutProvider, PageType, useLayout } from './LayoutContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

interface User {
  name: string;
  email: string;
  isPublisher: boolean;
}

interface RibbitLayoutProps {
  children: ReactNode;
  user: User;
  counts?: {
    inbox?: number;
    sent?: number;
  };
  defaultPage?: PageType;
  onLogout: () => void;
}

/**
 * Inner layout component that uses the layout context
 */
function RibbitLayoutInner({
  children,
  user,
  counts,
  onLogout,
}: Omit<RibbitLayoutProps, 'defaultPage'>) {
  const { isSidebarCollapsed } = useLayout();
  
  // When sidebar is collapsed (default), content has smaller margin
  // When sidebar is pinned open (!isSidebarCollapsed), content adjusts to full sidebar width
  // When hovering, sidebar expands OVER the content (no margin change needed)
  
  return (
    <div className="ribbit-layout">
      {/* Fixed Topbar */}
      <Topbar 
        user={user} 
        incompleteCount={counts?.inbox}
        onLogout={onLogout} 
      />

      {/* Sidebar - expands on hover, shows only icons otherwise */}
      <Sidebar 
        user={user} 
        counts={counts || {}} 
      />

      {/* Main Content Area - adjusts margin based on sidebar pinned state */}
      <main 
        id="main-content" 
        className={`ribbit-content transition-all duration-300 ease-out ${
          isSidebarCollapsed ? 'md:ml-[calc(72px+var(--sidebar-margin))]' : ''
        }`}
        role="main"
      >
        <div className="ribbit-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * RibbitLayout Component
 * 
 * Main application shell that provides:
 * - Fixed topbar with branding and user actions
 * - Persistent sidebar with role-based navigation
 * - Main content area with proper margins
 * - Layout context for state management
 * - Collapsible sidebar with icon-only mode
 * 
 * Usage:
 * ```tsx
 * <RibbitLayout user={user} onLogout={logout}>
 *   <YourPageContent />
 * </RibbitLayout>
 * ```
 */
export default function RibbitLayout({
  children,
  user,
  counts = {},
  defaultPage,
  onLogout,
}: RibbitLayoutProps) {
  // Determine default page based on user role
  const initialPage: PageType = defaultPage || (user.isPublisher ? 'sent' : 'inbox');

  return (
    <LayoutProvider defaultPage={initialPage}>
      <RibbitLayoutInner user={user} counts={counts} onLogout={onLogout}>
        {children}
      </RibbitLayoutInner>
    </LayoutProvider>
  );
}
