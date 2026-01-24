import { useState, useRef, useEffect } from 'react';
import { Filter, X, Tag, Users, CalendarDays, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import DateRangePicker from '../common/DateRangePicker';

export interface FilterState {
  labels: string[];
  publishers: string[];
  dateRange: { start: string | null; end: string | null };
  signalType: string[];
  scheduledOnly: boolean;
}

interface FiltersButtonProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableLabels?: string[];
  availablePublishers?: string[];
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
 * FiltersButton Component - Mega Menu Style
 * 
 * Wide horizontal mega menu for filters.
 * Solid background with proper light/dark mode colors.
 */
export default function FiltersButton({
  filters,
  onFiltersChange,
  availableLabels = [],
  availablePublishers = [],
  isPublisher = false,
}: FiltersButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate active filter count
  const activeCount = 
    filters.labels.length +
    filters.publishers.length +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    (isPublisher && filters.scheduledOnly ? 1 : 0);

  // Sync local filters with external
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    setIsOpen(false);
  };

  const toggleLabel = (label: string) => {
    setLocalFilters(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label],
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

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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
        aria-expanded={isOpen}
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

      {/* Mega Menu Filter Panel - Wide horizontal layout with solid background */}
      {isOpen && (
        <div 
          className="
            absolute right-0 mt-3 
            w-[800px] max-w-[calc(100vw-2rem)]
            bg-white dark:bg-[#1a1a1a]
            rounded-2xl 
            shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]
            border border-gray-200 dark:border-gray-700
            overflow-hidden 
            z-[100]
            animate-in fade-in-0 zoom-in-95 slide-in-from-top-2
            duration-200
          "
          role="dialog"
          aria-label="Filter options"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#222]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Filters</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Refine your signals</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Content - Two Column Layout */}
          <div className="p-6 bg-white dark:bg-[#1a1a1a]">
            <div className="flex gap-6">
              {/* Left Column: Labels, Publishers, Type, Options */}
              <div className="flex-1 space-y-5">
                {/* Row 1: Labels and Publishers */}
                <div className="grid grid-cols-2 gap-5">
                  {/* Labels */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm uppercase tracking-wide">Labels</span>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[60px] max-h-[100px] overflow-y-auto pr-1">
                      {availableLabels.length > 0 ? (
                        availableLabels.map(label => (
                          <button
                            key={label}
                            onClick={() => toggleLabel(label)}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium
                              transition-all duration-200 hover:scale-105
                              ${localFilters.labels.includes(label)
                                ? 'bg-primary text-white shadow-md dark:shadow-[0_0_12px_rgba(0,255,194,0.4)]'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary/50 hover:text-primary dark:hover:text-primary'
                              }
                            `}
                          >
                            {label}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No labels available</p>
                      )}
                    </div>
                  </div>

                  {/* Publishers */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm uppercase tracking-wide">Publishers</span>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[60px] max-h-[100px] overflow-y-auto pr-1">
                      {availablePublishers.length > 0 ? (
                        availablePublishers.slice(0, 8).map(publisher => (
                          <button
                            key={publisher}
                            onClick={() => togglePublisher(publisher)}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium
                              transition-all duration-200 hover:scale-105
                              ${localFilters.publishers.includes(publisher)
                                ? 'bg-primary text-white shadow-md dark:shadow-[0_0_12px_rgba(0,255,194,0.4)]'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary/50 hover:text-primary dark:hover:text-primary'
                              }
                            `}
                          >
                            {publisher}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No publishers available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 2: Scheduled Toggle (Publisher only) */}
                {isPublisher && (
                  <div className="flex gap-5 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {/* Scheduled Only Toggle - Publisher only */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm uppercase tracking-wide">Options</span>
                      </div>
                      <button
                        onClick={() => setLocalFilters(prev => ({ 
                          ...prev, 
                          scheduledOnly: !prev.scheduledOnly 
                        }))}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                          transition-all duration-200 hover:scale-105
                          ${localFilters.scheduledOnly 
                            ? 'bg-primary text-white shadow-md dark:shadow-[0_0_12px_rgba(0,255,194,0.4)]' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary/50'
                          }
                        `}
                        role="switch"
                        aria-checked={localFilters.scheduledOnly}
                      >
                        {localFilters.scheduledOnly ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                        <span>Scheduled Only</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Date Range Picker */}
              <div className="w-[280px] flex-shrink-0 border-l border-gray-200 dark:border-gray-700 pl-6">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm uppercase tracking-wide">Date Range</span>
                </div>
                <DateRangePicker
                  value={localFilters.dateRange}
                  onChange={(dateRange) => setLocalFilters(prev => ({ ...prev, dateRange }))}
                />
              </div>
            </div>
          </div>

          {/* Footer - Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#222]">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
            >
              Clear All
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] transition-all duration-200 dark:shadow-[0_4px_20px_rgba(0,255,194,0.3)] dark:hover:shadow-[0_8px_30px_rgba(0,255,194,0.4)]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
