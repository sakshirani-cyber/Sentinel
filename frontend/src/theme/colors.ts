/**
 * Signal Wildlife Color Palette
 * 
 * This is the SINGLE SOURCE OF TRUTH for all color values in the application.
 * All hex codes should be defined here and nowhere else.
 * 
 * Design Philosophy: "Signal Wildlife"
 * - Light Mode: "Sunlit Marsh" - warm, organic, layered depth like shallow water
 * - Dark Mode: "Bioluminescent Night" - deep waters with glowing organisms
 * 
 * To change the app's color scheme, modify only this file.
 */

export const palette = {
  // ============================================
  // LIGHT MODE PRIMARIES - "Sunlit Marsh" Theme
  // Warm, organic colors with layered depth
  // ============================================
  white: '#FFFFFF',
  offWhite: '#F7F9F7',          // Warmer base - morning mist over marsh
  cream: '#F5F7F5',             // Card gradient end - organic warmth
  mint: '#EEF7F2',              // Secondary background - organic sage-mist
  mintLight: '#F2FAF6',         // Elevated surface tint
  teal: '#0A8F81',              // Primary - deeper "tree frog" teal
  tealDark: '#087D6F',          // Primary hover - "deep pool" variant
  tealDeeper: '#065F56',        // Primary active - darkest pool
  pink: '#E0478C',              // Accent - warmer "orchid" pink
  pinkDark: '#C93D7A',          // Accent hover
  slate: '#0F172A',             // Primary text - deep slate
  slateMuted: '#475569',        // Secondary text
  slateLight: '#64748B',        // Muted text
  border: '#C8D4D8',            // Light mode borders - subtle teal undertone
  borderSubtle: '#DDE5E8',      // Subtle borders with warmth

  // ============================================
  // WILDLIFE-INSPIRED ACCENT COLORS
  // Organic, nature-derived palette additions
  // ============================================
  firefly: '#C7F464',           // Bioluminescent yellow-green (highlights)
  fireflyDark: '#9FD356',       // Darker firefly for dark mode
  lily: '#FFEEF5',              // Soft water lily pink (subtle tints)
  lilyDark: '#FFD6E8',          // Deeper lily for accents
  moss: '#E8F0E8',              // Moss green (tertiary surfaces)
  mossDark: '#D4E4D4',          // Deeper moss
  pond: '#E3EEF0',              // Shallow water blue-teal (backgrounds)
  pondDark: '#D0E2E6',          // Deeper pond

  // ============================================
  // DARK MODE PRIMARIES - "Bioluminescent Night"
  // Deep waters with glowing organisms
  // ============================================
  black: '#080A0C',             // Deeper night water - cooler undertone
  darkSurface: '#0F1214',       // Dark mode cards - cooler depth
  darkSurfaceHover: '#1A1E22',  // Dark surface hover
  darkBorder: '#262B30',        // Dark mode borders - slight blue
  cyan: '#00F5B8',              // Bioluminescent cyan - warmer glow
  cyanBright: '#33F7C6',        // Hover glow
  cyanActive: '#66F9D4',        // Active state
  coral: '#FF6B8A',             // Warmer organic coral pink
  coralBright: '#FF8BA6',       // Accent hover
  lightText: '#F5F7F7',         // Dark mode primary text - warmer
  mutedText: '#A8AEAE',         // Dark mode secondary text
  darkMutedText: '#6E7878',     // Dark mode muted text

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
  // Updated for "tree frog" teal (#0A8F81 = 10, 143, 129)
  // ============================================
  teal10: 'rgba(10, 143, 129, 0.1)',
  teal15: 'rgba(10, 143, 129, 0.15)',
  teal20: 'rgba(10, 143, 129, 0.2)',
  teal40: 'rgba(10, 143, 129, 0.4)',
  teal50: 'rgba(10, 143, 129, 0.5)',
  
  // Updated for "orchid" pink (#E0478C = 224, 71, 140)
  pink10: 'rgba(224, 71, 140, 0.1)',
  pink20: 'rgba(224, 71, 140, 0.2)',
  
  // Updated for bioluminescent cyan (#00F5B8 = 0, 245, 184)
  cyan10: 'rgba(0, 245, 184, 0.1)',
  cyan15: 'rgba(0, 245, 184, 0.15)',
  cyan20: 'rgba(0, 245, 184, 0.2)',
  cyan40: 'rgba(0, 245, 184, 0.4)',
  cyan50: 'rgba(0, 245, 184, 0.5)',
  
  // Updated for warmer coral (#FF6B8A = 255, 107, 138)
  coral10: 'rgba(255, 107, 138, 0.1)',
  coral15: 'rgba(255, 107, 138, 0.15)',
  coral20: 'rgba(255, 107, 138, 0.2)',

  // Firefly glow variants
  firefly10: 'rgba(199, 244, 100, 0.1)',
  firefly20: 'rgba(199, 244, 100, 0.2)',
  firefly30: 'rgba(199, 244, 100, 0.3)',

  // Glass effects - Enhanced for organic warmth
  whiteGlass: 'rgba(255, 255, 255, 0.75)',
  whiteGlassStrong: 'rgba(255, 255, 255, 0.92)',
  whiteGlassFull: 'rgba(255, 255, 255, 0.98)',
  offWhiteGlass: 'rgba(247, 249, 247, 0.85)',  // Warmer glass for light mode
  mintGlass: 'rgba(238, 247, 242, 0.9)',       // Organic mint-tinted glass
  pondGlass: 'rgba(227, 238, 240, 0.85)',      // Pond-tinted glass
  blackGlass: 'rgba(15, 18, 20, 0.8)',         // Cooler dark glass
  blackGlassStrong: 'rgba(15, 18, 20, 0.9)',
  blackGlassFull: 'rgba(15, 18, 20, 0.98)',

  // Shadows - Enhanced with organic teal tints
  shadowLight: '15, 23, 42',        // Slate RGB for light mode shadows
  shadowTeal: '10, 143, 129',       // Tree frog teal RGB for tinted shadows
  shadowOrganic: '10, 143, 129',    // Organic teal for depth
  shadowWarm: '200, 212, 216',      // Warm gray for subtle edges
  shadowDark: '8, 10, 12',          // Deep night water RGB
  glowTeal: '10, 143, 129',         // Tree frog teal for glow effects
  glowCyan: '0, 245, 184',          // Bioluminescent cyan for dark mode glow
  glowPink: '224, 71, 140',         // Orchid pink RGB for accent glow
  glowCoral: '255, 107, 138',       // Warmer coral RGB for dark accent glow
  glowFirefly: '199, 244, 100',     // Firefly glow RGB

  // Light Mode Surface Highlights
  innerHighlight: 'rgba(255, 255, 255, 0.95)',  // Crisp top edge highlight
  innerShadow: 'rgba(15, 23, 42, 0.03)',        // Subtle inner shadow for depth
  innerGlow: 'rgba(10, 143, 129, 0.04)',        // Subtle teal inner glow
} as const;

// Type for the palette
export type PaletteColor = keyof typeof palette;
export type PaletteValue = typeof palette[PaletteColor];
