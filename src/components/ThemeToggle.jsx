import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getTheme, setTheme } from '../lib/theme';

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
  };

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 rounded-full flex items-center justify-center
        bg-secondary hover:bg-accent transition-all duration-300
        text-foreground border border-border"
      aria-label="Toggle theme"
    >
      <Sun className={`w-4 h-4 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`w-4 h-4 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
    </button>
  );
}