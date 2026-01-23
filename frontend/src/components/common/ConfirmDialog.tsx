import { ReactNode, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  isLoading?: boolean;
  children?: ReactNode;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    buttonBg: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/30',
    iconColor: 'text-ribbit-hunter-green dark:text-ribbit-dry-sage',
    buttonBg: 'bg-ribbit-hunter-green hover:bg-[#2f4a35]',
  },
};

/**
 * ConfirmDialog Component
 * 
 * A reusable confirmation modal with:
 * - Multiple variants (danger, warning, info, success)
 * - Glassmorphism styling
 * - Keyboard accessibility
 * - Loading state support
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ribbit-pine-teal/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md bg-ribbit-dust-grey dark:bg-ribbit-pine-teal border border-ribbit-fern/30 dark:border-ribbit-dry-sage/20 rounded-2xl shadow-2xl animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-lg text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 hover:text-ribbit-pine-teal dark:hover:text-ribbit-dust-grey hover:bg-ribbit-dry-sage/30 transition-all disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="dialog-title" className="text-lg font-semibold text-ribbit-hunter-green dark:text-ribbit-dust-grey">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Custom Content */}
          {children && (
            <div className="mb-6">
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg font-medium text-sm text-ribbit-pine-teal dark:text-ribbit-dust-grey bg-ribbit-dry-sage/30 dark:bg-ribbit-hunter-green/30 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 hover:bg-ribbit-dry-sage/50 dark:hover:bg-ribbit-hunter-green/50 transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2.5 rounded-lg font-medium text-sm text-white ${config.buttonBg} shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2`}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add animation keyframes to globals.css if not present
// @keyframes scale-in {
//   from {
//     opacity: 0;
//     transform: scale(0.95);
//   }
//   to {
//     opacity: 1;
//     transform: scale(1);
//   }
// }
// .animate-scale-in {
//   animation: scale-in 0.2s ease-out;
// }
