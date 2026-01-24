import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../../theme';

/**
 * ThemeToggle Component
 * 
 * Toggles between light, dark, and system themes.
 * Uses the global ThemeProvider for consistent theming.
 */
export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Track mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const themes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % themes.length;
    setMode(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'system':
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    switch (mode) {
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
