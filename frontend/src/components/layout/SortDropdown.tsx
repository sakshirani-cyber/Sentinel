import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'deadline' | 'title';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'deadline', label: 'By Deadline' },
  { value: 'title', label: 'Title A-Z' },
];

/**
 * SortDropdown Component
 * 
 * Dropdown for selecting sort order.
 */
export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = sortOptions.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSelect = (option: SortOption) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2.5
          bg-secondary border border-border rounded-xl
          text-sm font-medium text-foreground
          hover:bg-primary/5 hover:border-primary/30
          hover:scale-[1.02]
          active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
          transition-all duration-200
          dark:hover:bg-primary/10
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <ArrowUpDown className="w-4 h-4 text-primary" />
        <span>{selectedOption?.label || 'Sort'}</span>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl border border-border overflow-hidden z-50 animate-fade-in"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <ul role="listbox" className="py-1" style={{ backgroundColor: 'var(--background)' }}>
            {sortOptions.map((option) => (
              <li key={option.value}>
                <button
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm
                    transition-all duration-200
                    ${value === option.value
                      ? 'bg-primary/20 text-primary font-medium dark:bg-primary/25'
                      : 'text-foreground hover:bg-muted hover:translate-x-1'
                    }
                  `}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
