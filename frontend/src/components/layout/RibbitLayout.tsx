import { ReactNode } from 'react';
import { LayoutProvider, PageType } from './LayoutContext';
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
 * RibbitLayout Component
 * 
 * Main application shell that provides:
 * - Fixed topbar with branding and user actions
 * - Persistent sidebar with role-based navigation
 * - Main content area with proper margins
 * - Layout context for state management
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
      <div className="ribbit-layout">
        {/* Fixed Topbar */}
        <Topbar 
          user={user} 
          incompleteCount={counts.inbox}
          onLogout={onLogout} 
        />

        {/* Sidebar */}
        <Sidebar 
          user={user} 
          counts={counts} 
        />

        {/* Main Content Area */}
        <main id="main-content" className="ribbit-content" role="main">
          <div className="ribbit-content-inner">
            {children}
          </div>
        </main>
      </div>
    </LayoutProvider>
  );
}
