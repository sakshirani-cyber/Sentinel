import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface DateRange {
  start: string | null;
  end: string | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

/**
 * DateRangePicker Component
 * 
 * Airbnb-style single calendar for selecting date ranges.
 * - Opens as dropdown when clicked
 * - Single calendar view
 * - Click to select start date, click again for end date
 * - Visual range highlight between dates
 * - Quick presets for common ranges
 * - Full light/dark mode support with app theming
 */
export default function DateRangePicker({
  value,
  onChange,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionState, setSelectionState] = useState<'start' | 'end'>('start');
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse dates from strings
  const startDate = value.start ? new Date(value.start) : null;
  const endDate = value.end ? new Date(value.end) : null;

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, []);

  // Reset selection state when dates are cleared externally
  useEffect(() => {
    if (!value.start && !value.end) {
      setSelectionState('start');
    }
  }, [value.start, value.end]);

  // Update position when dropdown opens and on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
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
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigation
  const goToPreviousMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Date comparison helpers
  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isInRange = (date: Date) => {
    if (!startDate) return false;
    
    const effectiveEnd = endDate || hoverDate;
    if (!effectiveEnd) return false;

    const start = startDate < effectiveEnd ? startDate : effectiveEnd;
    const end = startDate < effectiveEnd ? effectiveEnd : startDate;

    return date > start && date < end;
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  // Handle day click
  const handleDayClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (selectionState === 'start') {
      onChange({ start: date.toISOString(), end: null });
      setSelectionState('end');
    } else {
      // If clicking a date before the start, swap them
      if (startDate && date < startDate) {
        onChange({ start: date.toISOString(), end: startDate.toISOString() });
      } else {
        onChange({ start: value.start, end: date.toISOString() });
      }
      setSelectionState('start');
      // Don't close - let user continue or manually close
    }
  };

  // Quick presets
  const setToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onChange({ start: today.toISOString(), end: today.toISOString() });
    setSelectionState('start');
  };

  const setThisWeek = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    onChange({ start: startOfWeek.toISOString(), end: endOfWeek.toISOString() });
    setSelectionState('start');
  };

  const setThisMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    onChange({ start: startOfMonth.toISOString(), end: endOfMonth.toISOString() });
    setSelectionState('start');
  };

  const clearDates = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ start: null, end: null });
    setSelectionState('start');
    setHoverDate(null);
  };

  // Format date for display
  const formatDateShort = (date: Date | null) => {
    if (!date) return '—';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  // Get display text for trigger button
  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatDateShort(startDate)} → ${formatDateShort(endDate)}`;
    }
    if (startDate) {
      return `${formatDateShort(startDate)} → Select end`;
    }
    return 'Select dates';
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 w-full px-3 py-2
          bg-muted/50 border border-border rounded-lg
          text-sm text-left
          hover:bg-muted hover:border-primary/30
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          transition-all duration-200
          ${startDate || endDate ? 'text-foreground' : 'text-muted-foreground'}
        `}
      >
        <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="flex-1 truncate">{getDisplayText()}</span>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={clearDates}
            className="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Clear dates"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </button>

      {/* Calendar Dropdown - rendered via Portal to escape overflow clipping */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: '280px',
            zIndex: 999999,
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Header with Month Navigation */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '10px 12px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            <button
              type="button"
              onClick={goToPreviousMonth}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--muted-foreground)',
              }}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={goToNextMonth}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--muted-foreground)',
              }}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{ padding: '12px', backgroundColor: 'var(--background)' }}>
            {/* Week Day Headers - using inline flex for guaranteed horizontal layout */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              {weekDays.map(day => (
                <div
                  key={day}
                  style={{ width: '36px', textAlign: 'center', fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid - using inline styles for guaranteed grid layout */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 36px)', 
              gap: '2px',
              justifyContent: 'space-between'
            }}>
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} style={{ width: '36px', height: '36px' }} />;
                }

                const isStart = isSameDay(date, startDate);
                const isEnd = isSameDay(date, endDate);
                const inRange = isInRange(date);
                const isTodayDate = isToday(date);
                const isSelected = isStart || isEnd;

                // Determine background and text colors
                let bgColor = 'transparent';
                let textColor = 'var(--foreground)';
                let borderRadius = '6px';

                if (isSelected) {
                  bgColor = 'var(--primary)';
                  textColor = 'var(--primary-foreground)';
                } else if (inRange) {
                  bgColor = 'var(--primary-muted)';
                  textColor = 'var(--foreground)';
                  borderRadius = '0';
                }

                // Range edge styling
                if (isStart && (endDate || hoverDate)) {
                  borderRadius = '6px 0 0 6px';
                }
                if (isEnd) {
                  borderRadius = '0 6px 6px 0';
                }
                if (isStart && isEnd) {
                  borderRadius = '6px';
                }

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={(e) => handleDayClick(e, date)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseEnter={() => selectionState === 'end' && setHoverDate(date)}
                    onMouseLeave={() => setHoverDate(null)}
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 500,
                      backgroundColor: bgColor,
                      color: textColor,
                      borderRadius: borderRadius,
                      border: isTodayDate && !isSelected ? '1px solid var(--primary)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      position: 'relative',
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected && !inRange) {
                        e.currentTarget.style.backgroundColor = 'var(--muted)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected && !inRange) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 12px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Quick:</span>
            <button
              type="button"
              onClick={setToday}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={setThisWeek}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={setThisMonth}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              This Month
            </button>
          </div>

          {/* Selection hint */}
          {selectionState === 'end' && startDate && !endDate && (
            <div 
              style={{ 
                padding: '8px 12px', 
                textAlign: 'center', 
                fontSize: '11px', 
                color: 'var(--primary)', 
                backgroundColor: 'var(--primary-muted)',
                borderTop: '1px solid var(--border)',
              }}
            >
              Click another date to complete the range
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
