// PROTOTYPE, throw me away: the Day / Night button in the top corner.
// It starts out matching the computer, and remembers what I pick for next time.
import { useEffect, useState } from 'react';
import './charcoal-prototype.css';

function firstTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // no saved choice (like a private window): just match the computer
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(firstTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function flip() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // can't remember it this time, but the page still switches
    }
  }

  return (
    <button className="theme-toggle" onClick={flip}>
      {theme === 'dark' ? '☀️ Day' : '🌙 Night'}
    </button>
  );
}
