/**
 * Theme Provider Component
 * 
 * Provides theme context to the entire application and injects CSS variables
 * based on the current theme mode (light/dark/system).
 * 
 * Usage:
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { lightTheme, darkTheme, ThemeTokens, ThemeTokenKey } from './tokens';

// ============================================
// TYPES
// ============================================

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** Current theme mode setting */
  mode: ThemeMode;
  /** Set the theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Current resolved theme tokens */
  theme: ThemeTokens;
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Toggle between light and dark modes */
  toggleTheme: () => void;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Convert camelCase to kebab-case for CSS variable names
 * e.g., "primaryHover" -> "primary-hover"
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Storage key for persisting theme preference
 */
const THEME_STORAGE_KEY = 'ribbit-theme';

// ============================================
// CONTEXT
// ============================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================
// PROVIDER COMPONENT
// ============================================

interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme mode if none is stored */
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ 
  children, 
  defaultMode = 'system' 
}: ThemeProviderProps) {
  // Load saved theme preference
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      return saved || defaultMode;
    }
    return defaultMode;
  });

  const [isDark, setIsDark] = useState(false);

  /**
   * Inject CSS variables into document root
   */
  const injectCSSVariables = useCallback((theme: ThemeTokens) => {
    const root = document.documentElement;
    
    Object.entries(theme).forEach(([key, value]) => {
      const cssVarName = `--${camelToKebab(key)}`;
      root.style.setProperty(cssVarName, value);
    });
  }, []);

  /**
   * Handle theme mode changes
   */
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  }, []);

  /**
   * Toggle between light and dark modes
   */
  const toggleTheme = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  /**
   * Effect: Apply theme based on mode
   */
  useEffect(() => {
    // Determine if we should use dark mode
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = mode === 'dark' || (mode === 'system' && systemPrefersDark);
    
    setIsDark(shouldBeDark);
    
    // Toggle dark class on document
    document.documentElement.classList.toggle('dark', shouldBeDark);
    
    // Inject the appropriate theme's CSS variables
    const activeTheme = shouldBeDark ? darkTheme : lightTheme;
    injectCSSVariables(activeTheme);
  }, [mode, injectCSSVariables]);

  /**
   * Effect: Listen for system theme changes
   */
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const shouldBeDark = e.matches;
      setIsDark(shouldBeDark);
      document.documentElement.classList.toggle('dark', shouldBeDark);
      injectCSSVariables(shouldBeDark ? darkTheme : lightTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, injectCSSVariables]);

  // Current active theme
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Hook to access theme context
 * 
 * @example
 * const { theme, isDark, setMode } = useTheme();
 * 
 * // Access a specific token
 * const primaryColor = theme.primary;
 * 
 * // Check dark mode
 * if (isDark) { ... }
 * 
 * // Change theme
 * setMode('dark');
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Get a CSS variable reference for use in inline styles
 * 
 * @example
 * const style = { color: cssVar('primary') }; // { color: 'var(--primary)' }
 */
export function cssVar(token: ThemeTokenKey): string {
  return `var(--${camelToKebab(token)})`;
}

/**
 * Get multiple CSS variables as a style object
 * 
 * @example
 * const style = cssVars({ 
 *   backgroundColor: 'card', 
 *   color: 'foreground' 
 * });
 * // { backgroundColor: 'var(--card)', color: 'var(--foreground)' }
 */
export function cssVars<T extends Record<string, ThemeTokenKey>>(
  mapping: T
): Record<keyof T, string> {
  const result: Record<string, string> = {};
  
  for (const [cssProp, token] of Object.entries(mapping)) {
    result[cssProp] = cssVar(token);
  }
  
  return result as Record<keyof T, string>;
}
