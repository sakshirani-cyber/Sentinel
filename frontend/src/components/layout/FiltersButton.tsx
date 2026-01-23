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
          border rounded-lg
          text-sm
          focus:outline-none focus:ring-2 focus:ring-ribbit-fern/40 focus:border-ribbit-fern
          transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98]
          ${activeCount > 0
            ? 'bg-ribbit-hunter-green/20 border-ribbit-hunter-green text-ribbit-hunter-green shadow-sm'
            : 'bg-ribbit-dry-sage/40 backdrop-blur-sm border-ribbit-fern/30 text-ribbit-pine-teal hover:bg-ribbit-dry-sage/60 dark:bg-ribbit-hunter-green/30 dark:text-ribbit-dust-grey'
          }
        `}
        aria-expanded={isOpen}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-ribbit-hunter-green text-ribbit-dust-grey text-xs font-semibold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Filter Panel - Glassmorphism */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-ribbit-dry-sage/90 backdrop-blur-md rounded-xl shadow-xl border border-ribbit-fern/30 overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ribbit-fern/20 bg-ribbit-dry-sage/50">
            <h3 className="font-semibold text-ribbit-hunter-green">Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-ribbit-fern hover:text-ribbit-hunter-green transition-all hover:scale-110"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-4">
            {/* Labels Filter */}
            {availableLabels.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-ribbit-hunter-green mb-2">
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
                          ? 'bg-ribbit-hunter-green text-ribbit-dust-grey shadow-md'
                          : 'bg-ribbit-dust-grey/60 text-ribbit-pine-teal border border-ribbit-fern/20 hover:border-ribbit-fern/40'
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
                <label className="block text-sm font-semibold text-ribbit-hunter-green mb-2">
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
                          ? 'bg-ribbit-hunter-green text-ribbit-dust-grey shadow-md'
                          : 'bg-ribbit-dust-grey/60 text-ribbit-pine-teal border border-ribbit-fern/20 hover:border-ribbit-fern/40'
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
              <label className="block text-sm font-semibold text-ribbit-hunter-green mb-2">
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
                        ? 'bg-ribbit-hunter-green text-ribbit-dust-grey shadow-md'
                        : 'bg-ribbit-dust-grey/60 text-ribbit-pine-teal border border-ribbit-fern/20 hover:border-ribbit-fern/40'
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
              <label className="text-sm font-semibold text-ribbit-hunter-green">
                Scheduled Only
              </label>
              <button
                onClick={() => setLocalFilters(prev => ({ 
                  ...prev, 
                  scheduledOnly: !prev.scheduledOnly 
                }))}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full
                  transition-colors duration-200
                  ${localFilters.scheduledOnly 
                    ? 'bg-ribbit-hunter-green' 
                    : 'bg-ribbit-dust-grey border border-ribbit-fern/30'
                  }
                `}
                role="switch"
                aria-checked={localFilters.scheduledOnly}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow-md
                    transition-transform duration-200
                    ${localFilters.scheduledOnly ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-ribbit-fern/20 bg-ribbit-dry-sage/50">
            <button
              onClick={handleClear}
              className="text-sm text-ribbit-fern hover:text-ribbit-hunter-green transition-colors font-medium hover:underline"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-ribbit-hunter-green text-ribbit-dust-grey text-sm font-semibold rounded-lg shadow-md hover:bg-[#2f4a35] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
