import { Inbox, Send, Tag, Users, Settings, X } from 'lucide-react';
import { useLayout, PageType } from './LayoutContext';
import SidebarNavItem from './SidebarNavItem';

interface SidebarProps {
  user: {
    isPublisher: boolean;
  };
  counts?: {
    inbox?: number;
    sent?: number;
  };
}

/**
 * Sidebar Component
 * 
 * Left navigation with role-based visibility.
 * - Inbox: Visible to all users
 * - Sent: Visible only to publishers
 * - Labels: Visible only to publishers
 * - Groups: Visible only to publishers (placeholder)
 * - Settings: Visible to all users (at bottom)
 */
export default function Sidebar({ user, counts = {} }: SidebarProps) {
  const { currentPage, setCurrentPage, isSidebarOpen, closeSidebar } = useLayout();

  const handleNavClick = (page: PageType) => {
    setCurrentPage(page);
    closeSidebar(); // Close on mobile after selection
  };

  // Navigation items configuration
  const mainNavItems = [
    {
      id: 'inbox' as PageType,
      icon: Inbox,
      label: 'Inbox',
      badge: counts.inbox,
      visible: true,
    },
    {
      id: 'sent' as PageType,
      icon: Send,
      label: 'Sent',
      badge: counts.sent,
      visible: user.isPublisher,
    },
    {
      id: 'labels' as PageType,
      icon: Tag,
      label: 'Labels',
      visible: user.isPublisher,
    },
    {
      id: 'groups' as PageType,
      icon: Users,
      label: 'Groups',
      visible: user.isPublisher,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop - forest-tinted */}
      <div
        className={`
          fixed inset-0 bg-ribbit-pine-teal/40 backdrop-blur-sm z-[299] md:hidden
          transition-all duration-300
          ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          ribbit-sidebar
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        aria-label="Main navigation"
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Menu
          </span>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {mainNavItems
            .filter(item => item.visible)
            .map(item => (
              <SidebarNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                isActive={currentPage === item.id}
                onClick={() => handleNavClick(item.id)}
              />
            ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Navigation */}
        <nav className="pt-4 mt-4 border-t border-border">
          <SidebarNavItem
            icon={Settings}
            label="Settings"
            isActive={currentPage === 'settings'}
            onClick={() => handleNavClick('settings')}
          />
        </nav>
      </aside>
    </>
  );
}
