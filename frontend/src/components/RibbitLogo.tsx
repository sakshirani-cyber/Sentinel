import { useEffect, useRef, useState } from 'react';

interface RibbitLogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'icon' | 'monochrome';
}

/**
 * RibbitLogo Component
 * 
 * A geometric, modern frog logo with:
 * - Hexagonal/tessellated abstract design
 * - Clean layered depth effect
 * - Gradient using Deep Teal to Charcoal Blue
 * - Subtle reflection/shine effect
 * - Eyes that follow the cursor
 */
export default function RibbitLogo({ 
  size = 80, 
  className = '',
  variant = 'default'
}: RibbitLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  // Track mouse position globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Draw the geometric frog logo
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

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Neon Marsh Color Palette
      const isDark = document.documentElement.classList.contains('dark');
      const mint = isDark ? '#151515' : '#F0FDFA';           // Lightest
      const teal = isDark ? '#00FFC2' : '#0D9488';           // Primary
      const tealDark = isDark ? '#33FFCE' : '#0F766E';       // Primary hover
      const slate = isDark ? '#FAFAFA' : '#0F172A';          // Text
      const charcoal = isDark ? '#0A0A0A' : '#0F172A';       // Darkest

      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = size * 0.42;

      // Calculate eye direction based on mouse position
      const rect = canvas.getBoundingClientRect();
      const canvasCenterX = rect.left + rect.width / 2;
      const canvasCenterY = rect.top + rect.height / 2;
      
      const dx = mousePos.x - canvasCenterX;
      const dy = mousePos.y - canvasCenterY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.min(Math.sqrt(dx * dx + dy * dy) / 100, 1);

      // Eye movement offset (limited)
      const maxEyeOffset = size * 0.025;
      const eyeOffsetX = Math.cos(angle) * maxEyeOffset * distance;
      const eyeOffsetY = Math.sin(angle) * maxEyeOffset * distance;

      // === GEOMETRIC HEXAGONAL BODY ===
      // Create a hexagonal shape with rounded corners
      const hexRadius = baseRadius;
      const hexPoints = 6;
      const cornerRadius = size * 0.08;
      
      // Draw main body with gradient
      const bodyGradient = ctx.createLinearGradient(
        centerX - hexRadius,
        centerY - hexRadius,
        centerX + hexRadius,
        centerY + hexRadius
      );
      bodyGradient.addColorStop(0, teal);
      bodyGradient.addColorStop(0.5, tealDark);
      bodyGradient.addColorStop(1, charcoal);

      // Draw rounded hexagon
      ctx.beginPath();
      for (let i = 0; i < hexPoints; i++) {
        const startAngle = (Math.PI / 6) + (i * Math.PI * 2) / hexPoints;
        const endAngle = (Math.PI / 6) + ((i + 1) * Math.PI * 2) / hexPoints;
        
        const x1 = centerX + hexRadius * Math.cos(startAngle);
        const y1 = centerY + hexRadius * Math.sin(startAngle);
        const x2 = centerX + hexRadius * Math.cos(endAngle);
        const y2 = centerY + hexRadius * Math.sin(endAngle);
        
        if (i === 0) {
          ctx.moveTo(x1, y1);
        }
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fillStyle = bodyGradient;
      ctx.fill();

      // Inner hexagon layer for depth
      const innerRadius = hexRadius * 0.85;
      const innerGradient = ctx.createRadialGradient(
        centerX - innerRadius * 0.3,
        centerY - innerRadius * 0.3,
        0,
        centerX,
        centerY,
        innerRadius
      );
      innerGradient.addColorStop(0, teal);
      innerGradient.addColorStop(0.6, tealDark);
      innerGradient.addColorStop(1, charcoal);

      ctx.beginPath();
      for (let i = 0; i < hexPoints; i++) {
        const startAngle = (Math.PI / 6) + (i * Math.PI * 2) / hexPoints;
        const x = centerX + innerRadius * Math.cos(startAngle);
        const y = centerY + innerRadius * Math.sin(startAngle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = innerGradient;
      ctx.fill();

      // === REFLECTION SHINE EFFECT ===
      const shineGradient = ctx.createLinearGradient(
        centerX - hexRadius,
        centerY - hexRadius,
        centerX + hexRadius * 0.5,
        centerY + hexRadius * 0.5
      );
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      shineGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
      shineGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
      
      ctx.beginPath();
      ctx.ellipse(
        centerX - hexRadius * 0.2,
        centerY - hexRadius * 0.25,
        hexRadius * 0.5,
        hexRadius * 0.35,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = shineGradient;
      ctx.fill();

      // === GEOMETRIC EYES ===
      const eyeSpacing = size * 0.14;
      const eyeY = centerY - size * 0.06;
      const eyeRadius = size * 0.11;
      const pupilRadius = size * 0.055;

      // Eye backgrounds - diamond/rhombus shaped
      const drawDiamondEye = (cx: number, cy: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx + radius * 0.85, cy);
        ctx.lineTo(cx, cy + radius);
        ctx.lineTo(cx - radius * 0.85, cy);
        ctx.closePath();
      };

      // Left eye white with shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      drawDiamondEye(centerX - eyeSpacing, eyeY, eyeRadius);
      ctx.fillStyle = mint;
      ctx.fill();
      ctx.restore();

      // Right eye white
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      drawDiamondEye(centerX + eyeSpacing, eyeY, eyeRadius);
      ctx.fillStyle = mint;
      ctx.fill();
      ctx.restore();

      // Pupils (follow cursor) - circular for contrast
      const pupilGradient = ctx.createRadialGradient(
        centerX - eyeSpacing + eyeOffsetX - pupilRadius * 0.3,
        eyeY + eyeOffsetY - pupilRadius * 0.3,
        0,
        centerX - eyeSpacing + eyeOffsetX,
        eyeY + eyeOffsetY,
        pupilRadius
      );
      pupilGradient.addColorStop(0, charcoal);
      pupilGradient.addColorStop(1, '#1a252b');

      // Left pupil
      ctx.beginPath();
      ctx.arc(
        centerX - eyeSpacing + eyeOffsetX,
        eyeY + eyeOffsetY,
        pupilRadius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = pupilGradient;
      ctx.fill();

      // Right pupil
      const pupilGradient2 = ctx.createRadialGradient(
        centerX + eyeSpacing + eyeOffsetX - pupilRadius * 0.3,
        eyeY + eyeOffsetY - pupilRadius * 0.3,
        0,
        centerX + eyeSpacing + eyeOffsetX,
        eyeY + eyeOffsetY,
        pupilRadius
      );
      pupilGradient2.addColorStop(0, charcoal);
      pupilGradient2.addColorStop(1, '#1a252b');

      ctx.beginPath();
      ctx.arc(
        centerX + eyeSpacing + eyeOffsetX,
        eyeY + eyeOffsetY,
        pupilRadius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = pupilGradient2;
      ctx.fill();

      // Eye highlights - sharp geometric
      const highlightSize = size * 0.018;
      ctx.fillStyle = '#ffffff';
      
      // Left eye highlight
      ctx.beginPath();
      ctx.arc(
        centerX - eyeSpacing + eyeOffsetX - pupilRadius * 0.3,
        eyeY + eyeOffsetY - pupilRadius * 0.3,
        highlightSize,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Right eye highlight
      ctx.beginPath();
      ctx.arc(
        centerX + eyeSpacing + eyeOffsetX - pupilRadius * 0.3,
        eyeY + eyeOffsetY - pupilRadius * 0.3,
        highlightSize,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Secondary smaller highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      const smallHighlight = size * 0.008;
      
      ctx.beginPath();
      ctx.arc(
        centerX - eyeSpacing + eyeOffsetX + pupilRadius * 0.25,
        eyeY + eyeOffsetY + pupilRadius * 0.25,
        smallHighlight,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        centerX + eyeSpacing + eyeOffsetX + pupilRadius * 0.25,
        eyeY + eyeOffsetY + pupilRadius * 0.25,
        smallHighlight,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // === GEOMETRIC SMILE ===
      // Triangular/chevron style smile
      const smileY = centerY + size * 0.12;
      const smileWidth = size * 0.08;
      
      ctx.beginPath();
      ctx.strokeStyle = charcoal;
      ctx.lineWidth = size * 0.02;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw chevron smile
      ctx.moveTo(centerX - smileWidth, smileY);
      ctx.lineTo(centerX, smileY + size * 0.025);
      ctx.lineTo(centerX + smileWidth, smileY);
      ctx.stroke();

      // === NOSTRILS - Small triangles ===
      const nostrilY = centerY + size * 0.02;
      const nostrilSpacing = size * 0.035;
      const nostrilSize = size * 0.012;
      
      ctx.fillStyle = charcoal;
      
      // Left nostril
      ctx.beginPath();
      ctx.moveTo(centerX - nostrilSpacing, nostrilY - nostrilSize);
      ctx.lineTo(centerX - nostrilSpacing + nostrilSize, nostrilY + nostrilSize);
      ctx.lineTo(centerX - nostrilSpacing - nostrilSize, nostrilY + nostrilSize);
      ctx.closePath();
      ctx.fill();

      // Right nostril
      ctx.beginPath();
      ctx.moveTo(centerX + nostrilSpacing, nostrilY - nostrilSize);
      ctx.lineTo(centerX + nostrilSpacing + nostrilSize, nostrilY + nostrilSize);
      ctx.lineTo(centerX + nostrilSpacing - nostrilSize, nostrilY + nostrilSize);
      ctx.closePath();
      ctx.fill();

      // === OUTER GLOW/DEPTH RING ===
      if (variant !== 'monochrome') {
        ctx.beginPath();
        for (let i = 0; i < hexPoints; i++) {
          const angle = (Math.PI / 6) + (i * Math.PI * 2) / hexPoints;
          const x = centerX + (hexRadius + size * 0.02) * Math.cos(angle);
          const y = centerY + (hexRadius + size * 0.02) * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = isDark ? `rgba(0, 255, 194, 0.3)` : `rgba(13, 148, 136, 0.3)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    draw();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, mousePos, variant]);

  return (
    <canvas
      ref={canvasRef}
      className={`transition-transform duration-200 hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        display: 'block',
      }}
      aria-label="Ribbit Logo"
      role="img"
    />
  );
}
