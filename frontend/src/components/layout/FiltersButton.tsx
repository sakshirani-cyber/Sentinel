import { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

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
}

const defaultFilters: FilterState = {
  labels: [],
  publishers: [],
  dateRange: { start: null, end: null },
  signalType: [],
  scheduledOnly: false,
};

/**
 * FiltersButton Component
 * 
 * Button that opens a filter panel dropdown.
 * Shows active filter count badge.
 */
export default function FiltersButton({
  filters,
  onFiltersChange,
  availableLabels = [],
  availablePublishers = [],
}: FiltersButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate active filter count
  const activeCount = 
    filters.labels.length +
    filters.publishers.length +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    filters.signalType.length +
    (filters.scheduledOnly ? 1 : 0);

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

  const toggleSignalType = (type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      signalType: prev.signalType.includes(type)
        ? prev.signalType.filter(t => t !== type)
        : [...prev.signalType, type],
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
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold dark:shadow-[0_0_8px_rgba(0,255,194,0.4)]">
            {activeCount}
          </span>
        )}
      </button>

      {/* Filter Panel - Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-popover/95 dark:bg-popover/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
            <h3 className="font-semibold text-foreground">Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-primary/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {/* Labels Filter */}
            {availableLabels.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Labels
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableLabels.map(label => (
                    <button
                      key={label}
                      onClick={() => toggleLabel(label)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        transition-all duration-200 hover:scale-105
                        ${localFilters.labels.includes(label)
                          ? 'bg-primary text-primary-foreground shadow-md dark:shadow-[0_0_8px_rgba(0,255,194,0.3)]'
                          : 'bg-muted text-muted-foreground border border-border hover:border-primary/40 hover:text-primary'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Publishers Filter */}
            {availablePublishers.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Publishers
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePublishers.slice(0, 5).map(publisher => (
                    <button
                      key={publisher}
                      onClick={() => togglePublisher(publisher)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium
                        transition-all duration-200 hover:scale-105
                        ${localFilters.publishers.includes(publisher)
                          ? 'bg-primary text-primary-foreground shadow-md dark:shadow-[0_0_8px_rgba(0,255,194,0.3)]'
                          : 'bg-muted text-muted-foreground border border-border hover:border-primary/40 hover:text-primary'
                        }
                      `}
                    >
                      {publisher}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Signal Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Signal Type
              </label>
              <div className="flex flex-wrap gap-2">
                {['Poll', 'Survey', 'Form'].map(type => (
                  <button
                    key={type}
                    onClick={() => toggleSignalType(type.toLowerCase())}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all duration-200 hover:scale-105
                      ${localFilters.signalType.includes(type.toLowerCase())
                        ? 'bg-primary text-primary-foreground shadow-md dark:shadow-[0_0_8px_rgba(0,255,194,0.3)]'
                        : 'bg-muted text-muted-foreground border border-border hover:border-primary/40 hover:text-primary'
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Only Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Scheduled Only
              </label>
              <button
                onClick={() => setLocalFilters(prev => ({ 
                  ...prev, 
                  scheduledOnly: !prev.scheduledOnly 
                }))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full
                  transition-all duration-200
                  ${localFilters.scheduledOnly 
                    ? 'bg-primary dark:shadow-[0_0_10px_rgba(0,255,194,0.4)]' 
                    : 'bg-muted'
                  }
                `}
                role="switch"
                aria-checked={localFilters.scheduledOnly}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200"
                  style={{ transform: localFilters.scheduledOnly ? 'translateX(1.25rem)' : 'translateX(0.125rem)' }}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background/50">
            <button
              onClick={handleClear}
              className="text-sm text-foreground-secondary hover:text-primary transition-colors font-medium hover:underline"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl shadow-md hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] transition-all duration-200 dark:hover:shadow-[0_0_20px_rgba(0,255,194,0.3)]"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
