import { ReactNode, ElementType } from 'react';
import { Plus, LucideIcon } from 'lucide-react';
import { useLayout } from './LayoutContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showCreateButton?: boolean;
  icon?: LucideIcon;
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * PageHeader Component
 * 
 * Displays page title and optional Create Signal button.
 * Renders below the topbar, at the start of the content area.
 */
export default function PageHeader({ 
  title, 
  subtitle,
  showCreateButton = false,
  icon: Icon,
  action,
  children 
}: PageHeaderProps) {
  const { openCreatePanel } = useLayout();

  return (
    <div className="ribbit-page-header">
      {/* Left: Title with optional icon */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div>
          <h1 className="ribbit-page-title">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {action}
        {children}
        
        {showCreateButton && (
          <button
            onClick={openCreatePanel}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-primary text-primary-foreground rounded-lg
              font-medium text-sm
              shadow-md hover:shadow-lg
              hover:opacity-90
              active:scale-[0.98]
              transition-all duration-200
            "
          >
            <Plus className="w-4 h-4" />
            <span>Create Signal</span>
          </button>
        )}
      </div>
    </div>
  );
}
