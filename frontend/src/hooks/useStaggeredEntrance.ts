import { useRef, useEffect, useState, useCallback } from 'react';

interface UseStaggeredEntranceOptions {
  /** Delay between each item animation in ms */
  staggerDelay?: number;
  /** Initial delay before animations start in ms */
  initialDelay?: number;
  /** Whether to trigger on scroll into view */
  triggerOnScroll?: boolean;
  /** Intersection threshold (0-1) */
  threshold?: number;
  /** Whether animations have run (for re-triggering) */
  enabled?: boolean;
}

interface StaggeredEntranceResult {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether the animation has been triggered */
  hasAnimated: boolean;
  /** CSS class to apply to container */
  containerClassName: string;
  /** Function to manually trigger animation */
  triggerAnimation: () => void;
  /** Function to reset animation state */
  resetAnimation: () => void;
}

/**
 * useStaggeredEntrance Hook
 * 
 * Provides staggered fade-in animations for child elements.
 * Can be triggered on mount or when scrolled into view.
 * 
 * Usage:
 * ```tsx
 * const { containerRef, containerClassName } = useStaggeredEntrance();
 * 
 * return (
 *   <div ref={containerRef} className={containerClassName}>
 *     <div>Item 1</div>
 *     <div>Item 2</div>
 *     <div>Item 3</div>
 *   </div>
 * );
 * ```
 */
export function useStaggeredEntrance({
  staggerDelay = 50,
  initialDelay = 0,
  triggerOnScroll = true,
  threshold = 0.1,
  enabled = true,
}: UseStaggeredEntranceOptions = {}): StaggeredEntranceResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const triggerAnimation = useCallback(() => {
    if (!hasAnimated && enabled) {
      setHasAnimated(true);
    }
  }, [hasAnimated, enabled]);

  const resetAnimation = useCallback(() => {
    setHasAnimated(false);
  }, []);

  // Apply stagger delays via CSS custom properties
  useEffect(() => {
    if (!hasAnimated || !containerRef.current) return;

    const container = containerRef.current;
    const children = container.children;

    Array.from(children).forEach((child, index) => {
      const element = child as HTMLElement;
      const delay = initialDelay + index * staggerDelay;
      element.style.setProperty('--stagger-delay', `${delay}ms`);
      element.style.animationDelay = `${delay}ms`;
    });
  }, [hasAnimated, staggerDelay, initialDelay]);

  // Intersection Observer for scroll trigger
  useEffect(() => {
    if (!triggerOnScroll || !enabled || hasAnimated) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerAnimation();
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [triggerOnScroll, enabled, hasAnimated, threshold, triggerAnimation]);

  // Trigger immediately if not using scroll trigger
  useEffect(() => {
    if (!triggerOnScroll && enabled && !hasAnimated) {
      const timer = setTimeout(triggerAnimation, initialDelay);
      return () => clearTimeout(timer);
    }
  }, [triggerOnScroll, enabled, hasAnimated, initialDelay, triggerAnimation]);

  const containerClassName = hasAnimated ? 'stagger-fade-in' : '';

  return {
    containerRef,
    hasAnimated,
    containerClassName,
    triggerAnimation,
    resetAnimation,
  };
}

/**
 * useAnimateOnMount Hook
 * 
 * Simple hook to trigger a CSS animation class on mount.
 */
export function useAnimateOnMount(animationClass: string, delay = 0) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return shouldAnimate ? animationClass : '';
}

/**
 * useScrollAnimation Hook
 * 
 * Triggers animation when element scrolls into view.
 */
export function useScrollAnimation<T extends HTMLElement>(
  animationClass: string,
  options: { threshold?: number; triggerOnce?: boolean } = {}
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { threshold = 0.1, triggerOnce = true } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (triggerOnce) {
              observer.disconnect();
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return {
    ref,
    className: isVisible ? animationClass : '',
    isVisible,
  };
}

export default useStaggeredEntrance;
