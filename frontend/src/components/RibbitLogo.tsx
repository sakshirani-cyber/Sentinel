import { useEffect, useRef, useState, useCallback } from 'react';

interface RibbitLogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'icon' | 'monochrome' | 'animated';
  showText?: boolean;
}

/**
 * RibbitLogo Component
 * 
 * A minimalistic, geometric, modern logo inspired by:
 * - Sound waves from a frog's "ribbit" croak
 * - Water ripples emanating from a frog
 * - Neon Marsh color palette
 * 
 * Features:
 * - Concentric sound wave circles (the "ribbit")
 * - Central geometric frog silhouette with cursor-following eyes
 * - Sound waves react to cursor position
 * - Interactive hover animations
 * - Continuous pulse effect representing the croak
 */
export default function RibbitLogo({ 
  size = 48, 
  className = '',
  variant = 'default',
  showText = false
}: RibbitLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseDistance, setMouseDistance] = useState(1);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Track mouse position globally for eye following
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Store actual mouse position for eye tracking
    setMousePos({ x: e.clientX, y: e.clientY });
    
    // Calculate distance for proximity effects
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 300;
    
    setMouseDistance(Math.min(distance / maxDistance, 1));
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 0.025;
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Neon Marsh Color Palette
      const isDark = document.documentElement.classList.contains('dark');
      const primary = isDark ? '#00FFC2' : '#0D9488';
      const primaryHover = isDark ? '#33FFCE' : '#0F766E';
      const accent = isDark ? '#FF5C8D' : '#EC4899';
      const text = isDark ? '#FAFAFA' : '#0F172A';

      const centerX = size / 2;
      const centerY = size / 2;
      const maxRadius = size * 0.44;

      // Calculate cursor direction for effects
      const rect = canvas.getBoundingClientRect();
      const canvasCenterX = rect.left + rect.width / 2;
      const canvasCenterY = rect.top + rect.height / 2;
      
      const dx = mousePos.x - canvasCenterX;
      const dy = mousePos.y - canvasCenterY;
      const cursorAngle = Math.atan2(dy, dx);
      const cursorDistance = Math.min(Math.sqrt(dx * dx + dy * dy) / 150, 1);

      // Number of sound wave rings
      const ringCount = 3;
      const baseAlpha = isHovered ? 0.95 : 0.75;
      
      // Draw sound wave rings - they shift slightly toward cursor
      for (let i = ringCount - 1; i >= 0; i--) {
        const ringProgress = i / ringCount;
        
        // Animated radius - rings pulse outward like sound waves
        const wavePhase = timeRef.current * 2.5 + i * 1.2;
        const pulseOffset = Math.sin(wavePhase) * (size * 0.025);
        const hoverExpand = isHovered ? size * 0.04 : 0;
        const proximityEffect = (1 - mouseDistance) * size * 0.02;
        
        const radius = maxRadius * (0.35 + ringProgress * 0.65) + pulseOffset + hoverExpand + proximityEffect;
        
        // Ring offset toward cursor (subtle attraction effect)
        const attractionStrength = (1 - mouseDistance) * size * 0.03 * (1 - ringProgress * 0.5);
        const ringOffsetX = Math.cos(cursorAngle) * attractionStrength;
        const ringOffsetY = Math.sin(cursorAngle) * attractionStrength;
        
        // Ring thickness
        const thickness = size * (0.018 + (1 - ringProgress) * 0.012);
        
        // Alpha with wave effect
        const waveAlpha = baseAlpha * (0.35 + (1 - ringProgress) * 0.65);
        const pulseAlpha = 0.5 + Math.sin(wavePhase) * 0.5;
        const alpha = waveAlpha * (0.7 + pulseAlpha * 0.3);
        
        // Color
        const ringColor = i === 0 ? accent : primary;
        const ringColorHover = i === 0 ? accent : primaryHover;
        const currentColor = isHovered ? ringColorHover : ringColor;
        
        // Draw ring with offset
        ctx.beginPath();
        ctx.arc(centerX + ringOffsetX, centerY + ringOffsetY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${currentColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Central geometric frog shape
      const frogSize = size * 0.22;
      const frogY = centerY;
      
      // Subtle breathing animation
      const breathe = 1 + Math.sin(timeRef.current * 2) * 0.06;
      const actualSize = frogSize * breathe * (isHovered ? 1.08 : 1);
      
      // Frog also moves slightly toward cursor
      const frogAttraction = (1 - mouseDistance) * size * 0.015;
      const frogOffsetX = Math.cos(cursorAngle) * frogAttraction;
      const frogOffsetY = Math.sin(cursorAngle) * frogAttraction;
      const frogCenterX = centerX + frogOffsetX;
      const frogCenterY = frogY + frogOffsetY;
      
      // Draw abstract frog head shape
      ctx.beginPath();
      
      const topY = frogCenterY - actualSize * 0.6;
      const bottomY = frogCenterY + actualSize * 0.5;
      const width = actualSize * 0.8;
      
      ctx.moveTo(frogCenterX, topY);
      
      ctx.bezierCurveTo(
        frogCenterX + width * 0.9, topY + actualSize * 0.3,
        frogCenterX + width * 0.7, bottomY - actualSize * 0.1,
        frogCenterX, bottomY
      );
      
      ctx.bezierCurveTo(
        frogCenterX - width * 0.7, bottomY - actualSize * 0.1,
        frogCenterX - width * 0.9, topY + actualSize * 0.3,
        frogCenterX, topY
      );
      
      ctx.closePath();
      
      // Gradient fill
      const frogGradient = ctx.createLinearGradient(
        frogCenterX - actualSize,
        topY,
        frogCenterX + actualSize,
        bottomY
      );
      frogGradient.addColorStop(0, primary);
      frogGradient.addColorStop(0.6, primaryHover);
      frogGradient.addColorStop(1, isDark ? '#00CC9A' : '#0F766E');
      
      ctx.fillStyle = frogGradient;
      ctx.fill();
      
      // === CURSOR-FOLLOWING EYES ===
      const eyeY = frogCenterY - actualSize * 0.15;
      const eyeSpacing = actualSize * 0.28;
      const eyeRadius = actualSize * 0.13;
      const pupilRadius = eyeRadius * 0.55;
      
      // Calculate eye movement based on cursor position
      const maxEyeOffset = eyeRadius * 0.35;
      const eyeOffsetX = Math.cos(cursorAngle) * maxEyeOffset * cursorDistance;
      const eyeOffsetY = Math.sin(cursorAngle) * maxEyeOffset * cursorDistance;
      
      // Eye whites
      ctx.fillStyle = isDark ? '#151515' : '#FFFFFF';
      
      // Left eye
      ctx.beginPath();
      ctx.arc(frogCenterX - eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye
      ctx.beginPath();
      ctx.arc(frogCenterX + eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils - follow cursor
      ctx.fillStyle = text;
      
      // Left pupil
      ctx.beginPath();
      ctx.arc(
        frogCenterX - eyeSpacing + eyeOffsetX,
        eyeY + eyeOffsetY,
        pupilRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Right pupil
      ctx.beginPath();
      ctx.arc(
        frogCenterX + eyeSpacing + eyeOffsetX,
        eyeY + eyeOffsetY,
        pupilRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Eye highlights - also shift with pupil
      const highlightRadius = pupilRadius * 0.35;
      ctx.fillStyle = '#FFFFFF';
      
      ctx.beginPath();
      ctx.arc(
        frogCenterX - eyeSpacing + eyeOffsetX - pupilRadius * 0.3,
        eyeY + eyeOffsetY - pupilRadius * 0.3,
        highlightRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(
        frogCenterX + eyeSpacing + eyeOffsetX - pupilRadius * 0.3,
        eyeY + eyeOffsetY - pupilRadius * 0.3,
        highlightRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Outer glow effect in dark mode
      if (variant !== 'monochrome' && isDark && isHovered) {
        ctx.save();
        ctx.shadowColor = primary;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 194, 0.05)';
        ctx.fill();
        
        ctx.restore();
      }

      // Continue animation
      if (variant === 'animated' || isHovered) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, variant, isHovered, mouseDistance, mousePos]);

  // Restart animation on hover change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isHovered || variant === 'animated') {
      if (!animationRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
    }
  }, [isHovered, variant, size]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <canvas
        ref={canvasRef}
        className="transition-transform duration-300 ease-out hover:scale-110 cursor-pointer"
        style={{
          width: size,
          height: size,
          display: 'block',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Ribbit Logo"
        role="img"
      />
      {showText && (
        <span className="font-bold text-xl tracking-tight text-foreground">
          Ribbit
        </span>
      )}
    </div>
  );
}

/**
 * RibbitLogoStatic - SVG version for simpler use cases
 * Pure SVG implementation without animations
 */
export function RibbitLogoStatic({ 
  size = 48, 
  className = '' 
}: { 
  size?: number; 
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 hover:scale-105 ${className}`}
      aria-label="Ribbit Logo"
      role="img"
    >
      {/* Outer sound wave */}
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        fill="none"
        className="text-primary"
      />
      
      {/* Middle sound wave */}
      <circle
        cx="24"
        cy="24"
        r="14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        fill="none"
        className="text-primary"
      />
      
      {/* Inner sound wave (accent) */}
      <circle
        cx="24"
        cy="24"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.7"
        fill="none"
        className="text-accent"
      />
      
      {/* Frog head silhouette */}
      <path
        d="M24 17C24 17 29 20 29 24C29 27 27 29 24 29C21 29 19 27 19 24C19 20 24 17 24 17Z"
        fill="currentColor"
        className="text-primary"
      />
      
      {/* Left eye */}
      <circle cx="22" cy="23" r="1.5" fill="currentColor" className="text-background" />
      <circle cx="22" cy="23" r="0.8" fill="currentColor" className="text-foreground" />
      
      {/* Right eye */}
      <circle cx="26" cy="23" r="1.5" fill="currentColor" className="text-background" />
      <circle cx="26" cy="23" r="0.8" fill="currentColor" className="text-foreground" />
    </svg>
  );
}
