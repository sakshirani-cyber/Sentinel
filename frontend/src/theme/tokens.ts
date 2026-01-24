/**
 * Semantic Theme Tokens
 * 
 * Maps raw palette colors to semantic purposes.
 * This provides meaning to colors (e.g., "primary" for main actions).
 * 
 * Light and Dark themes use different palette colors for the same semantic purpose.
 */

import { palette } from './colors';

/**
 * Light Theme Token Definitions
 */
export const lightTheme = {
  // ============================================
  // BACKGROUNDS
  // ============================================
  background: palette.white,
  backgroundSecondary: palette.mint,
  
  // ============================================
  // FOREGROUNDS (Text colors)
  // ============================================
  foreground: palette.slate,
  foregroundSecondary: palette.slateMuted,
  foregroundMuted: palette.slateLight,
  
  // ============================================
  // CARDS & SURFACES
  // ============================================
  card: palette.whiteGlassStrong,
  cardSolid: palette.white,
  cardHover: palette.white,
  cardForeground: palette.slate,
  popover: palette.whiteGlassFull,
  popoverForeground: palette.slate,
  
  // ============================================
  // PRIMARY (Main actions, CTAs)
  // ============================================
  primary: palette.teal,
  primaryHover: palette.tealDark,
  primaryActive: palette.tealDeeper,
  primaryForeground: palette.white,
  primaryMuted: palette.teal10,
  
  // ============================================
  // SECONDARY
  // ============================================
  secondary: palette.mint,
  secondaryHover: '#E6FAF7', // Slightly darker mint
  secondaryForeground: palette.tealDark,
  secondaryMuted: 'rgba(240, 253, 250, 0.5)',
  
  // ============================================
  // ACCENT (Highlights, special elements)
  // ============================================
  accent: palette.pink,
  accentHover: palette.pinkDark,
  accentForeground: palette.white,
  accentMuted: palette.pink10,
  
  // ============================================
  // MUTED (Subtle backgrounds)
  // ============================================
  muted: '#F1F5F9',
  mutedForeground: palette.slateMuted,
  
  // ============================================
  // BORDERS
  // ============================================
  border: palette.border,
  borderSubtle: '#F1F5F9',
  borderStrong: palette.teal,
  
  // ============================================
  // INPUTS
  // ============================================
  input: 'transparent',
  inputBackground: palette.white,
  inputBorder: palette.border,
  inputFocus: palette.teal,
  switchBackground: '#CBD5E1',
  
  // ============================================
  // FOCUS RING
  // ============================================
  ring: palette.teal40,
  ringOffset: palette.white,
  focusRing: `0 0 0 3px ${palette.teal40}`,
  
  // ============================================
  // STATUS COLORS
  // ============================================
  destructive: palette.error,
  destructiveHover: '#DC2626',
  destructiveForeground: palette.white,
  destructiveMuted: palette.errorBg,
  
  success: palette.success,
  successForeground: palette.white,
  successMuted: palette.successBg,
  
  warning: palette.warning,
  warningForeground: palette.slate,
  warningMuted: palette.warningBg,
  
  info: palette.info,
  infoForeground: palette.white,
  infoMuted: palette.infoBg,
  
  // ============================================
  // LAYOUT COMPONENTS
  // ============================================
  sidebarBg: 'rgba(255, 255, 255, 0.85)',
  sidebarForeground: palette.slate,
  sidebarMuted: palette.slateMuted,
  sidebarHover: palette.teal10,
  sidebarActive: palette.teal20,
  sidebarActiveForeground: palette.tealDark,
  sidebarBorder: palette.border,
  
  topbarBg: 'rgba(255, 255, 255, 0.8)',
  topbarForeground: palette.slate,
  topbarMuted: palette.slateMuted,
  topbarHover: palette.teal10,
  
  // ============================================
  // SHADOWS
  // ============================================
  shadowColor: palette.shadowLight,
  shadowPrimary: palette.glowTeal,
  shadowAccent: palette.glowPink,
  
  shadowSm: `0 1px 2px rgba(${palette.shadowLight}, 0.05)`,
  shadow: `0 1px 3px rgba(${palette.shadowLight}, 0.1), 0 1px 2px rgba(${palette.shadowLight}, 0.06)`,
  shadowMd: `0 4px 6px rgba(${palette.shadowLight}, 0.07), 0 2px 4px rgba(${palette.shadowLight}, 0.06)`,
  shadowLg: `0 10px 15px rgba(${palette.shadowLight}, 0.1), 0 4px 6px rgba(${palette.shadowLight}, 0.05)`,
  shadowXl: `0 20px 25px rgba(${palette.shadowLight}, 0.1), 0 10px 10px rgba(${palette.shadowLight}, 0.04)`,
  shadow2xl: `0 25px 50px rgba(${palette.shadowLight}, 0.15)`,
  shadowGlow: `0 0 20px rgba(${palette.glowTeal}, 0.3)`,
  shadowGlowPrimary: `0 0 30px rgba(${palette.glowTeal}, 0.4)`,
  shadowGlowAccent: `0 0 25px rgba(${palette.glowPink}, 0.35)`,
  shadowElevated: `0 10px 40px rgba(${palette.shadowLight}, 0.12), 0 4px 12px rgba(${palette.shadowLight}, 0.08)`,
  
  // ============================================
  // GLASSMORPHISM
  // ============================================
  glassBg: palette.whiteGlass,
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  glassShine: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 50%)',
  glassReflection: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 40%)',
  
  // ============================================
  // SELECTION
  // ============================================
  selectionBg: palette.teal20,
  selectionText: palette.slate,
} as const;

