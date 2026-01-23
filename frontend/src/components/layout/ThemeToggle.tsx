import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

/**
 * ThemeToggle Component
 * 
 * Toggles between light, dark, and system themes.
 * Persists preference to localStorage.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('ribbit-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemPrefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }

    localStorage.setItem('ribbit-theme', theme);
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'system':
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System theme';
    }
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg text-topbar-foreground/70 hover:text-topbar-foreground hover:bg-topbar-hover transition-all duration-200"
        aria-label="Toggle theme"
      >
        <Monitor className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg text-topbar-foreground/70 hover:text-topbar-foreground hover:bg-topbar-hover transition-all duration-200 hover:scale-110 active:scale-95"
      aria-label={getLabel()}
      title={getLabel()}
    >
      <span className="block transition-transform duration-200 hover:rotate-12">
        {getIcon()}
      </span>
    </button>
  );
}
