import { useEffect, useRef, useState, useCallback } from 'react';

interface RibbitLogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'icon' | 'monochrome' | 'animated';
  showText?: boolean;
  /** Enable morph-to-text effect on hover (for topbar use) */
  morphToText?: boolean;
}

// Wave layer configuration for different harmonic frequencies
interface WaveLayer {
  baseRadius: number;      // 0-1 normalized
  frequency: number;       // Wave frequency multiplier
  amplitude: number;       // Wave amplitude
  speed: number;           // Rotation speed
  phase: number;           // Initial phase offset
  harmonics: number[];     // Additional harmonic frequencies
}

// Easing function for smooth transitions
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * RibbitLogo Component
 * 
 * An abstract, modern logo visualizing frog croak sound waves.
 * NO literal frog imagery - purely geometric waveforms.
 * 
 * Features:
 * - Multiple concentric waveforms with varying frequencies
 * - Irregular amplitude variations mimicking organic frog croaks
 * - Distance-based cursor interaction (magnetic pull effect)
 * - Click burst and hover glow effects
 * - Continuous idle animation with breathing and rotation
 * - Morph-to-text animation on hover (when morphToText=true)
 */
export default function RibbitLogo({ 
  size = 48, 
  className = '',
  variant = 'default',
  showText = false,
  morphToText = false
}: RibbitLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);
  
  // Morph progress (0 = waves, 1 = text)
  const morphProgressRef = useRef(0);
  
  // Mouse tracking state
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, speed: 0 });
  const distanceRef = useRef(1); // 0 = close, 1 = far
  
  // Click burst effect state
  const burstRef = useRef({ active: false, time: 0, intensity: 0 });
  
  // Random disturbance state for sporadic croaks
  const disturbanceRef = useRef({ time: 0, nextTime: 3, intensity: 0 });
  
  // Color scheme toggle for double-click
  const [altColorScheme, setAltColorScheme] = useState(false);

  // Wave layer configurations - 5 concentric waves
  const waveLayers: WaveLayer[] = [
    { baseRadius: 0.88, frequency: 3, amplitude: 0.035, speed: 0.25, phase: 0, harmonics: [2, 5] },
    { baseRadius: 0.72, frequency: 5, amplitude: 0.04, speed: 0.4, phase: Math.PI / 4, harmonics: [3, 7] },
    { baseRadius: 0.56, frequency: 7, amplitude: 0.05, speed: 0.55, phase: Math.PI / 2, harmonics: [4, 9] },
    { baseRadius: 0.40, frequency: 10, amplitude: 0.055, speed: 0.75, phase: Math.PI * 0.75, harmonics: [5, 11] },
    { baseRadius: 0.24, frequency: 14, amplitude: 0.065, speed: 1.0, phase: Math.PI, harmonics: [6, 15] },
  ];
  
  // Canvas dimensions - wider when morphing to show text
  const canvasWidth = morphToText ? size * 3 : size;
  const canvasHeight = size;

  // Track mouse position globally
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate speed from previous position
    const dx = e.clientX - mouseRef.current.x;
    const dy = e.clientY - mouseRef.current.y;
    const instantSpeed = Math.sqrt(dx * dx + dy * dy);
    
    // Smooth speed calculation
    mouseRef.current.speed = mouseRef.current.speed * 0.8 + instantSpeed * 0.2;
    mouseRef.current.prevX = mouseRef.current.x;
    mouseRef.current.prevY = mouseRef.current.y;
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    
    // Calculate distance from center
    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    // Normalize distance: 0 = close (<100px), 1 = far (>300px)
    if (distance < 100) {
      distanceRef.current = distance / 100; // 0-1 for close range
    } else if (distance < 300) {
      distanceRef.current = 0.5 + (distance - 100) / 400; // 0.5-1 for medium range
    } else {
      distanceRef.current = 1;
    }
  }, []);

  // Handle click for burst effect
  const handleClick = useCallback(() => {
    burstRef.current = { active: true, time: 0, intensity: 1 };
  }, []);

  // Handle double-click for color scheme toggle
  const handleDoubleClick = useCallback(() => {
    setAltColorScheme(prev => !prev);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      const deltaTime = 0.016; // ~60fps
      timeRef.current += deltaTime;
      
      // Update morph progress
      const targetMorph = (morphToText && isHovered) ? 1 : 0;
      const morphSpeed = 0.04; // Transition speed (slower = smoother)
      if (morphProgressRef.current < targetMorph) {
        morphProgressRef.current = Math.min(morphProgressRef.current + morphSpeed, 1);
      } else if (morphProgressRef.current > targetMorph) {
        morphProgressRef.current = Math.max(morphProgressRef.current - morphSpeed, 0);
      }
      const morphProgress = easeInOutCubic(morphProgressRef.current);
      
      // Update burst effect
      if (burstRef.current.active) {
        burstRef.current.time += deltaTime;
        burstRef.current.intensity = Math.max(0, 1 - burstRef.current.time * 2);
        if (burstRef.current.intensity <= 0) {
          burstRef.current.active = false;
        }
      }
      
      // Update random disturbance
      disturbanceRef.current.time += deltaTime;
      if (disturbanceRef.current.time >= disturbanceRef.current.nextTime) {
        disturbanceRef.current.time = 0;
        disturbanceRef.current.nextTime = 3 + Math.random() * 2; // 3-5 seconds
        disturbanceRef.current.intensity = 0.8 + Math.random() * 0.4;
      }
      // Decay disturbance
      disturbanceRef.current.intensity *= 0.95;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Color palette
      const isDark = document.documentElement.classList.contains('dark');
      
      // Primary colors with alt scheme support
      const primary = altColorScheme 
        ? (isDark ? '#FF6B9D' : '#DB2777')  // Pink variant
        : (isDark ? '#00FFC2' : '#0D9488'); // Teal variant
      const secondary = altColorScheme
        ? (isDark ? '#00FFC2' : '#0D9488')
        : (isDark ? '#FF5C8D' : '#EC4899');
      const tertiary = altColorScheme
        ? (isDark ? '#FFD93D' : '#F59E0B')
        : (isDark ? '#00B4D8' : '#0284C7');

      // Logo center (stays at left side when morphing)
      const logoCenterX = size / 2;
      const logoCenterY = size / 2;
      const maxRadius = size * 0.45;

      // Calculate cursor effects
      const rect = canvas.getBoundingClientRect();
      const canvasCenterX = rect.left + logoCenterX;
      const canvasCenterY = rect.top + logoCenterY;
      
      const dx = mouseRef.current.x - canvasCenterX;
      const dy = mouseRef.current.y - canvasCenterY;
      const cursorAngle = Math.atan2(dy, dx);
      const normalizedDist = distanceRef.current;
      const mouseSpeed = mouseRef.current.speed;

      // Breathing animation (0.8-1.2 scale, 2-3 second cycle)
      const breathCycle = 2.5; // seconds
      const breathe = 1 + Math.sin(timeRef.current * (Math.PI * 2 / breathCycle)) * 0.1 * (1 - morphProgress);
      
      // Global rotation (2-5 degrees per second) - reduces during morph
      const globalRotation = timeRef.current * 0.05 * (1 - morphProgress);

      // Proximity-based effects - reduce during morph
      const proximityPull = (1 - normalizedDist) * maxRadius * 0.15 * (1 - morphProgress);
      const proximityBrightness = 1 - normalizedDist * 0.3;
      const proximityFrequency = 1 + (1 - normalizedDist) * 0.5 * (1 - morphProgress);
      
      // Speed-based ripple effect
      const rippleIntensity = Math.min(mouseSpeed / 50, 1) * (1 - morphProgress);
      
      // Burst effect scaling
      const burstScale = 1 + burstRef.current.intensity * 0.3 * (1 - morphProgress);
      const burstOffset = burstRef.current.intensity * maxRadius * 0.2 * (1 - morphProgress);

      // Wave opacity decreases as morph increases
      const waveOpacity = 1 - morphProgress;
      
      // Draw each wave layer (fades out during morph)
      if (waveOpacity > 0.01) {
        waveLayers.forEach((layer, layerIndex) => {
          const layerRatio = layerIndex / (waveLayers.length - 1);
          
          // Radius shrinks toward center during morph
          let radius = maxRadius * layer.baseRadius * breathe * burstScale * (1 - morphProgress * 0.7);
          radius += burstOffset * (1 - layerRatio);
          radius += (1 - normalizedDist) * size * 0.02 * (1 + layerRatio) * (1 - morphProgress);
          
          // Calculate center offset (magnetic pull toward cursor)
          const pullStrength = proximityPull * (0.5 + layerRatio * 0.5);
          const offsetX = Math.cos(cursorAngle) * pullStrength;
          const offsetY = Math.sin(cursorAngle) * pullStrength;
          
          // Wave center - moves toward text position during morph
          const textCenterX = canvasWidth / 2;
          const waveCenterX = logoCenterX + offsetX + (textCenterX - logoCenterX) * morphProgress * 0.5;
          const waveCenterY = logoCenterY + offsetY;
          
          // Color based on layer
          const colors = [primary, secondary, tertiary, primary, secondary];
          const baseColor = colors[layerIndex % colors.length];
          
          // Alpha calculation
          const baseAlpha = isHovered ? 0.95 : 0.7;
          const layerAlpha = baseAlpha * (0.4 + layerRatio * 0.6) * proximityBrightness * waveOpacity;
          
          // Line thickness
          const lineWidth = size * (0.015 + (1 - layerRatio) * 0.015);
          
          // Number of points for wave
          const wavePoints = 120;
          
          ctx.beginPath();
          
          for (let i = 0; i <= wavePoints; i++) {
            const angle = (i / wavePoints) * Math.PI * 2 + globalRotation;
            
            // Primary wave
            let waveOffset = Math.sin(angle * layer.frequency + timeRef.current * layer.speed + layer.phase) 
                            * layer.amplitude * maxRadius;
            
            // Add harmonics
            layer.harmonics.forEach((harmonic, hIdx) => {
              const harmonicAmplitude = layer.amplitude * maxRadius * (0.3 / (hIdx + 1));
              waveOffset += Math.sin(angle * harmonic + timeRef.current * layer.speed * 1.3 + layer.phase) 
                           * harmonicAmplitude;
            });
            
            // Croaking rhythm modulation
            const croakModulation = 1 + 0.15 * Math.sin(timeRef.current * Math.PI * 2 * 0.5 + layerRatio * Math.PI);
            waveOffset *= croakModulation * proximityFrequency;
            
            // Random disturbance effect
            if (disturbanceRef.current.intensity > 0.01) {
              const disturbanceWave = Math.sin(angle * 13 + timeRef.current * 8) * 
                                     disturbanceRef.current.intensity * maxRadius * 0.08;
              waveOffset += disturbanceWave;
            }
            
            // Cursor-based wave bending
            const cursorInfluence = (1 - normalizedDist) * 
                                   Math.cos(angle - cursorAngle) * 
                                   maxRadius * 0.08 * (1 + layerRatio);
            
            // Speed-based ripple
            const rippleWave = rippleIntensity * Math.sin(angle * 8 - timeRef.current * 12) * 
                              maxRadius * 0.03 * (1 - layerRatio);
            
            // Final radius at this angle
            const pointRadius = radius + waveOffset + cursorInfluence + rippleWave;
            
            const x = waveCenterX + Math.cos(angle) * pointRadius;
            const y = waveCenterY + Math.sin(angle) * pointRadius;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          ctx.closePath();
          
          // Apply glow effect
          if ((normalizedDist < 0.5 || isHovered) && isDark) {
            ctx.save();
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 8 + (1 - normalizedDist) * 12;
            ctx.strokeStyle = `${baseColor}${Math.round(layerAlpha * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            ctx.restore();
          } else {
            ctx.strokeStyle = `${baseColor}${Math.round(layerAlpha * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
          }
        });
        
        // Central core - fades out during morph
        const coreOpacity = waveOpacity;
        const coreRadius = size * 0.03 * breathe * (1 + burstRef.current.intensity * 0.5);
        
        ctx.beginPath();
        ctx.arc(
          logoCenterX + Math.cos(cursorAngle) * proximityPull * 0.3,
          logoCenterY + Math.sin(cursorAngle) * proximityPull * 0.3,
          coreRadius,
          0,
          Math.PI * 2
        );
        
        const coreGradient = ctx.createRadialGradient(
          logoCenterX, logoCenterY, 0,
          logoCenterX, logoCenterY, coreRadius
        );
        coreGradient.addColorStop(0, `${primary}${Math.round(255 * coreOpacity).toString(16).padStart(2, '0')}`);
        coreGradient.addColorStop(0.7, `${primary}${Math.round(136 * coreOpacity).toString(16).padStart(2, '0')}`);
        coreGradient.addColorStop(1, `${primary}00`);
        
        ctx.fillStyle = coreGradient;
        ctx.fill();
        
        // Outer aura in dark mode
        if (isDark && (isHovered || normalizedDist < 0.3)) {
          const auraIntensity = (isHovered ? 0.15 : (0.3 - normalizedDist) * 0.3) * waveOpacity;
          const auraGradient = ctx.createRadialGradient(
            logoCenterX, logoCenterY, maxRadius * 0.8,
            logoCenterX, logoCenterY, maxRadius * 1.1
          );
          auraGradient.addColorStop(0, `${primary}00`);
          auraGradient.addColorStop(0.5, `${primary}${Math.round(auraIntensity * 255).toString(16).padStart(2, '0')}`);
          auraGradient.addColorStop(1, `${primary}00`);
          
          ctx.beginPath();
          ctx.arc(logoCenterX, logoCenterY, maxRadius * 1.1, 0, Math.PI * 2);
          ctx.fillStyle = auraGradient;
          ctx.fill();
        }
      }
      
      // Draw clean text "Ribbit" (fades in during morph)
      if (morphProgress > 0.01) {
        const textOpacity = morphProgress;
        const fontSize = size * 0.55;
        const textX = size * 0.1;
        const textY = logoCenterY + fontSize * 0.35;
        
        // Text color: white in dark mode, black in light mode
        const textColor = isDark ? '#FAFAFA' : '#0F172A';
        
        // Set up text rendering
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        
        ctx.save();
        ctx.fillStyle = textColor;
        ctx.globalAlpha = textOpacity;
        ctx.fillText('Ribbit', textX, textY);
        ctx.restore();
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, canvasWidth, canvasHeight, variant, isHovered, altColorScheme, morphToText, waveLayers]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <canvas
        ref={canvasRef}
        className="transition-all duration-300 ease-out cursor-pointer"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          display: 'block',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        aria-label="Ribbit Logo - Interactive Sound Wave"
        role="img"
      />
      {showText && !morphToText && (
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
 * Abstract sound wave design - no literal frog imagery
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
      aria-label="Ribbit Logo - Sound Wave"
      role="img"
    >
      {/* Outer wave ring - lowest frequency */}
      <path
        d="M24 4C34.5 4 44 12 44 24C44 34.5 35 44 24 44C12 44 4 35.5 4 24C4 13 13.5 4 24 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.35"
        fill="none"
        strokeLinecap="round"
        className="text-primary"
      />
      
      {/* Second wave ring */}
      <path
        d="M24 8.5C31 7.5 38.5 14 39.5 24C40 32 34 39.5 24 39.5C14.5 40 8 33 8.5 24C8.5 15 15 8 24 8.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeOpacity="0.45"
        fill="none"
        strokeLinecap="round"
        className="text-primary"
      />
      
      {/* Third wave ring - medium frequency */}
      <path
        d="M24 12C30 11.5 35 16 35.5 24C36 30.5 31.5 35.5 24 36C17 36 12.5 31 12 24C12 17.5 17 12 24 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.55"
        fill="none"
        strokeLinecap="round"
        className="text-accent"
      />
      
      {/* Fourth wave ring */}
      <path
        d="M24 16C28.5 15.5 32 18.5 32 24C32.5 28.5 29 32 24 32C19.5 32.5 16 29.5 16 24C15.5 19 19 16 24 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.7"
        fill="none"
        strokeLinecap="round"
        className="text-primary"
      />
      
      {/* Inner wave ring - highest frequency */}
      <path
        d="M24 20C26.5 19.5 28.5 21 28.5 24C29 26 27 28.5 24 28C21.5 28.5 19.5 27 19.5 24C19 22 21 19.5 24 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeOpacity="0.85"
        fill="none"
        strokeLinecap="round"
        className="text-accent"
      />
      
      {/* Central core dot */}
      <circle 
        cx="24" 
        cy="24" 
        r="2" 
        fill="currentColor" 
        fillOpacity="0.9"
        className="text-primary" 
      />
    </svg>
  );
}
