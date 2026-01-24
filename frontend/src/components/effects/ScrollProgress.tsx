import { useEffect, useState, useCallback } from 'react';
import { cn } from '../ui/utils';

interface ScrollProgressProps {
  /** CSS class for styling */
  className?: string;
  /** Target element to track scroll (defaults to window) */
  targetRef?: React.RefObject<HTMLElement>;
  /** Height of the progress bar in pixels */
  height?: number;
  /** Whether to show the progress bar */
  show?: boolean;
  /** Minimum scroll percentage before showing */
  showAfter?: number;
}

/**
 * ScrollProgress Component
 * 
 * A thin progress bar fixed at the top of the viewport
 * that shows the user's scroll position through the page.
 * 
 * Features:
 * - Smooth progress updates
 * - Primary-to-accent gradient
 * - Configurable height and visibility
 * - Optional target element tracking
 */
export default function ScrollProgress({
  className,
  targetRef,
  height = 3,
  show = true,
  showAfter = 0,
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const updateProgress = useCallback(() => {
    let scrollTop: number;
    let scrollHeight: number;
    let clientHeight: number;

    if (targetRef?.current) {
      const element = targetRef.current;
      scrollTop = element.scrollTop;
      scrollHeight = element.scrollHeight;
      clientHeight = element.clientHeight;
    } else {
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    }

    const maxScroll = scrollHeight - clientHeight;
    const currentProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    
    setProgress(currentProgress);
    setIsVisible(currentProgress > showAfter);
  }, [targetRef, showAfter]);

  useEffect(() => {
    const target = targetRef?.current || window;
    
    // Initial calculation
    updateProgress();

    target.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });

    return () => {
      target.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [targetRef, updateProgress]);

  if (!show || !isVisible) return null;

  return (
    <div
      className={cn(
        "scroll-progress",
        className
      )}
      style={{
        height: `${height}px`,
        transform: `scaleX(${progress / 100})`,
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    />
  );
}

/**
 * ScrollToTop Component
 * 
 * A button that appears after scrolling and scrolls to top on click.
 */
export function ScrollToTop({
  className,
  showAfter = 300,
}: {
  className?: string;
  showAfter?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-10 h-10 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:-translate-y-1 active:scale-95",
        "animate-fade-in",
        className
      )}
      aria-label="Scroll to top"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
