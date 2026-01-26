import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Check, ChevronDown } from 'lucide-react';

interface SearchablePublisherDropdownProps {
  publishers: string[];
  selectedPublishers: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchablePublisherDropdown Component
 * 
 * A searchable dropdown for selecting multiple publishers.
 * - Search input
 * - Dropdown list with filtered results in grid layout
 * - Multi-select with visual indicators (checkmarks)
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Portal-based positioning
 * - Dark/light mode compatible styling
 * - Shows selected publishers as chips above the dropdown
 */
export default function SearchablePublisherDropdown({
  publishers,
  selectedPublishers,
  onSelectionChange,
  placeholder = 'Search publishers...',
  className = '',
}: SearchablePublisherDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter publishers based on search query
  const filteredPublishers = publishers.filter(publisher => {
    const searchLower = searchQuery.toLowerCase();
    return publisher.toLowerCase().includes(searchLower);
  });

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Update position when dropdown opens and on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      // Focus input when dropdown opens
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
        triggerRef.current?.focus();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape as any);
    }
    return () => document.removeEventListener('keydown', handleEscape as any);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPublishers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPublishers[selectedIndex]) {
          togglePublisher(filteredPublishers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
        triggerRef.current?.focus();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isOpen]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Toggle publisher selection
  const togglePublisher = (publisher: string) => {
    const isSelected = selectedPublishers.includes(publisher);
    
    if (isSelected) {
      onSelectionChange(selectedPublishers.filter(p => p !== publisher));
    } else {
      onSelectionChange([...selectedPublishers, publisher]);
    }
  };

  // Remove selected publisher
  const removePublisher = (publisher: string) => {
    onSelectionChange(selectedPublishers.filter(p => p !== publisher));
  };

  // Check if publisher is selected
  const isPublisherSelected = (publisher: string): boolean => {
    return selectedPublishers.includes(publisher);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button / Selected Publishers Display */}
      <div className="space-y-2">
        {/* Selected Publishers as Chips */}
        {selectedPublishers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedPublishers.map(publisher => {
              return (
                <button
                  key={publisher}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePublisher(publisher);
                  }}
                  className="
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                    bg-primary text-primary-foreground
                    hover:bg-primary/90 transition-all duration-150
                    shadow-sm
                  "
                  title={`Remove ${publisher}`}
                >
                  <Users className="w-3 h-3" />
                  <span>{publisher}</span>
                  <X className="w-3 h-3 hover:text-destructive" />
                </button>
              );
            })}
          </div>
        )}

        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-full flex items-center justify-between gap-2 px-3 py-2
            bg-muted/50 border border-border rounded-lg
            text-sm text-left
            hover:bg-muted hover:border-primary/30
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            transition-all duration-200
            dark:bg-muted/30 dark:hover:bg-muted/50
          "
        >
          <span className={`flex-1 truncate ${selectedPublishers.length === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
            {selectedPublishers.length === 0 ? placeholder : `${selectedPublishers.length} publisher${selectedPublishers.length === 1 ? '' : 's'} selected`}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown - rendered via Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: '700px',
            minWidth: '700px',
            maxWidth: '700px',
            zIndex: 999999,
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="
                  w-full px-3 py-2
                  bg-background border border-border rounded-lg
                  text-sm text-foreground
                  placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-all duration-200
                "
              />
            </div>
          </div>

          {/* Publishers List - Grid Layout */}
          <div 
            ref={listRef}
            className="max-h-[100px] overflow-y-auto p-2"
            style={{ backgroundColor: 'var(--background)' }}
          >
            {filteredPublishers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No publishers found' : 'No publishers available'}
              </div>
            ) : (
              <div 
                className="grid gap-1.5"
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                  gap: '0.375rem'
                }}
              >
                {filteredPublishers.map((publisher, index) => {
                  const isSelected = isPublisherSelected(publisher);
                  const isHighlighted = index === selectedIndex;

                  return (
                    <button
                      key={publisher}
                      type="button"
                      onClick={() => togglePublisher(publisher)}
                      title={publisher}
                      className={`
                        w-full relative flex items-center gap-1.5 px-2 py-1 rounded-md
                        text-xs text-left
                        transition-all duration-150
                        ${isHighlighted ? 'bg-primary/10 ring-2 ring-primary/30' : 'hover:bg-muted/50'}
                        ${isSelected 
                          ? 'bg-primary/10 border border-primary/50' 
                          : 'border border-border/50'
                        }
                        group
                      `}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={`
                        flex items-center justify-center w-3.5 h-3.5 rounded border flex-shrink-0
                        ${isSelected 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-border bg-background'
                        }
                      `}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span className={`font-medium truncate flex-1 min-w-0 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {publisher}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          {filteredPublishers.length > 0 && (
            <div 
              className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              Use arrow keys to navigate, Enter to select
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
