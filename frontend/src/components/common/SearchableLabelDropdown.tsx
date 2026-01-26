import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Tag, Check, ChevronDown } from 'lucide-react';
import { stripLabelMarkers, parseLabelName } from '../../utils/labelUtils';

interface Label {
  id: string;
  name: string;
  description?: string;
}

interface SearchableLabelDropdownProps {
  labels: Label[];
  selectedLabels: string[]; // Array of label names (raw, without markers)
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchableLabelDropdown Component
 * 
 * A searchable dropdown for selecting multiple labels.
 * - Search input with clear button
 * - Dropdown list with filtered results
 * - Multi-select with visual indicators (checkmarks)
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Portal-based positioning
 * - Dark/light mode compatible styling
 * - Shows selected labels as chips above the dropdown
 */
export default function SearchableLabelDropdown({
  labels,
  selectedLabels,
  onSelectionChange,
  placeholder = 'Search labels...',
  className = '',
}: SearchableLabelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter labels based on search query
  const filteredLabels = labels.filter(label => {
    const rawName = stripLabelMarkers(label.name).toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return rawName.includes(searchLower) || 
           (label.description && label.description.toLowerCase().includes(searchLower));
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
          prev < filteredLabels.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredLabels[selectedIndex]) {
          toggleLabel(filteredLabels[selectedIndex]);
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

  // Toggle label selection
  const toggleLabel = (label: Label) => {
    const rawName = stripLabelMarkers(label.name);
    const isSelected = selectedLabels.includes(rawName);
    
    if (isSelected) {
      onSelectionChange(selectedLabels.filter(l => l !== rawName));
    } else {
      onSelectionChange([...selectedLabels, rawName]);
    }
  };

  // Remove selected label
  const removeLabel = (labelName: string) => {
    onSelectionChange(selectedLabels.filter(l => l !== labelName));
  };

  // Check if label is selected
  const isLabelSelected = (label: Label): boolean => {
    const rawName = stripLabelMarkers(label.name);
    return selectedLabels.includes(rawName);
  };

  // Get display text for trigger button
  const getDisplayText = () => {
    if (selectedLabels.length === 0) {
      return placeholder;
    }
    if (selectedLabels.length === 1) {
      const label = labels.find(l => stripLabelMarkers(l.name) === selectedLabels[0]);
      return label ? parseLabelName(label.name) : selectedLabels[0];
    }
    return `${selectedLabels.length} labels selected`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button / Selected Labels Display */}
      <div className="space-y-2">
        {/* Selected Labels as Chips */}
        {selectedLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedLabels.map(labelName => {
              const label = labels.find(l => stripLabelMarkers(l.name) === labelName);
              const displayName = label ? parseLabelName(label.name) : labelName;
              
              return (
                <button
                  key={labelName}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLabel(labelName);
                  }}
                  className="
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                    bg-primary text-primary-foreground
                    hover:bg-primary/90 transition-all duration-150
                    shadow-sm
                  "
                  title={`Remove ${displayName}`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{displayName}</span>
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
          <span className={`flex-1 truncate ${selectedLabels.length === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
            {selectedLabels.length === 0 ? placeholder : `${selectedLabels.length} label${selectedLabels.length === 1 ? '' : 's'} selected`}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="
                  w-full pl-9 pr-8 py-2
                  bg-background border border-border rounded-lg
                  text-sm text-foreground
                  placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-all duration-200
                "
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Labels List - Grid Layout */}
          <div 
            ref={listRef}
            className="max-h-[100px] overflow-y-auto p-2"
            style={{ backgroundColor: 'var(--background)' }}
          >
            {filteredLabels.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No labels found' : 'No labels available'}
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
                {filteredLabels.map((label, index) => {
                  const rawName = stripLabelMarkers(label.name);
                  const displayName = parseLabelName(label.name);
                  const isSelected = isLabelSelected(label);
                  const isHighlighted = index === selectedIndex;

                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label)}
                      title={label.description || displayName}
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
                        {displayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          {filteredLabels.length > 0 && (
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
