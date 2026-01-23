import { ChevronRight, Home } from 'lucide-react';
import { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  onHomeClick?: () => void;
  className?: string;
}

/**
 * Breadcrumb Component
 * 
 * Navigation breadcrumb with:
 * - Optional home icon
 * - Clickable navigation items
 * - Earthy forest styling
 */
export default function Breadcrumb({
  items,
  showHome = true,
  onHomeClick,
  className = '',
}: BreadcrumbProps) {
  return (
    <nav
      className={`flex items-center text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-1">
        {/* Home */}
        {showHome && (
          <li className="flex items-center">
            <button
              onClick={onHomeClick}
              className="p-1 rounded-md text-ribbit-fern hover:text-ribbit-hunter-green dark:text-ribbit-dry-sage dark:hover:text-ribbit-dust-grey hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-hunter-green/30 transition-all"
              aria-label="Home"
            >
              <Home className="w-4 h-4" />
            </button>
            {items.length > 0 && (
              <ChevronRight className="w-4 h-4 text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40 mx-1" />
            )}
          </li>
        )}

        {/* Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {item.href || item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-md
                    transition-all
                    ${isLast
                      ? 'font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage cursor-default'
                      : 'text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70 hover:text-ribbit-hunter-green dark:hover:text-ribbit-dust-grey hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-hunter-green/30'
                    }
                  `}
                  aria-current={isLast ? 'page' : undefined}
                  disabled={isLast}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ) : (
                <span
                  className={`
                    flex items-center gap-1 px-2 py-1
                    ${isLast
                      ? 'font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage'
                      : 'text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70'
                    }
                  `}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}

              {!isLast && (
                <ChevronRight className="w-4 h-4 text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40 mx-1" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Simple Breadcrumb variant for page headers
 */
export function SimpleBreadcrumb({
  parent,
  current,
  onParentClick,
}: {
  parent: string;
  current: string;
  onParentClick?: () => void;
}) {
  return (
    <Breadcrumb
      showHome={false}
      items={[
        { label: parent, onClick: onParentClick },
        { label: current },
      ]}
    />
  );
}
