import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * SearchBar Component
 * 
 * Search input with debounced onChange and clear button.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search signals...',
  debounceMs = 300,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className="relative flex-1 max-w-md group">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-ribbit-fern group-focus-within:text-ribbit-hunter-green transition-colors" />
      </div>

      {/* Input - Glassmorphism */}
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="
          w-full pl-10 pr-10 py-2.5
          bg-ribbit-dry-sage/40 backdrop-blur-sm
          border border-ribbit-fern/30 rounded-lg
          text-ribbit-pine-teal placeholder-ribbit-pine-teal/50
          text-sm
          focus:outline-none focus:ring-2 focus:ring-ribbit-fern/40 focus:border-ribbit-fern
          focus:bg-ribbit-dry-sage/60
          hover:border-ribbit-fern/50
          transition-all duration-200
          dark:bg-ribbit-hunter-green/30 dark:border-ribbit-dry-sage/20
          dark:text-ribbit-dust-grey dark:placeholder-ribbit-dust-grey/50
          dark:focus:border-ribbit-dry-sage dark:focus:ring-ribbit-dry-sage/30
        "
        placeholder={placeholder}
      />

      {/* Clear Button */}
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-ribbit-fern/70 hover:text-ribbit-hunter-green transition-all duration-200 hover:scale-110"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
