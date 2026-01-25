import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, X } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // ISO string or datetime-local format (YYYY-MM-DDTHH:mm)
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}

/**
 * DateTimePicker Component
 * 
 * Custom date and time picker with:
 * - Calendar popup for date selection
 * - Time inputs for hours and minutes (no spinner arrows)
 * - Time validation (can't pick time less than current time for today)
 * - Full light/dark mode support with app theming
 * - Portal-based dropdown to escape overflow clipping
 */
export default function DateTimePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date and time',
  className = '',
  hasError = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [timeError, setTimeError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const selectedDate = value ? new Date(value) : null;
  
  // Local state for time inputs to allow proper typing of 2-digit numbers
  const [hoursInput, setHoursInput] = useState(() => 
    selectedDate ? selectedDate.getHours().toString().padStart(2, '0') : '12'
  );
  const [minutesInput, setMinutesInput] = useState(() => 
    selectedDate ? selectedDate.getMinutes().toString().padStart(2, '0') : '00'
  );
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);

  // Sync local state with value when it changes externally (not during editing)
  useEffect(() => {
    if (!isEditingHours && selectedDate) {
      setHoursInput(selectedDate.getHours().toString().padStart(2, '0'));
    }
  }, [selectedDate?.getHours(), isEditingHours]);

  useEffect(() => {
    if (!isEditingMinutes && selectedDate) {
      setMinutesInput(selectedDate.getMinutes().toString().padStart(2, '0'));
    }
  }, [selectedDate?.getMinutes(), isEditingMinutes]);

  // Derived values for when no date is selected
  const selectedHours = selectedDate ? selectedDate.getHours().toString().padStart(2, '0') : '12';
  const selectedMinutes = selectedDate ? selectedDate.getMinutes().toString().padStart(2, '0') : '00';

  // Parse min/max dates
  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;

  // Set current month to selected date or today
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, []);

  // Validate time when value changes
  useEffect(() => {
    if (selectedDate) {
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      
      if (isToday && selectedDate <= now) {
        setTimeError('Time must be in the future');
      } else {
        setTimeError(null);
      }
    } else {
      setTimeError(null);
    }
  }, [value]);

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 420; // Approximate height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setDropdownPosition({
        top: spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove 
          ? rect.bottom + 8 
          : rect.top - dropdownHeight - 8,
        left: Math.min(rect.left, window.innerWidth - 300),
      });
    }
  }, []);

  // Update position when dropdown opens
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
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
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

  // Date helpers
  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isDateDisabled = (date: Date) => {
    // Can't select past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (dateOnly < today) return true;

    if (minDate) {
      const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (dateOnly < minDateOnly) return true;
    }
    if (maxDate) {
      const maxDateOnly = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (dateOnly > maxDateOnly) return true;
    }
    return false;
  };

  // Handle day click
  const handleDayClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isDateDisabled(date)) return;

    const now = new Date();
    const isTodaySelected = date.toDateString() === now.toDateString();
    
    let hours = parseInt(selectedHours) || 12;
    let minutes = parseInt(selectedMinutes) || 0;
    
    // If selecting today and the time is in the past, set to current time + 5 minutes
    if (isTodaySelected) {
      const proposedTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
      if (proposedTime <= now) {
        const newTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        hours = newTime.getHours();
        minutes = newTime.getMinutes();
      }
    }
    
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    const formattedValue = formatForInput(newDate);
    onChange(formattedValue);
  };

  // Handle time change with validation
  const handleTimeChange = (hours: string, minutes: string) => {
    const h = Math.min(23, Math.max(0, parseInt(hours) || 0));
    const m = Math.min(59, Math.max(0, parseInt(minutes) || 0));
    
    const baseDate = selectedDate || new Date();
    const newDate = new Date(
      baseDate.getFullYear(), 
      baseDate.getMonth(), 
      baseDate.getDate(), 
      h, 
      m
    );
    
    // Check if the new time is valid (not in the past for today)
    const now = new Date();
    const isTodaySelected = baseDate.toDateString() === now.toDateString();
    
    if (isTodaySelected && newDate <= now) {
      setTimeError('Time must be in the future');
    } else {
      setTimeError(null);
    }
    
    const formattedValue = formatForInput(newDate);
    onChange(formattedValue);
  };

  // Format date for input (YYYY-MM-DDTHH:mm)
  const formatForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format date for display
  const formatForDisplay = (date: Date | null) => {
    if (!date) return placeholder;
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Clear value
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setTimeError(null);
  };

  // Styles for hiding number input spinners
  const timeInputStyle: React.CSSProperties = {
    width: '48px',
    padding: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'center',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    outline: 'none',
    // Hide spinner arrows
    MozAppearance: 'textfield',
    WebkitAppearance: 'none',
    appearance: 'textfield',
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hide spinner arrows globally for this component */}
      <style>{`
        .datetime-picker-time-input::-webkit-outer-spin-button,
        .datetime-picker-time-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .datetime-picker-time-input {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 w-full px-4 py-3
          bg-input-background dark:bg-input
          border-2 rounded-xl
          text-sm text-left
          transition-all duration-200
          focus:outline-none focus:ring-4
          ${hasError || timeError
            ? 'border-destructive focus:border-destructive focus:ring-destructive/20' 
            : 'border-border hover:border-foreground-muted focus:border-primary focus:ring-ring'
          }
          ${selectedDate ? 'text-foreground' : 'text-muted-foreground'}
        `}
      >
        <CalendarIcon className="w-5 h-5 text-primary flex-shrink-0" />
        <span className="flex-1 truncate">{formatForDisplay(selectedDate)}</span>
        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </button>

      {/* Dropdown Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: '290px',
            zIndex: 999999,
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Month Navigation Header */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 14px',
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--background)' }}>
            {/* Week Day Headers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              {weekDays.map(day => (
                <div
                  key={day}
                  style={{ 
                    width: '36px', 
                    textAlign: 'center', 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
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

                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                const isDisabled = isDateDisabled(date);

                let bgColor = 'transparent';
                let textColor = isDisabled ? 'var(--muted-foreground)' : 'var(--foreground)';

                if (isSelected) {
                  bgColor = 'var(--primary)';
                  textColor = 'var(--primary-foreground)';
                }

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={(e) => handleDayClick(e, date)}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={isDisabled}
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
                      borderRadius: '8px',
                      border: isTodayDate && !isSelected ? '2px solid var(--primary)' : 'none',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.4 : 1,
                      transition: 'all 150ms ease',
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected && !isDisabled) {
                        e.currentTarget.style.backgroundColor = 'var(--muted)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected && !isDisabled) {
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

          {/* Time Input Section */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px', 
              padding: '14px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--muted)',
            }}
          >
            <Clock className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={isEditingHours ? hoursInput : selectedHours}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setHoursInput(val);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="datetime-picker-time-input"
                style={timeInputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--ring)';
                  setIsEditingHours(true);
                  setHoursInput(selectedHours);
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                  setIsEditingHours(false);
                  // Pad with zero and apply on blur
                  const val = parseInt(hoursInput) || 0;
                  const paddedVal = Math.min(23, Math.max(0, val)).toString().padStart(2, '0');
                  setHoursInput(paddedVal);
                  handleTimeChange(paddedVal, selectedMinutes);
                }}
              />
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }}>:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={isEditingMinutes ? minutesInput : selectedMinutes}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setMinutesInput(val);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="datetime-picker-time-input"
                style={timeInputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--ring)';
                  setIsEditingMinutes(true);
                  setMinutesInput(selectedMinutes);
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                  setIsEditingMinutes(false);
                  // Pad with zero and apply on blur
                  const val = parseInt(minutesInput) || 0;
                  const paddedVal = Math.min(59, Math.max(0, val)).toString().padStart(2, '0');
                  setMinutesInput(paddedVal);
                  handleTimeChange(selectedHours, paddedVal);
                }}
              />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>24h</span>
          </div>

          {/* Time Error Message */}
          {timeError && (
            <div 
              style={{ 
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--destructive)',
                backgroundColor: 'hsl(var(--destructive) / 0.1)',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
              }}
            >
              {timeError}
            </div>
          )}

          {/* Quick Actions */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px', 
              padding: '10px 14px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const now = new Date();
                now.setMinutes(now.getMinutes() + 30);
                onChange(formatForInput(now));
                setTimeError(null);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary-foreground)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.color = 'var(--muted-foreground)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              In 30 min
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const now = new Date();
                now.setHours(now.getHours() + 1);
                onChange(formatForInput(now));
                setTimeError(null);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary-foreground)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.color = 'var(--muted-foreground)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              In 1 hour
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                onChange(formatForInput(tomorrow));
                setTimeError(null);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary-foreground)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.color = 'var(--muted-foreground)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              Tomorrow 9AM
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
