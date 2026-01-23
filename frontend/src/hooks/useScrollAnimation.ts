import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * useScrollAnimation Hook
 * 
 * Triggers animation when element enters viewport.
 * Returns a ref to attach to the element and an isVisible state.
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { ref, isVisible } = useScrollAnimation();
 *   return (
 *     <div ref={ref} className={`scroll-animate ${isVisible ? 'visible' : ''}`}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
}: UseScrollAnimationOptions = {}) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

/**
 * useStaggerAnimation Hook
 * 
 * For parent containers with staggered child animations.
 */
export function useStaggerAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  return useScrollAnimation<T>({ ...options, rootMargin: '0px 0px -100px 0px' });
}

export default useScrollAnimation;
