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
 * Features "Signal Wildlife" / "Nature Trail" navigation style:
 * - Organic hover with moss-tinted background
 * - "Vine grow" active indicator animation
 * - Badge pop animation on count change
 * - Organic bounce micro-interactions
 * - Bioluminescent glow in dark mode
 * - Collapsed mode with tooltip
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
          // Active: Organic moss-tinted background with tree frog teal
          ? `bg-gradient-to-r from-[rgba(10,143,129,0.08)] to-[rgba(10,143,129,0.12)] 
             text-[#0A8F81] 
             shadow-[0_2px_8px_rgba(10,143,129,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]
             dark:from-[rgba(0,245,184,0.1)] dark:to-[rgba(0,245,184,0.15)]
             dark:text-[#00F5B8]
             dark:shadow-[0_0_15px_rgba(0,245,184,0.15),inset_0_1px_0_rgba(255,255,255,0.03)]` 
          // Inactive: Subtle organic hover
          : `text-foreground 
             hover:bg-gradient-to-r hover:from-[rgba(238,247,242,0.8)] hover:to-[rgba(232,240,232,0.6)]
             hover:shadow-[0_2px_6px_rgba(10,143,129,0.08)]
             dark:hover:from-[rgba(0,245,184,0.05)] dark:hover:to-[rgba(0,245,184,0.08)]
             dark:hover:shadow-[0_0_10px_rgba(0,245,184,0.1)]`
        }
      `}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? label : undefined}
    >
      {/* "Vine Grow" active indicator - organic gradient bar */}
      {isActive && (
        <span 
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full
            bg-gradient-to-b from-[#0A8F81] to-[#087D6F]
            nav-active-indicator
            dark:from-[#00F5B8] dark:to-[#00D9A0]
            dark:shadow-[0_0_10px_rgba(0,245,184,0.5)]
          `}
          style={{ height: '60%' }}
        />
      )}

      {/* Icon with organic bounce on hover */}
      <div className="relative icon-bounce-hover">
        <Icon 
          className={`w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${
            isActive 
              ? 'text-[#0A8F81] dark:text-[#00F5B8] drop-shadow-sm' 
              : 'text-foreground-secondary group-hover:text-[#0A8F81] dark:group-hover:text-[#00F5B8]'
          }`} 
        />
        
        {/* Badge dot indicator when collapsed - with firefly glow */}
        {isCollapsed && typeof badge === 'number' && badge > 0 && (
          <span 
            className={`
              absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full
              ${isActive 
                ? 'bg-[#0A8F81] dark:bg-[#00F5B8] dark:shadow-[0_0_8px_rgba(0,245,184,0.6)]' 
                : 'bg-[#E0478C] dark:bg-[#FF6B8A]'
              }
            `}
          />
        )}
      </div>
      
      {/* Label - hidden when collapsed */}
      {!isCollapsed && (
        <span className="flex-1 text-left truncate transition-colors duration-200 font-medium">
          {label}
        </span>
      )}
      
      {/* Badge with organic glow and pop animation */}
      {!isCollapsed && typeof badge === 'number' && badge > 0 && (
        <span 
          className={`
            min-w-[22px] h-[22px] px-1.5 flex items-center justify-center
            rounded-full text-xs font-bold transition-all duration-200
            ${badgeAnimating ? 'badge-pop' : ''}
            ${isActive 
              ? `bg-gradient-to-b from-[#0A9A8A] to-[#087D6F] text-white 
                 shadow-[0_1px_0_#065F56]
                 dark:from-[#00F5B8] dark:to-[#00D9A0] dark:text-[#080A0C]
                 dark:shadow-[0_0_10px_rgba(0,245,184,0.4)]` 
              : `bg-[#E8F0E8] text-[#475569] 
                 group-hover:bg-[rgba(10,143,129,0.15)] group-hover:text-[#0A8F81]
                 dark:bg-[#1A1E22] dark:text-[#A8AEAE]
                 dark:group-hover:bg-[rgba(0,245,184,0.12)] dark:group-hover:text-[#00F5B8]`
            }
          `}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      
      {/* Tooltip for collapsed state - organic glass effect */}
      {isCollapsed && (
        <div 
          className="
            absolute left-full ml-3 px-3 py-2 rounded-xl
            bg-white/95 dark:bg-[#0F1214]/95 
            backdrop-blur-lg 
            border border-[#C8D4D8] dark:border-[#262B30]
            shadow-[0_4px_12px_rgba(15,23,42,0.1),0_1px_3px_rgba(10,143,129,0.05)]
            dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_15px_rgba(0,245,184,0.05)]
            text-sm font-medium text-foreground whitespace-nowrap
            opacity-0 pointer-events-none translate-x-1
            group-hover:opacity-100 group-hover:translate-x-0
            transition-all duration-200 z-50
            hidden md:block
          "
        >
          {label}
          {typeof badge === 'number' && badge > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({badge > 99 ? '99+' : badge})
            </span>
          )}
        </div>
      )}
    </button>
  );
}
