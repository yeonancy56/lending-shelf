// the Day / Night button in the top corner of every page. Once I pick, it sets data-theme on the page,
// and index.css uses that to pick the day or night half of each color. With no pick, the page follows the computer
import { useEffect, useLayoutEffect, useState } from 'react';

const THEME_KEY = 'theme'; // the name my pick is saved under in the browser. index.html reads it too
const COMPUTER_IS_DARK = '(prefers-color-scheme: dark)';

// my last pick, or null if I haven't picked (or the browser won't let us look, like a private window)
function savedPick() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // can't look, so it's the same as no pick
  }
  return null;
}

const computerTheme = () => (matchMedia(COMPUTER_IS_DARK).matches ? 'dark' : 'light');

export default function ThemeToggle() {
  const [pick, setPick] = useState(savedPick);
  const [computer, setComputer] = useState(computerTheme);
  const theme = pick ?? computer;

  // keep up if the computer switches while the page is open, so the label stays right
  useEffect(() => {
    const setting = matchMedia(COMPUTER_IS_DARK);
    const onChange = (e) => setComputer(e.matches ? 'dark' : 'light');
    setting.addEventListener('change', onChange);
    return () => setting.removeEventListener('change', onChange);
  }, []);

  // before the page is painted, so it never flashes the wrong look
  useLayoutEffect(() => {
    if (pick) document.documentElement.dataset.theme = pick;
  }, [pick]);

  function flip() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setPick(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // can't remember it this time, but the page still switches
    }
  }

  // the emoji is just a picture, so screen readers only hear "Night" or "Day"
  return (
    <button className="theme-toggle" onClick={flip}>
      {theme === 'dark' ? <><span aria-hidden="true">☀️</span> Day</> : <><span aria-hidden="true">🌙</span> Night</>}
    </button>
  );
}
