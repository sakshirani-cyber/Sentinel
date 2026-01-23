import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  badge?: number;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * SidebarNavItem Component
 * 
 * Individual navigation item for the sidebar.
 * Shows icon, label, optional badge, and active state.
 */
export default function SidebarNavItem({
  icon: Icon,
  label,
  badge,
  isActive = false,
  onClick,
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
        font-medium text-sm
        transition-all duration-200 ease-out
        hover:translate-x-1
        focus-visible:outline-2 focus-visible:outline-ribbit-hunter-green focus-visible:outline-offset-2
        ${isActive 
          ? 'bg-ribbit-hunter-green/15 text-ribbit-hunter-green dark:text-ribbit-dry-sage shadow-sm' 
          : 'text-ribbit-pine-teal hover:bg-ribbit-dry-sage/40 dark:text-ribbit-dust-grey dark:hover:bg-ribbit-fern/20'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon with micro-interaction */}
      <Icon 
        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
          isActive ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage' : 'text-ribbit-fern'
        }`} 
      />
      
      {/* Label */}
      <span className="flex-1 text-left truncate">
        {label}
      </span>
      
      {/* Badge */}
      {typeof badge === 'number' && badge > 0 && (
        <span 
          className={`
            min-w-[20px] h-5 px-1.5 flex items-center justify-center
            rounded-full text-xs font-semibold transition-colors
            ${isActive 
              ? 'bg-ribbit-hunter-green text-ribbit-dust-grey' 
              : 'bg-ribbit-dry-sage/60 text-ribbit-pine-teal dark:bg-ribbit-fern/30 dark:text-ribbit-dust-grey'
            }
          `}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
