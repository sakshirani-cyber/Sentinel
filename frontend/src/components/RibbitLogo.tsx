import { useEffect, useRef, useState } from 'react';

interface RibbitLogoProps {
  size?: number;
  className?: string;
}

/**
 * RibbitLogo Component
 * 
 * A minimalist, geometric frog logo with eyes that follow the cursor.
 * Uses canvas for smooth animation.
 */
export default function RibbitLogo({ size = 80, className = '' }: RibbitLogoProps) {
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

  // Draw the frog logo
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

      // Earthy Forest Color Palette
      const fern = '#588157';        // Primary body
      const hunterGreen = '#3a5a40'; // Darker accent
      const drySage = '#a3b18a';     // Highlight / light accent
      const pineTeal = '#344e41';    // Pupils, dark elements
      const dustGrey = '#dad7cd';    // Eye whites (warm)
      const white = '#ffffff';       // Highlights

      const centerX = size / 2;
      const centerY = size / 2;
      const frogRadius = size * 0.42;

      // Calculate eye direction based on mouse position
      const rect = canvas.getBoundingClientRect();
      const canvasCenterX = rect.left + rect.width / 2;
      const canvasCenterY = rect.top + rect.height / 2;
      
      const dx = mousePos.x - canvasCenterX;
      const dy = mousePos.y - canvasCenterY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.min(Math.sqrt(dx * dx + dy * dy) / 100, 1);

      // Eye movement offset (limited)
      const maxEyeOffset = size * 0.03;
      const eyeOffsetX = Math.cos(angle) * maxEyeOffset * distance;
      const eyeOffsetY = Math.sin(angle) * maxEyeOffset * distance;

      // Draw main frog body with gradient for depth
      const bodyGradient = ctx.createRadialGradient(
        centerX - frogRadius * 0.3,
        centerY - frogRadius * 0.3,
        0,
        centerX,
        centerY,
        frogRadius
      );
      bodyGradient.addColorStop(0, drySage);
      bodyGradient.addColorStop(0.5, fern);
      bodyGradient.addColorStop(1, hunterGreen);
      
      ctx.beginPath();
      ctx.fillStyle = bodyGradient;
      ctx.arc(centerX, centerY, frogRadius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle shine overlay
      const shineGradient = ctx.createRadialGradient(
        centerX - frogRadius * 0.4,
        centerY - frogRadius * 0.4,
        0,
        centerX - frogRadius * 0.2,
        centerY - frogRadius * 0.2,
        frogRadius * 0.6
      );
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.fillStyle = shineGradient;
      ctx.arc(centerX, centerY, frogRadius, 0, Math.PI * 2);
      ctx.fill();

      // Eye positions - slightly larger, more prominent
      const eyeSpacing = size * 0.16;
      const eyeY = centerY - size * 0.04;
      const eyeRadius = size * 0.13;
      const pupilRadius = size * 0.06;

      // Left eye white with subtle shadow
      ctx.beginPath();
      ctx.fillStyle = dustGrey;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.arc(centerX - eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Right eye white
      ctx.beginPath();
      ctx.fillStyle = dustGrey;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.arc(centerX + eyeSpacing, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Left pupil (follows cursor)
      ctx.beginPath();
      ctx.fillStyle = pineTeal;
      ctx.arc(
        centerX - eyeSpacing + eyeOffsetX,
        eyeY + eyeOffsetY,
        pupilRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Right pupil (follows cursor)
      ctx.beginPath();
      ctx.fillStyle = pineTeal;
      ctx.arc(
        centerX + eyeSpacing + eyeOffsetX,
        eyeY + eyeOffsetY,
        pupilRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Eye highlights - larger and more prominent
      const highlightRadius = size * 0.022;
      ctx.beginPath();
      ctx.fillStyle = white;
      ctx.arc(
        centerX - eyeSpacing + eyeOffsetX - pupilRadius * 0.35,
        eyeY + eyeOffsetY - pupilRadius * 0.35,
        highlightRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = white;
      ctx.arc(
        centerX + eyeSpacing + eyeOffsetX - pupilRadius * 0.35,
        eyeY + eyeOffsetY - pupilRadius * 0.35,
        highlightRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Small secondary highlights
      const smallHighlightRadius = size * 0.01;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.arc(
        centerX - eyeSpacing + eyeOffsetX + pupilRadius * 0.3,
        eyeY + eyeOffsetY + pupilRadius * 0.2,
        smallHighlightRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.arc(
        centerX + eyeSpacing + eyeOffsetX + pupilRadius * 0.3,
        eyeY + eyeOffsetY + pupilRadius * 0.2,
        smallHighlightRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Smile - clean geometric arc
      ctx.beginPath();
      ctx.strokeStyle = pineTeal;
      ctx.lineWidth = size * 0.022;
      ctx.lineCap = 'round';
      const smileY = centerY + size * 0.14;
      const smileWidth = size * 0.1;
      ctx.arc(centerX, smileY - size * 0.02, smileWidth, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // Nostrils - subtle dots
      const nostrilY = centerY + size * 0.04;
      const nostrilSpacing = size * 0.045;
      const nostrilRadius = size * 0.012;
      
      ctx.beginPath();
      ctx.fillStyle = pineTeal;
      ctx.arc(centerX - nostrilSpacing, nostrilY, nostrilRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = pineTeal;
      ctx.arc(centerX + nostrilSpacing, nostrilY, nostrilRadius, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
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
