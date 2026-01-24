/**
 * Theme System - Main Export
 * 
 * This is the single entry point for all theme-related functionality.
 * Import from '@/theme' in your components.
 * 
 * @example
 * import { ThemeProvider, useTheme, cssVar, palette, lightTheme, darkTheme } from '@/theme';
 */

// Re-export everything from individual modules
export { palette } from './colors';
export type { PaletteColor, PaletteValue } from './colors';

export { lightTheme, darkTheme } from './tokens';
export type { ThemeTokens, ThemeTokenKey } from './tokens';

export { 
  ThemeProvider, 
  useTheme, 
  cssVar, 
  cssVars 
} from './ThemeProvider';
export type { ThemeMode } from './ThemeProvider';
