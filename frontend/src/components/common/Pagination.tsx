import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Number of items displayed per page */
  itemsPerPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when items per page changes */
  onItemsPerPageChange?: (size: number) => void;
  /** Available options for items per page dropdown */
  itemsPerPageOptions?: number[];
  /** Whether to show the items per page selector */
  showItemsPerPage?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pagination Component
 * 
 * A reusable pagination component with theme support (light/dark mode).
 * Features:
 * - First, Previous, Next, Last page navigation
 * - Current page / total pages indicator
 * - "Showing X to Y of Z" info
 * - Optional items-per-page dropdown
 * - Full theme support using semantic tokens
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  showItemsPerPage = true,
  className = '',
}: PaginationProps) {
  // Don't render if there are no items
  if (totalItems === 0) {
    return null;
  }

  // Check if we have the items-per-page selector available
  const hasItemsPerPageSelector = showItemsPerPage && onItemsPerPageChange;
  
  // Hide completely only if single page AND no items-per-page selector
  // (so users can always change the per-page setting if needed)
  if (totalPages <= 1 && !hasItemsPerPageSelector) {
    return null;
  }

  // Calculate the range of items being displayed
  const startItem = Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(totalItems, currentPage * itemsPerPage);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;
  const showNavigation = totalPages > 1;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-4 bg-card-solid rounded-xl border border-border transition-colors duration-200 ${className}`}>
      {/* Left side: Info and items per page */}
      <div className="flex items-center gap-4">
        <span className="text-base text-foreground-secondary transition-colors duration-200">
          Showing {startItem} to {endItem} of {totalItems}
        </span>
        
        {hasItemsPerPageSelector && (
          <div className="flex items-center gap-2">
            <span className="text-base text-foreground-secondary transition-colors duration-200">Per page:</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-between gap-2 px-3 py-1.5 bg-input-background border border-border rounded-lg text-base hover:border-primary/40 transition-colors duration-200 min-w-[60px] text-foreground">
                  <span>{itemsPerPage}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-foreground-muted transition-colors duration-200" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-24 p-1 bg-popover border border-border shadow-xl rounded-xl z-50 transition-colors duration-200">
                <div className="flex flex-col gap-0.5">
                  {itemsPerPageOptions.map(size => (
                    <button
                      key={size}
                      onClick={() => onItemsPerPageChange(size)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-base transition-colors duration-200 ${
                        itemsPerPage === size
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground-secondary hover:bg-muted'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Right side: Navigation buttons (only show when more than 1 page) */}
      {showNavigation && (
        <div className="flex items-center gap-1">
          {/* First page button */}
          <button
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
            className="p-2 text-foreground-muted hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="First page"
            aria-label="Go to first page"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>

          {/* Previous page button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={isFirstPage}
            className="p-2 text-foreground-muted hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous page"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Current page indicator */}
          <div className="flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-lg mx-2 transition-colors duration-200">
            <span className="text-base font-medium text-primary">{currentPage}</span>
            <span className="text-base text-foreground-muted">/</span>
            <span className="text-base text-foreground-secondary">{totalPages || 1}</span>
          </div>

          {/* Next page button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={isLastPage}
            className="p-2 text-foreground-muted hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next page"
            aria-label="Go to next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Last page button */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={isLastPage}
            className="p-2 text-foreground-muted hover:text-foreground hover:bg-muted rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Last page"
            aria-label="Go to last page"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
