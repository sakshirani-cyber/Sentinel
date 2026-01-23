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
          bg-ribbit-dry-sage/40 backdrop-blur-sm
          border border-ribbit-fern/30 rounded-lg
          text-sm text-ribbit-pine-teal
          hover:bg-ribbit-dry-sage/60 hover:border-ribbit-fern/50
          hover:scale-[1.02]
          active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-ribbit-fern/40 focus:border-ribbit-fern
          transition-all duration-200
          dark:bg-ribbit-hunter-green/30 dark:border-ribbit-dry-sage/20
          dark:text-ribbit-dust-grey
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <ArrowUpDown className="w-4 h-4 text-ribbit-fern" />
        <span>{selectedOption?.label || 'Sort'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-ribbit-dry-sage/90 backdrop-blur-md rounded-lg shadow-xl border border-ribbit-fern/30 overflow-hidden z-50 animate-fade-in">
          <ul role="listbox" className="py-1">
            {sortOptions.map((option) => (
              <li key={option.value}>
                <button
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm
                    transition-all duration-200
                    ${value === option.value
                      ? 'bg-ribbit-hunter-green/20 text-ribbit-hunter-green font-medium'
                      : 'text-ribbit-pine-teal hover:bg-ribbit-hunter-green/10 hover:translate-x-1'
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
