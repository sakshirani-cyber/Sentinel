import { ReactNode, useEffect, useState } from 'react';
import { cn } from '../ui/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  /** Animation type */
  animation?: 'fade-up' | 'fade' | 'slide-up' | 'scale';
  /** Duration in ms */
  duration?: number;
  /** Delay before animation starts in ms */
  delay?: number;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
}

const animationClasses = {
  'fade-up': 'page-enter',
  'fade': 'animate-fade-in',
  'slide-up': 'animate-slide-up-reveal',
  'scale': 'animate-scale-in',
};

/**
 * PageTransition Component
 * 
 * Wrapper component that animates content on page mount.
 * Provides smooth fade and slide transitions for page content.
 * 
 * Usage:
 * ```tsx
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 * ```
 */
export default function PageTransition({
  children,
  className,
  animation = 'fade-up',
  duration = 300,
  delay = 0,
  animateOnMount = true,
}: PageTransitionProps) {
  const [shouldAnimate, setShouldAnimate] = useState(!animateOnMount);

  useEffect(() => {
    if (animateOnMount) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [animateOnMount, delay]);

  return (
    <div
      className={cn(
        shouldAnimate ? animationClasses[animation] : 'opacity-0',
        className
      )}
      style={{
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * AnimatedSection Component
 * 
 * A section that animates when scrolled into view.
 */
export function AnimatedSection({
  children,
  className,
  animation = 'fade-up',
  threshold = 0.1,
}: {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade' | 'slide-up' | 'scale';
  threshold?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold]);

  return (
    <div
      ref={setRef}
      className={cn(
        isVisible ? animationClasses[animation] : 'opacity-0 translate-y-4',
        'transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * FadeInGroup Component
 * 
 * Wraps children in staggered fade-in animations.
 */
export function FadeInGroup({
  children,
  className,
  staggerDelay = 50,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div
      className={cn('stagger-fade-in', className)}
      style={{
        '--stagger-delay-base': `${staggerDelay}ms`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
