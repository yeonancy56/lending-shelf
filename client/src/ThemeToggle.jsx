// the Day / Night button in the top corner of every page. It sets data-theme on the page,
// and index.css uses that to pick the day or night half of each color
import { useLayoutEffect, useState } from 'react';

const SAVED = 'theme'; // where my pick is kept in the browser

// the look to start with: my last pick, or else whatever the computer is set to
function firstTheme() {
  try {
    const saved = localStorage.getItem(SAVED);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // the browser won't let us look (like a private window): just match the computer
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(firstTheme);

  // before the page is painted, so it never flashes the wrong look
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function flip() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(SAVED, next);
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