/**
 * Dark Theme Token Definitions
 */
export const darkTheme = {
  // ============================================
  // BACKGROUNDS
  // ============================================
  background: palette.black,
  backgroundSecondary: palette.darkSurface,
  
  // ============================================
  // FOREGROUNDS (Text colors)
  // ============================================
  foreground: palette.lightText,
  foregroundSecondary: palette.mutedText,
  foregroundMuted: palette.darkMutedText,
  
  // ============================================
  // CARDS & SURFACES
  // ============================================
  card: palette.blackGlassStrong,
  cardSolid: palette.darkSurface,
  cardHover: 'rgba(30, 30, 30, 1)',
  cardForeground: palette.lightText,
  popover: palette.blackGlassFull,
  popoverForeground: palette.lightText,
  
  // ============================================
  // PRIMARY (Main actions, CTAs)
  // ============================================
  primary: palette.cyan,
  primaryHover: palette.cyanBright,
  primaryActive: palette.cyanActive,
  primaryForeground: palette.black,
  primaryMuted: palette.cyan15,
  
  // ============================================
  // SECONDARY
  // ============================================
  secondary: palette.darkSurfaceHover,
  secondaryHover: '#2A2A2A',
  secondaryForeground: palette.lightText,
  secondaryMuted: 'rgba(31, 31, 31, 0.5)',
  
  // ============================================
  // ACCENT (Highlights, special elements)
  // ============================================
  accent: palette.coral,
  accentHover: palette.coralBright,
  accentForeground: palette.black,
  accentMuted: palette.coral15,
  
  // ============================================
  // MUTED (Subtle backgrounds)
  // ============================================
  muted: '#262626',
  mutedForeground: palette.mutedText,
  
  // ============================================
  // BORDERS
  // ============================================
  border: palette.darkBorder,
  borderSubtle: '#1F1F1F',
  borderStrong: palette.cyan,
  
  // ============================================
  // INPUTS
  // ============================================
  input: 'rgba(21, 21, 21, 0.6)',
  inputBackground: 'rgba(21, 21, 21, 0.8)',
  inputBorder: '#333333',
  inputFocus: palette.cyan,
  switchBackground: '#404040',
  
  // ============================================
  // FOCUS RING
  // ============================================
  ring: palette.cyan50,
  ringOffset: palette.black,
  focusRing: `0 0 0 3px ${palette.cyan40}`,
  
  // ============================================
  // STATUS COLORS
  // ============================================
  destructive: palette.errorLight,
  destructiveHover: '#FCA5A5',
  destructiveForeground: palette.black,
  destructiveMuted: palette.errorBgDark,
  
  success: palette.successLight,
  successForeground: palette.black,
  successMuted: palette.successBgDark,
  
  warning: palette.warningLight,
  warningForeground: palette.black,
  warningMuted: palette.warningBgDark,
  
  info: palette.infoLight,
  infoForeground: palette.black,
  infoMuted: palette.infoBgDark,
  
  // ============================================
  // LAYOUT COMPONENTS
  // ============================================
  sidebarBg: 'rgba(15, 15, 15, 0.95)',
  sidebarForeground: palette.lightText,
  sidebarMuted: palette.mutedText,
  sidebarHover: palette.cyan10,
  sidebarActive: palette.cyan15,
  sidebarActiveForeground: palette.cyan,
  sidebarBorder: '#262626',
  
  topbarBg: 'rgba(10, 10, 10, 0.9)',
  topbarForeground: palette.lightText,
  topbarMuted: palette.mutedText,
  topbarHover: palette.cyan10,
  
  // ============================================
  // SHADOWS
  // ============================================
  shadowColor: palette.shadowDark,
  shadowPrimary: palette.glowCyan,
  shadowAccent: palette.glowCoral,
  
  shadowSm: `0 1px 2px rgba(${palette.shadowDark}, 0.4)`,
  shadow: `0 2px 4px rgba(${palette.shadowDark}, 0.5), 0 1px 2px rgba(${palette.shadowDark}, 0.4)`,
  shadowMd: `0 4px 8px rgba(${palette.shadowDark}, 0.5), 0 2px 4px rgba(${palette.shadowDark}, 0.4)`,
  shadowLg: `0 12px 24px rgba(${palette.shadowDark}, 0.6), 0 4px 8px rgba(${palette.shadowDark}, 0.4)`,
  shadowXl: `0 24px 48px rgba(${palette.shadowDark}, 0.7), 0 8px 16px rgba(${palette.shadowDark}, 0.5)`,
  shadow2xl: `0 25px 50px rgba(${palette.shadowDark}, 0.5)`,
  shadowGlow: `0 0 30px rgba(${palette.glowCyan}, 0.25)`,
  shadowGlowPrimary: `0 0 40px rgba(${palette.glowCyan}, 0.35)`,
  shadowGlowAccent: `0 0 30px rgba(${palette.glowCoral}, 0.3)`,
  shadowElevated: `0 8px 30px rgba(${palette.shadowDark}, 0.6), 0 4px 12px rgba(${palette.shadowDark}, 0.4)`,
  
  // ============================================
  // GLASSMORPHISM
  // ============================================
  glassBg: palette.blackGlass,
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassShine: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 50%)',
  glassReflection: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 40%)',
  
  // ============================================
  // SELECTION
  // ============================================
  selectionBg: `rgba(${palette.glowCyan}, 0.3)`,
  selectionText: palette.lightText,
} as const;

// Type exports
export type ThemeTokens = typeof lightTheme;
export type ThemeTokenKey = keyof ThemeTokens;
