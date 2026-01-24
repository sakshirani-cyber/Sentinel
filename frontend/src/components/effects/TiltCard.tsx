import { useRef, useState, useCallback, ReactNode } from 'react';
import { cn } from '../ui/utils';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Tilt intensity: subtle (default), medium, or strong */
  intensity?: 'subtle' | 'medium' | 'strong';
  /** Whether to show the shine effect on hover */
  showShine?: boolean;
  /** Whether the tilt effect is enabled */
  disabled?: boolean;
}

const intensityConfig = {
  subtle: { maxTilt: 5, perspective: 1000 },
  medium: { maxTilt: 10, perspective: 800 },
  strong: { maxTilt: 15, perspective: 600 },
};

/**
 * TiltCard Component
 * 
 * A wrapper that adds 3D perspective tilt effect on hover.
 * The card tilts towards the cursor position, creating a
 * subtle parallax-like effect.
 * 
 * Features:
 * - Cursor-following tilt animation
 * - Optional shine reflection effect
 * - Configurable intensity
 * - Smooth spring animation on enter/leave
 */
export default function TiltCard({
  children,
  className,
  intensity = 'subtle',
  showShine = true,
  disabled = false,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const config = intensityConfig[intensity];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate normalized position (0 to 1)
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    // Calculate tilt angles (centered at 0.5)
    const tiltX = (normalizedY - 0.5) * config.maxTilt * 2;
    const tiltY = (0.5 - normalizedX) * config.maxTilt * 2;

    setTransform(`perspective(${config.perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`);
    setMousePosition({ x: normalizedX * 100, y: normalizedY * 100 });
  }, [config.maxTilt, config.perspective, disabled]);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTransform('');
    setMousePosition({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative transition-transform duration-200 ease-out tilt-card",
        className
      )}
      style={{
        transform: isHovered ? transform : '',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Shine effect overlay */}
      {showShine && (
        <div
          className="tilt-shine"
          style={{
            '--mouse-x': `${mousePosition.x}%`,
            '--mouse-y': `${mousePosition.y}%`,
            opacity: isHovered ? 1 : 0,
          } as React.CSSProperties}
        />
      )}
    </div>
  );
}
