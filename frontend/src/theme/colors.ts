/**
 * Neon Marsh Color Palette
 * 
 * This is the SINGLE SOURCE OF TRUTH for all color values in the application.
 * All hex codes should be defined here and nowhere else.
 * 
 * To change the app's color scheme, modify only this file.
 */

export const palette = {
  // ============================================
  // LIGHT MODE PRIMARIES
  // ============================================
  white: '#FFFFFF',
  mint: '#F0FDFA',              // Secondary background - soft mint tint
  teal: '#0D9488',              // Primary - vibrant teal
  tealDark: '#0F766E',          // Primary hover - deeper teal
  tealDeeper: '#115E59',        // Primary active
  pink: '#EC4899',              // Accent - vibrant pink
  pinkDark: '#DB2777',          // Accent hover
  slate: '#0F172A',             // Primary text - deep slate
  slateMuted: '#475569',        // Secondary text
  slateLight: '#64748B',        // Muted text
  border: '#E2E8F0',            // Light mode borders

  // ============================================
  // DARK MODE PRIMARIES
  // ============================================
  black: '#0A0A0A',             // Dark mode background
  darkSurface: '#151515',       // Dark mode cards/surfaces
  darkSurfaceHover: '#1F1F1F',  // Dark surface hover
  darkBorder: '#262626',        // Dark mode borders
  cyan: '#00FFC2',              // Neon cyan for dark mode primary
  cyanBright: '#33FFCE',        // Hover glow
  cyanActive: '#66FFD9',        // Active state
  coral: '#FF5C8D',             // Dark mode accent
  coralBright: '#FF7AA5',       // Accent hover
  lightText: '#FAFAFA',         // Dark mode primary text
  mutedText: '#A3A3A3',         // Dark mode secondary text
  darkMutedText: '#737373',     // Dark mode muted text

  // ============================================
  // STATUS COLORS (Shared across themes)
  // ============================================
  success: '#10B981',           // Success - emerald
  successLight: '#34D399',      // Success for dark mode
  successBg: '#ECFDF5',         // Success background light
  successBgDark: 'rgba(16, 185, 129, 0.15)', // Success background dark
  
  warning: '#F59E0B',           // Warning - amber
  warningLight: '#FBBF24',      // Warning for dark mode
  warningBg: '#FFFBEB',         // Warning background light
  warningBgDark: 'rgba(245, 158, 11, 0.15)', // Warning background dark
  
  error: '#EF4444',             // Error - red
  errorLight: '#F87171',        // Error for dark mode
  errorBg: '#FEF2F2',           // Error background light
  errorBgDark: 'rgba(239, 68, 68, 0.15)', // Error background dark
  
  info: '#3B82F6',              // Info - blue
  infoLight: '#60A5FA',         // Info for dark mode
  infoBg: '#EFF6FF',            // Info background light
  infoBgDark: 'rgba(59, 130, 246, 0.15)', // Info background dark

  // ============================================
  // OPACITY VARIANTS (computed from base colors)
  // ============================================
  teal10: 'rgba(13, 148, 136, 0.1)',
  teal15: 'rgba(13, 148, 136, 0.15)',
  teal20: 'rgba(13, 148, 136, 0.2)',
  teal40: 'rgba(13, 148, 136, 0.4)',
  teal50: 'rgba(13, 148, 136, 0.5)',
  
  pink10: 'rgba(236, 72, 153, 0.1)',
  pink20: 'rgba(236, 72, 153, 0.2)',
  
  cyan10: 'rgba(0, 255, 194, 0.1)',
  cyan15: 'rgba(0, 255, 194, 0.15)',
  cyan20: 'rgba(0, 255, 194, 0.2)',
  cyan40: 'rgba(0, 255, 194, 0.4)',
  cyan50: 'rgba(0, 255, 194, 0.5)',
  
  coral10: 'rgba(255, 92, 141, 0.1)',
  coral15: 'rgba(255, 92, 141, 0.15)',
  coral20: 'rgba(255, 92, 141, 0.2)',

  // Glass effects
  whiteGlass: 'rgba(255, 255, 255, 0.75)',
  whiteGlassStrong: 'rgba(255, 255, 255, 0.9)',
  whiteGlassFull: 'rgba(255, 255, 255, 0.98)',
  blackGlass: 'rgba(21, 21, 21, 0.8)',
  blackGlassStrong: 'rgba(21, 21, 21, 0.9)',
  blackGlassFull: 'rgba(21, 21, 21, 0.98)',

  // Shadows
  shadowLight: '15, 23, 42',    // Slate RGB for light mode shadows
  shadowDark: '0, 0, 0',        // Black RGB for dark mode shadows
  glowTeal: '13, 148, 136',     // Teal RGB for glow effects
  glowCyan: '0, 255, 194',      // Cyan RGB for dark mode glow
  glowPink: '236, 72, 153',     // Pink RGB for accent glow
  glowCoral: '255, 92, 141',    // Coral RGB for dark accent glow
} as const;

// Type for the palette
export type PaletteColor = keyof typeof palette;
export type PaletteValue = typeof palette[PaletteColor];
