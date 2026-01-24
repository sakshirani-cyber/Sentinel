import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Checkbox Component
 * 
 * Custom styled checkbox matching the app's design system.
 * Features:
 * - Rounded corners (rounded-md)
 * - Primary color when checked
 * - Custom check icon
 * - Proper focus ring
 * - Dark mode support
 * - Optional label and description
 */
export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  size = 'md',
}: CheckboxProps) {
  const sizeClasses = {
    sm: { box: 'w-4 h-4', icon: 'w-2.5 h-2.5', text: 'text-sm', desc: 'text-xs' },
    md: { box: 'w-5 h-5', icon: 'w-3 h-3', text: 'text-sm', desc: 'text-xs' },
    lg: { box: 'w-6 h-6', icon: 'w-4 h-4', text: 'text-base', desc: 'text-sm' },
  };

  const sizes = sizeClasses[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label
      className={`
        inline-flex items-start gap-3 cursor-pointer select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Checkbox Box */}
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          ${sizes.box} flex-shrink-0 rounded-md
          flex items-center justify-center
          border-2 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
          ${checked
            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
            : 'bg-input-background dark:bg-input border-border hover:border-primary/50'
          }
          ${disabled ? '' : 'hover:shadow-sm'}
        `}
        style={{ marginTop: '2px' }}
      >
        {checked && (
          <Check className={`${sizes.icon} stroke-[3]`} />
        )}
      </div>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <span className={`${sizes.text} font-medium text-foreground block`}>
              {label}
            </span>
          )}
          {description && (
            <span className={`${sizes.desc} text-muted-foreground block mt-0.5`}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

/**
 * CheckboxSimple - A minimal checkbox without label wrapper
 * Use this when you need just the checkbox control
 */
export function CheckboxSimple({
  checked,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
}: Omit<CheckboxProps, 'label' | 'description'>) {
  const sizeClasses = {
    sm: { box: 'w-4 h-4', icon: 'w-2.5 h-2.5' },
    md: { box: 'w-5 h-5', icon: 'w-3 h-3' },
    lg: { box: 'w-6 h-6', icon: 'w-4 h-4' },
  };

  const sizes = sizeClasses[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        ${sizes.box} flex-shrink-0 rounded-md
        flex items-center justify-center
        border-2 transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
        ${checked
          ? 'bg-primary border-primary text-primary-foreground shadow-sm'
          : 'bg-input-background dark:bg-input border-border hover:border-primary/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
        ${className}
      `}
    >
      {checked && (
        <Check className={`${sizes.icon} stroke-[3]`} />
      )}
    </div>
  );
}
