/**
 * Semantic Theme Tokens
 * 
 * Maps raw palette colors to semantic purposes.
 * This provides meaning to colors (e.g., "primary" for main actions).
 * 
 * THEME SYSTEM: "Signal Wildlife"
 * - Light: "Sunlit Marsh" - warm organic teal with layered depth
 * - Dark: "Bioluminescent Night" - deep waters with glowing organisms
 */

import { palette } from './colors';

/**
 * Light Theme Token Definitions - "Sunlit Marsh"
 */
export const lightTheme = {
  // ============================================
  // BACKGROUNDS - Warm organic feel
  // ============================================
  background: palette.offWhite,           // Morning mist #F7F9F7
  backgroundSecondary: palette.mint,       // Organic sage-mist #EEF7F2
  backgroundElevated: palette.white,
  backgroundPond: palette.pond,            // Shallow water #E3EEF0
  backgroundMoss: palette.moss,            // Moss green #E8F0E8
  
  // ============================================
  // FOREGROUNDS (Text colors)
  // ============================================
  foreground: palette.slate,
  foregroundSecondary: palette.slateMuted,
  foregroundMuted: palette.slateLight,
  
  // ============================================
  // CARDS & SURFACES - Pond reflection depth
  // ============================================
  card: palette.whiteGlassStrong,
  cardSolid: palette.white,
  cardHover: palette.mintLight,
  cardForeground: palette.slate,
  popover: palette.whiteGlassFull,
  popoverForeground: palette.slate,
  
  // ============================================
  // PRIMARY - Tree Frog Teal
  // ============================================
  primary: palette.teal,                   // #0A8F81
  primaryHover: palette.tealDark,          // #087D6F
  primaryActive: palette.tealDeeper,       // #065F56
  primaryForeground: palette.white,
  primaryMuted: palette.teal10,
  
  // ============================================
  // SECONDARY - Organic Sage
  // ============================================
  secondary: palette.mint,
  secondaryHover: '#E2F5EE',
  secondaryForeground: palette.tealDark,
  secondaryMuted: 'rgba(238, 247, 242, 0.5)',
  
  // ============================================
  // ACCENT - Orchid Pink
  // ============================================
  accent: palette.pink,                    // #E0478C
  accentHover: palette.pinkDark,           // #C93D7A
  accentForeground: palette.white,
  accentMuted: palette.pink10,
  
  // ============================================
  // FIREFLY - Special highlight accent
  // ============================================
  firefly: palette.firefly,                // #C7F464
  fireflyMuted: palette.firefly10,
  
  // ============================================
  // MUTED - Moss tones
  // ============================================
  muted: palette.moss,                     // #E8F0E8
  mutedForeground: palette.slateMuted,
  
  // ============================================
  // BORDERS - Teal undertone for cohesion
  // ============================================
  border: palette.border,                  // #C8D4D8
  borderSubtle: palette.borderSubtle,      // #DDE5E8
  borderStrong: palette.teal,
  
  // ============================================
  // INPUTS - Marsh well styling
  // ============================================
  input: 'transparent',
  inputBackground: palette.white,
  inputBorder: palette.border,
  inputFocus: palette.teal,
  switchBackground: palette.border,
  
  // ============================================
  // FOCUS RING - Organic teal glow
  // ============================================
  ring: palette.teal40,
  ringOffset: palette.offWhite,
  focusRing: `0 0 0 3px rgba(10, 143, 129, 0.35), 0 0 12px rgba(10, 143, 129, 0.12)`,
  
  // ============================================
  // STATUS COLORS - Organic variants
  // ============================================
  destructive: palette.error,
  destructiveHover: '#DC2626',
  destructiveForeground: palette.white,
  destructiveMuted: '#FEF2F2',
  
  success: palette.success,
  successForeground: palette.white,
  successMuted: '#E8F5F0',
  
  warning: palette.warning,
  warningForeground: palette.slate,
  warningMuted: '#FFF8E6',
  
  info: palette.info,
  infoForeground: palette.white,
  infoMuted: '#EFF6FF',
  
  // ============================================
  // LAYOUT COMPONENTS - Organic glass
  // ============================================
  sidebarBg: 'rgba(255, 255, 255, 0.92)',
  sidebarGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(238, 247, 242, 0.92) 100%)',
  sidebarForeground: palette.slate,
  sidebarMuted: palette.slateMuted,
  sidebarHover: palette.teal10,
  sidebarActive: palette.teal15,
  sidebarActiveForeground: palette.tealDark,
  sidebarBorder: palette.border,
  
  topbarBg: 'rgba(255, 255, 255, 0.88)',
  topbarGradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 249, 247, 0.9) 100%)',
  topbarForeground: palette.slate,
  topbarMuted: palette.slateMuted,
  topbarHover: palette.teal10,
  
  // ============================================
  // SHADOWS - Organic teal-tinted
  // ============================================
  shadowColor: palette.shadowLight,
  shadowTeal: palette.shadowTeal,
  shadowPrimary: palette.glowTeal,
  shadowAccent: palette.glowPink,
  shadowFirefly: palette.glowFirefly,
  
  shadowSm: `0 1px 2px rgba(${palette.shadowLight}, 0.06), 0 1px 3px rgba(${palette.shadowTeal}, 0.04)`,
  shadow: `0 1px 3px rgba(${palette.shadowLight}, 0.1), 0 2px 6px rgba(${palette.shadowTeal}, 0.06)`,
  shadowMd: `0 4px 8px rgba(${palette.shadowLight}, 0.08), 0 2px 4px rgba(${palette.shadowTeal}, 0.08)`,
  shadowLg: `0 10px 20px rgba(${palette.shadowLight}, 0.1), 0 4px 8px rgba(${palette.shadowTeal}, 0.08)`,
  shadowXl: `0 20px 30px rgba(${palette.shadowLight}, 0.12), 0 10px 15px rgba(${palette.shadowTeal}, 0.08)`,
  shadow2xl: `0 25px 50px rgba(${palette.shadowLight}, 0.18), 0 10px 20px rgba(${palette.shadowTeal}, 0.1)`,
  shadowGlow: `0 0 25px rgba(${palette.glowTeal}, 0.25), 0 4px 12px rgba(${palette.glowTeal}, 0.15)`,
  shadowGlowPrimary: `0 0 35px rgba(${palette.glowTeal}, 0.35), 0 4px 16px rgba(${palette.glowTeal}, 0.2)`,
  shadowGlowAccent: `0 0 30px rgba(${palette.glowPink}, 0.3), 0 4px 12px rgba(${palette.glowPink}, 0.15)`,
  shadowGlowFirefly: `0 0 20px rgba(${palette.glowFirefly}, 0.3), 0 2px 8px rgba(${palette.glowFirefly}, 0.2)`,
  shadowElevated: `0 12px 40px rgba(${palette.shadowLight}, 0.14), 0 4px 12px rgba(${palette.shadowTeal}, 0.1)`,
  shadowCard: `inset 0 1px 0 rgba(255, 255, 255, 1), 0 1px 2px rgba(${palette.shadowLight}, 0.04), 0 4px 8px rgba(${palette.shadowTeal}, 0.06), 0 12px 24px rgba(${palette.shadowLight}, 0.05)`,
  
  // ============================================
  // GLASSMORPHISM - Organic warmth
  // ============================================
  glassBg: palette.whiteGlass,
  glassBorder: 'rgba(255, 255, 255, 0.4)',
  glassShine: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)',
  glassReflection: 'linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 40%)',
  
  // ============================================
  // SELECTION
  // ============================================
  selectionBg: palette.teal20,
  selectionText: palette.slate,
  
  // ============================================
  // GRADIENTS
  // ============================================
  gradientPond: 'linear-gradient(180deg, #FFFFFF 0%, #F7F9F7 40%, #EEF7F2 100%)',
  gradientPrimary: 'linear-gradient(180deg, #0A9A8A 0%, #087D6F 100%)',
  gradientAccent: 'linear-gradient(180deg, #E85A98 0%, #C93D7A 100%)',
} as const;

