import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import SearchBar from './SearchBar';
import SortDropdown, { SortOption } from './SortDropdown';
import { FilterState } from './FiltersButton';
import { Filter, X, Tag, Users, CalendarDays, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import DateRangePicker from '../common/DateRangePicker';
import SearchableLabelDropdown from '../common/SearchableLabelDropdown';

interface SearchFilterRowProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Sort
  sortValue: SortOption;
  onSortChange: (value: SortOption) => void;
  
  // Filters (optional)
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  availableLabels?: string[];
  availablePublishers?: string[];
  showFilters?: boolean;
  
  // Publisher-specific options
  isPublisher?: boolean;
}

const defaultFilters: FilterState = {
  labels: [],
  publishers: [],
  dateRange: { start: null, end: null },
  signalType: [],
  scheduledOnly: false,
};

/**
 * SearchFilterRow Component
 * 
 * A complete row with search bar, sort dropdown, and mega menu filters.
 * The filters mega menu uses a portal to escape stacking context issues.
 */
export default function SearchFilterRow({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  sortValue,
  onSortChange,
  filters,
  onFiltersChange,
  availableLabels: _availableLabels = [], // Kept for backward compatibility but not used (we fetch all labels now)
  availablePublishers = [],
  showFilters = true,
  isPublisher = false,
}: SearchFilterRowProps) {
  // Mark availableLabels as intentionally unused (we fetch all labels from DB instead)
  void _availableLabels;
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters || defaultFilters);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, right: 0 });
  const [allLabels, setAllLabels] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate active filter count
  const activeCount = filters ? (
    filters.labels.length +
    filters.publishers.length +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    (isPublisher && filters.scheduledOnly ? 1 : 0)
  ) : 0;

  // Calculate menu position - from left of container to right edge of filter button
  const updateMenuPosition = useCallback(() => {
    if (containerRef.current && filterButtonRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = filterButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: containerRect.bottom + 8,
        left: containerRect.left,
        right: window.innerWidth - buttonRect.right,
      });
    }
  }, []);

  // Sync local filters with external
  useEffect(() => {
    if (filters) {
      setLocalFilters(filters);
    }
  }, [filters]);

  // Fetch all labels when filters menu opens
  useEffect(() => {
    if (isFiltersOpen) {
      const fetchLabels = async () => {
        setLoadingLabels(true);
        try {
          if ((window as any).electron?.backend) {
            const result = await (window as any).electron.ipcRenderer.invoke('db-get-labels');
            if (result.success) {
              setAllLabels(result.data || []);
            }
          }
        } catch (error) {
          console.error('Failed to fetch labels:', error);
          setAllLabels([]);
        } finally {
          setLoadingLabels(false);
        }
      };
      fetchLabels();
    }
  }, [isFiltersOpen]);

  // Update position when menu opens and on scroll/resize
  useEffect(() => {
    if (isFiltersOpen) {
      updateMenuPosition();
      window.addEventListener('scroll', updateMenuPosition, true);
      window.addEventListener('resize', updateMenuPosition);
    }
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isFiltersOpen, updateMenuPosition]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsFiltersOpen(false);
      }
    };

    if (isFiltersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFiltersOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFiltersOpen(false);
    };
    if (isFiltersOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFiltersOpen]);

  const handleApply = () => {
    onFiltersChange?.(localFilters);
    setIsFiltersOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
    setIsFiltersOpen(false);
  };

  const handleLabelSelectionChange = (selected: string[]) => {
    setLocalFilters(prev => ({
      ...prev,
      labels: selected,
    }));
  };

  const togglePublisher = (publisher: string) => {
    setLocalFilters(prev => ({
      ...prev,
      publishers: prev.publishers.includes(publisher)
        ? prev.publishers.filter(p => p !== publisher)
        : [...prev.publishers, publisher],
    }));
  };

  // Mega Menu rendered via Portal to escape stacking context
  const megaMenu = isFiltersOpen && showFilters && filters && onFiltersChange ? createPortal(
    <div 
      ref={menuRef}
      role="dialog"
      aria-label="Filter options"
      style={{ 
        position: 'fixed',
        top: menuPosition.top,
        left: menuPosition.left,
        right: menuPosition.right,
        zIndex: 350,
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Content - Grid Layout */}
      <div 
        className="p-5"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="flex gap-5">
          {/* Left Column: Filters */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Row 1: Labels and Publishers */}
            <div className="flex items-start gap-6">
              {/* Labels Section */}
              <div className="flex-1 min-w-[140px]">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-semibold text-sm text-foreground uppercase tracking-wide">Labels</span>
                </div>
                {loadingLabels ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <SearchableLabelDropdown
                    labels={allLabels}
                    selectedLabels={localFilters.labels}
                    onSelectionChange={handleLabelSelectionChange}
                    placeholder="Search labels..."
                  />
                )}
              </div>

              {/* Divider */}
              <div className="w-px self-stretch bg-border flex-shrink-0 hidden sm:block" />

              {/* Publishers Section */}
              <div className="flex-1 min-w-[140px]">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-semibold text-sm text-foreground uppercase tracking-wide">Publishers</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availablePublishers.length > 0 ? (
                    availablePublishers.slice(0, 4).map(publisher => {
                      const isSelected = localFilters.publishers.includes(publisher);
                      return (
                        <button
                          key={publisher}
                          onClick={() => togglePublisher(publisher)}
                          style={isSelected ? {
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            boxShadow: '0 0 0 2px var(--primary), 0 2px 8px rgba(0,0,0,0.15)',
                          } : {
                            backgroundColor: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                          }}
                          className={`
                            px-2.5 py-1 rounded-md text-xs font-medium truncate max-w-[140px]
                            transition-all duration-150
                            ${!isSelected ? 'hover:opacity-80' : ''}
                          `}
                          title={publisher}
                        >
                          {isSelected && <span className="mr-1">✓</span>}
                          {publisher}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground italic">None</span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Scheduled Toggle (Publisher only) */}
            {isPublisher && (
              <div className="flex items-start gap-6 pt-2 border-t border-border/50">
                {/* Scheduled Toggle - Only for publishers */}
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-semibold text-sm text-foreground uppercase tracking-wide">Options</span>
                  </div>
                  <button
                    onClick={() => setLocalFilters(prev => ({ ...prev, scheduledOnly: !prev.scheduledOnly }))}
                    style={localFilters.scheduledOnly ? {
                      backgroundColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      boxShadow: '0 0 0 2px var(--primary), 0 2px 8px rgba(0,0,0,0.15)',
                    } : {
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                    }}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-150
                      ${!localFilters.scheduledOnly ? 'hover:opacity-80' : ''}
                    `}
                    role="switch"
                    aria-checked={localFilters.scheduledOnly}
                  >
                    {localFilters.scheduledOnly ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        <span>✓ Scheduled Only</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Scheduled Only</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Date Range Picker */}
          <div className="flex-shrink-0 w-[280px] border-l border-border pl-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm text-foreground uppercase tracking-wide">Date Range</span>
            </div>
            <DateRangePicker
              value={localFilters.dateRange}
              onChange={(dateRange) => setLocalFilters(prev => ({ ...prev, dateRange }))}
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-border">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            Apply Filters
          </button>
          <button
            onClick={() => setIsFiltersOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative mb-6" ref={containerRef}>
      {/* Row with Search, Filter Button, and Sort */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />

        {/* Spacer on larger screens */}
        <div className="flex-1 hidden md:block" />

        {/* Filters Button */}
        {showFilters && filters && onFiltersChange && (
          <button
            ref={filterButtonRef}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`
              flex items-center gap-2 px-3 py-2.5
              border rounded-xl
              text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              ${activeCount > 0
                ? 'bg-primary/10 border-primary text-primary shadow-sm dark:bg-primary/15'
                : 'bg-secondary border-border text-foreground hover:bg-primary/5 hover:border-primary/30 dark:hover:bg-primary/10'
              }
            `}
            aria-expanded={isFiltersOpen}
            aria-haspopup="true"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold dark:shadow-[0_0_8px_rgba(0,255,194,0.4)]">
                {activeCount}
              </span>
            )}
          </button>
        )}

        {/* Sort Dropdown */}
        <SortDropdown
          value={sortValue}
          onChange={onSortChange}
        />
      </div>

      {/* Mega Menu rendered via Portal */}
      {megaMenu}
    </div>
  );
}

// Re-export types and default filter state
export type { SortOption, FilterState };
export const defaultFilterState: FilterState = {
  labels: [],
  publishers: [],
  dateRange: { start: null, end: null },
  signalType: [],
  scheduledOnly: false,
};
