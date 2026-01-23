import SearchBar from './SearchBar';
import SortDropdown, { SortOption } from './SortDropdown';
import FiltersButton, { FilterState } from './FiltersButton';

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
}

/**
 * SearchFilterRow Component
 * 
 * A complete row with search bar, sort dropdown, and optional filters button.
 */
export default function SearchFilterRow({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  sortValue,
  onSortChange,
  filters,
  onFiltersChange,
  availableLabels,
  availablePublishers,
  showFilters = true,
}: SearchFilterRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
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
        <FiltersButton
          filters={filters}
          onFiltersChange={onFiltersChange}
          availableLabels={availableLabels}
          availablePublishers={availablePublishers}
        />
      )}

      {/* Sort Dropdown */}
      <SortDropdown
        value={sortValue}
        onChange={onSortChange}
      />
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