/**
 * Dark Theme Token Definitions - "Bioluminescent Night"
 */
export const darkTheme = {
  // ============================================
  // BACKGROUNDS - Cooler, deeper night water
  // ============================================
  background: palette.black,               // #080A0C
  backgroundSecondary: palette.darkSurface, // #0F1214
  backgroundElevated: palette.darkSurfaceHover,
  backgroundPond: '#0A0C0E',
  backgroundMoss: '#0D1012',
  
  // ============================================
  // FOREGROUNDS (Text colors)
  // ============================================
  foreground: palette.lightText,           // #F5F7F7
  foregroundSecondary: palette.mutedText,  // #A8AEAE
  foregroundMuted: palette.darkMutedText,  // #6E7878
  
  // ============================================
  // CARDS & SURFACES - Bioluminescent depth
  // ============================================
  card: palette.blackGlassStrong,
  cardSolid: palette.darkSurface,
  cardHover: palette.darkSurfaceHover,
  cardForeground: palette.lightText,
  popover: palette.blackGlassFull,
  popoverForeground: palette.lightText,
  
  // ============================================
  // PRIMARY - Bioluminescent Cyan
  // ============================================
  primary: palette.cyan,                   // #00F5B8
  primaryHover: palette.cyanBright,        // #33F7C6
  primaryActive: palette.cyanActive,       // #66F9D4
  primaryForeground: palette.black,
  primaryMuted: palette.cyan15,
  
  // ============================================
  // SECONDARY - Deep water
  // ============================================
  secondary: '#1A1E22',
  secondaryHover: '#252A30',
  secondaryForeground: palette.lightText,
  secondaryMuted: 'rgba(26, 30, 34, 0.5)',
  
  // ============================================
  // ACCENT - Warmer Coral
  // ============================================
  accent: palette.coral,                   // #FF6B8A
  accentHover: palette.coralBright,        // #FF8BA6
  accentForeground: palette.black,
  accentMuted: palette.coral15,
  
  // ============================================
  // FIREFLY - Dark mode highlight
  // ============================================
  firefly: palette.fireflyDark,            // #9FD356
  fireflyMuted: 'rgba(159, 211, 86, 0.15)',
  
  // ============================================
  // MUTED - Night moss
  // ============================================
  muted: '#1A1E22',
  mutedForeground: palette.mutedText,
  
  // ============================================
  // BORDERS - Slight blue undertone
  // ============================================
  border: palette.darkBorder,              // #262B30
  borderSubtle: '#1A1E22',
  borderStrong: palette.cyan,
  
  // ============================================
  // INPUTS - Deep water well
  // ============================================
  input: 'rgba(15, 18, 20, 0.6)',
  inputBackground: 'rgba(15, 18, 20, 0.8)',
  inputBorder: '#262B30',
  inputFocus: palette.cyan,
  switchBackground: '#3A4048',
  
  // ============================================
  // FOCUS RING - Bioluminescent glow
  // ============================================
  ring: palette.cyan50,
  ringOffset: palette.black,
  focusRing: `0 0 0 3px rgba(0, 245, 184, 0.35), 0 0 15px rgba(0, 245, 184, 0.15)`,
  
  // ============================================
  // STATUS COLORS - Brighter, more bioluminescent
  // ============================================
  destructive: palette.errorLight,
  destructiveHover: '#FCA5A5',
  destructiveForeground: palette.black,
  destructiveMuted: 'rgba(248, 113, 113, 0.15)',
  
  success: palette.successLight,
  successForeground: palette.black,
  successMuted: 'rgba(52, 211, 153, 0.15)',
  
  warning: palette.warningLight,
  warningForeground: palette.black,
  warningMuted: 'rgba(251, 191, 36, 0.15)',
  
  info: palette.infoLight,
  infoForeground: palette.black,
  infoMuted: 'rgba(96, 165, 250, 0.15)',
  
  // ============================================
  // LAYOUT COMPONENTS - Bioluminescent glass
  // ============================================
  sidebarBg: 'rgba(12, 14, 16, 0.95)',
  sidebarGradient: 'linear-gradient(135deg, rgba(15, 18, 20, 0.95) 0%, rgba(12, 14, 16, 0.92) 100%)',
  sidebarForeground: palette.lightText,
  sidebarMuted: palette.mutedText,
  sidebarHover: 'rgba(0, 245, 184, 0.08)',
  sidebarActive: 'rgba(0, 245, 184, 0.12)',
  sidebarActiveForeground: palette.cyan,
  sidebarBorder: '#262B30',
  
  topbarBg: 'rgba(8, 10, 12, 0.92)',
  topbarGradient: 'linear-gradient(180deg, rgba(12, 14, 16, 0.95) 0%, rgba(8, 10, 12, 0.9) 100%)',
  topbarForeground: palette.lightText,
  topbarMuted: palette.mutedText,
  topbarHover: 'rgba(0, 245, 184, 0.08)',
  
  // ============================================
  // SHADOWS - Bioluminescent glow effects
  // ============================================
  shadowColor: palette.shadowDark,
  shadowTeal: palette.glowCyan,
  shadowPrimary: palette.glowCyan,
  shadowAccent: palette.glowCoral,
  shadowFirefly: palette.glowFirefly,
  
  shadowSm: `0 1px 2px rgba(${palette.shadowDark}, 0.4)`,
  shadow: `0 2px 4px rgba(${palette.shadowDark}, 0.5), 0 1px 2px rgba(${palette.shadowDark}, 0.4)`,
  shadowMd: `0 4px 8px rgba(${palette.shadowDark}, 0.5), 0 2px 4px rgba(${palette.shadowDark}, 0.4)`,
  shadowLg: `0 12px 24px rgba(${palette.shadowDark}, 0.6), 0 4px 8px rgba(${palette.shadowDark}, 0.4)`,
  shadowXl: `0 24px 48px rgba(${palette.shadowDark}, 0.7), 0 8px 16px rgba(${palette.shadowDark}, 0.5)`,
  shadow2xl: `0 25px 50px rgba(${palette.shadowDark}, 0.5)`,
  shadowGlow: `0 0 30px rgba(${palette.glowCyan}, 0.25)`,
  shadowGlowPrimary: `0 0 40px rgba(${palette.glowCyan}, 0.35), 0 4px 16px rgba(${palette.glowCyan}, 0.2)`,
  shadowGlowAccent: `0 0 30px rgba(${palette.glowCoral}, 0.3), 0 4px 12px rgba(${palette.glowCoral}, 0.15)`,
  shadowGlowFirefly: `0 0 25px rgba(${palette.glowFirefly}, 0.35), 0 2px 10px rgba(${palette.glowFirefly}, 0.2)`,
  shadowElevated: `0 8px 30px rgba(${palette.shadowDark}, 0.6), 0 4px 12px rgba(${palette.shadowDark}, 0.4), 0 0 20px rgba(${palette.glowCyan}, 0.05)`,
  shadowCard: `inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 2px 4px rgba(${palette.shadowDark}, 0.3), 0 4px 8px rgba(${palette.shadowDark}, 0.2)`,
  
  // ============================================
  // GLASSMORPHISM - Bioluminescent
  // ============================================
  glassBg: palette.blackGlass,
  glassBorder: 'rgba(255, 255, 255, 0.06)',
  glassShine: 'linear-gradient(135deg, rgba(0, 245, 184, 0.05) 0%, rgba(255, 255, 255, 0) 50%)',
  glassReflection: 'linear-gradient(180deg, rgba(0, 245, 184, 0.03) 0%, rgba(255, 255, 255, 0) 40%)',
  
  // ============================================
  // SELECTION
  // ============================================
  selectionBg: `rgba(${palette.glowCyan}, 0.3)`,
  selectionText: palette.lightText,
  
  // ============================================
  // GRADIENTS
  // ============================================
  gradientPond: 'linear-gradient(180deg, #0F1214 0%, #0C0E10 40%, #080A0C 100%)',
  gradientPrimary: 'linear-gradient(180deg, #00F5B8 0%, #00D9A0 100%)',
  gradientAccent: 'linear-gradient(180deg, #FF7A9A 0%, #FF6B8A 100%)',
} as const;

// Type exports
export type ThemeTokens = typeof lightTheme;
export type ThemeTokenKey = keyof ThemeTokens;
