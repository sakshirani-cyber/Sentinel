import { useEffect, useRef, useCallback } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  startTime: number;
}

/**
 * ClickRipple Component
 * 
 * A global canvas-based click ripple effect that creates expanding
 * circular waves on every click throughout the app.
 * 
 * Features:
 * - Fixed position canvas covering entire viewport
 * - Theme-aware colors (teal for light, cyan for dark mode)
 * - Multiple concurrent ripples supported
 * - Smooth easing animation
 * - Performance optimized with cleanup
 */
export default function ClickRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  const isAnimatingRef = useRef(false);

  // Animation configuration
  const config = {
    maxRadius: 180,
    duration: 650, // ms
    strokeWidth: 2.5,
    lightColor: { r: 13, g: 148, b: 136 }, // Teal #0D9488
    darkColor: { r: 0, g: 255, b: 194 },   // Cyan #00FFC2
    startOpacity: 0.35,
  };

  // Easing function for smooth animation
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  // Get current theme color
  const getThemeColor = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');
    return isDark ? config.darkColor : config.lightColor;
  }, []);

  // Resize canvas to match viewport
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const color = getThemeColor();

    // Clear canvas
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Filter out completed ripples and draw active ones
    ripplesRef.current = ripplesRef.current.filter((ripple) => {
      const elapsed = now - ripple.startTime;
      const progress = Math.min(elapsed / config.duration, 1);

      if (progress >= 1) {
        return false; // Remove completed ripple
      }

      // Calculate current values with easing
      const easedProgress = easeOutCubic(progress);
      const currentRadius = easedProgress * config.maxRadius;
      const currentOpacity = config.startOpacity * (1 - progress);
      const currentStroke = config.strokeWidth * (1 - progress * 0.6);

      // Draw ripple circle
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${currentOpacity})`;
      ctx.lineWidth = currentStroke;
      ctx.stroke();

      // Draw secondary inner ripple for depth
      if (progress < 0.7) {
        const innerProgress = easeOutCubic(Math.min(progress * 1.5, 1));
        const innerRadius = innerProgress * config.maxRadius * 0.6;
        const innerOpacity = config.startOpacity * 0.5 * (1 - progress / 0.7);

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, innerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${innerOpacity})`;
        ctx.lineWidth = currentStroke * 0.6;
        ctx.stroke();
      }

      return true; // Keep ripple
    });

    // Continue or stop animation
    if (ripplesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      isAnimatingRef.current = false;
    }
  }, [getThemeColor]);

  // Start animation if not already running
  const startAnimation = useCallback(() => {
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Handle click to create ripple
  const handleClick = useCallback((e: MouseEvent) => {
    // Don't create ripple for right clicks or if target is input/button with its own effects
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    
    // Skip ripple for certain interactive elements that have their own feedback
    if (target.closest('button[data-no-ripple], input, textarea, select, [data-no-ripple]')) {
      return;
    }

    const ripple: Ripple = {
      x: e.clientX,
      y: e.clientY,
      radius: 0,
      opacity: config.startOpacity,
      startTime: performance.now(),
    };

    ripplesRef.current.push(ripple);
    startAnimation();
  }, [startAnimation]);

  // Setup event listeners and canvas
  useEffect(() => {
    resizeCanvas();

    // Listen for clicks on the document
    document.addEventListener('click', handleClick);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('resize', resizeCanvas);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleClick, resizeCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        mixBlendMode: 'normal',
      }}
      aria-hidden="true"
    />
  );
}
