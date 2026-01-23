import { Inbox, Send, Tag, Users, Settings, X, Pin, PinOff } from 'lucide-react';
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
 * Floating glassmorphism sidebar with role-based navigation.
 * Award-winning design with:
 * - Detached floating appearance
 * - Premium glass effect with backdrop blur
 * - Smooth micro-interactions
 * - Neon Marsh color palette
 * - Hover-to-expand: shows only icons by default, expands on hover
 * - Optional "pin" to keep expanded
 */
export default function Sidebar({ user, counts = {} }: SidebarProps) {
  const { 
    currentPage, 
    setCurrentPage, 
    isSidebarOpen, 
    closeSidebar, 
    isSidebarCollapsed, 
    toggleSidebarCollapsed,
    setIsSidebarHovered,
    isSidebarExpanded
  } = useLayout();

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
      {/* Mobile Backdrop - dark with blur */}
      <div
        className={`
          fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[299] md:hidden
          transition-all duration-300
          ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Floating Sidebar with glassmorphism - hover to expand */}
      <aside
        className={`
          ribbit-sidebar
          w-[var(--sidebar-width)]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isSidebarExpanded ? 'md:w-[var(--sidebar-width)]' : 'md:w-[72px]'}
        `}
        aria-label="Main navigation"
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-widest">
            Navigation
          </span>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-200 active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation with stagger animation */}
        <nav className="flex-1 space-y-1 stagger-fade-in">
          {mainNavItems
            .filter(item => item.visible)
            .map((item) => (
              <SidebarNavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                isActive={currentPage === item.id}
                onClick={() => handleNavClick(item.id)}
                isCollapsed={!isSidebarExpanded}
              />
            ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1 min-h-[40px]" />

        {/* Bottom Navigation - Settings & Pin Toggle */}
        <nav className="pt-4 mt-auto border-t border-border dark:border-border space-y-1">
          <SidebarNavItem
            icon={Settings}
            label="Settings"
            isActive={currentPage === 'settings'}
            onClick={() => handleNavClick('settings')}
            isCollapsed={!isSidebarExpanded}
          />
          
          {/* Desktop Pin Toggle Button - only visible when expanded */}
          {isSidebarExpanded && (
            <button
              onClick={toggleSidebarCollapsed}
              className={`
                hidden md:flex w-full items-center gap-3 px-4 py-3 rounded-xl
                font-medium text-sm
                transition-all duration-200 ease-out
                active:scale-[0.98]
                ${!isSidebarCollapsed 
                  ? 'text-primary bg-primary/10 dark:bg-primary/15' 
                  : 'text-foreground-secondary hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary'
                }
              `}
              aria-label={!isSidebarCollapsed ? 'Unpin sidebar' : 'Pin sidebar open'}
              title={!isSidebarCollapsed ? 'Unpin sidebar (collapse on mouse leave)' : 'Pin sidebar open'}
            >
              {!isSidebarCollapsed ? (
                <>
                  <PinOff className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">Unpin</span>
                </>
              ) : (
                <>
                  <Pin className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">Pin open</span>
                </>
              )}
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}
