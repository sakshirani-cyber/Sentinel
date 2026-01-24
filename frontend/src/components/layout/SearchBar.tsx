import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * SearchBar Component
 * 
 * Modern search input with debounced onChange and clear button.
 * Supports both light and dark modes with consistent styling.
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
    <div className="relative flex-1 max-w-md">
      {/* Input */}
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full h-10 pl-4 pr-10 bg-muted/50 border border-border rounded-xl text-foreground text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-background hover:border-primary/40 hover:bg-muted/70 transition-all duration-200 dark:bg-muted/30 dark:border-border dark:hover:border-primary/40 dark:hover:bg-muted/50 dark:focus:bg-background dark:focus:border-primary dark:focus:ring-primary/40"
        placeholder={placeholder}
      />

      {/* Clear Button - positioned on the right inside the input */}
      {localValue && (
        <button
          onClick={handleClear}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
          className="flex items-center justify-center w-5 h-5 rounded-full text-foreground-muted hover:text-foreground hover:bg-muted transition-all duration-200"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
