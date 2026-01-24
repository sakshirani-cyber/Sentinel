import { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  badge?: number;
  isActive?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
}

/**
 * SidebarNavItem Component
 * 
 * Individual navigation item for the floating sidebar.
 * Features Neon Marsh palette with premium micro-interactions:
 * - Hover glow effect with icon bounce
 * - Active state with animated neon indicator
 * - Badge pop animation on count change
 * - Smooth spring animations
 * - Collapsed mode with icon-only display + tooltip
 */
export default function SidebarNavItem({
  icon: Icon,
  label,
  badge,
  isActive = false,
  onClick,
  isCollapsed = false,
}: SidebarNavItemProps) {
  // Track badge changes for animation
  const prevBadgeRef = useRef(badge);
  const [badgeAnimating, setBadgeAnimating] = useState(false);

  useEffect(() => {
    if (badge !== prevBadgeRef.current && typeof badge === 'number' && badge > 0) {
      setBadgeAnimating(true);
      const timer = setTimeout(() => setBadgeAnimating(false), 400);
      prevBadgeRef.current = badge;
      return () => clearTimeout(timer);
    }
  }, [badge]);

  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-3 px-4 py-3 rounded-xl
        font-medium text-sm relative overflow-hidden
        transition-all duration-200 ease-out
        active:scale-[0.98] press-shrink
        focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
        ${isCollapsed ? 'justify-center px-3' : 'hover:translate-x-1'}
        ${isActive 
          ? 'bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary dark:shadow-[0_0_15px_rgba(0,255,194,0.15)]' 
          : 'text-foreground hover:bg-primary/5 dark:hover:bg-primary/10 hover:shadow-sm'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? label : undefined}
    >
      {/* Active indicator bar with slide animation */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-primary rounded-r-full dark:shadow-[0_0_10px_var(--neon-cyan)] indicator-slide" />
      )}

      {/* Icon with bounce on hover */}
      <div className="relative icon-bounce-hover">
        <Icon 
          className={`w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${
            isActive 
              ? 'text-primary' 
              : 'text-foreground-secondary group-hover:text-primary'
          }`} 
        />
        
        {/* Badge dot indicator when collapsed */}
        {isCollapsed && typeof badge === 'number' && badge > 0 && (
          <span 
            className={`
              absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full
              ${isActive 
                ? 'bg-primary dark:shadow-[0_0_6px_var(--neon-cyan)]' 
                : 'bg-accent'
              }
            `}
          />
        )}
      </div>
      
      {/* Label - hidden when collapsed */}
      {!isCollapsed && (
        <span className="flex-1 text-left truncate transition-colors duration-200">
          {label}
        </span>
      )}
      
      {/* Badge with glow effect and pop animation - hidden when collapsed */}
      {!isCollapsed && typeof badge === 'number' && badge > 0 && (
        <span 
          className={`
            min-w-[22px] h-[22px] px-1.5 flex items-center justify-center
            rounded-full text-xs font-semibold transition-all duration-200
            ${badgeAnimating ? 'badge-pop' : ''}
            ${isActive 
              ? 'bg-primary text-primary-foreground dark:shadow-[0_0_8px_var(--neon-cyan)]' 
              : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
            }
          `}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      
      {/* Tooltip for collapsed state - shown on hover */}
      {isCollapsed && (
        <div 
          className="
            absolute left-full ml-3 px-3 py-2 rounded-lg
            bg-popover/95 backdrop-blur-lg border border-border shadow-lg
            text-sm font-medium text-foreground whitespace-nowrap
            opacity-0 pointer-events-none translate-x-1
            group-hover:opacity-100 group-hover:translate-x-0
            transition-all duration-200 z-50
            hidden md:block
          "
        >
          {label}
          {typeof badge === 'number' && badge > 0 && (
            <span className="ml-2 text-xs text-foreground-secondary">
              ({badge > 99 ? '99+' : badge})
            </span>
          )}
        </div>
      )}
    </button>
  );
}
