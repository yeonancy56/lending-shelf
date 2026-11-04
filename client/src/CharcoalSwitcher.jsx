// PROTOTYPE, throw me away: the yellow bar at the bottom that flips between the three night looks.
// The look is kept in the address (?variant=B), so a reload or a shared link shows the same one.
import { useEffect, useState } from 'react';
import './charcoal-prototype.css';

const VARIANTS = { A: 'grey buttons', B: 'green buttons', C: 'light spines' };
const KEYS = Object.keys(VARIANTS);

export default function CharcoalSwitcher() {
  const [variant, setVariant] = useState(() => new URLSearchParams(location.search).get('variant') ?? 'A');

  useEffect(() => {
    document.documentElement.dataset.charcoal = variant;
    const params = new URLSearchParams(location.search);
    params.set('variant', variant);
    history.replaceState(null, '', `?${params}`);
  }, [variant]);

  const step = (by) => setVariant((v) => KEYS[(KEYS.indexOf(v) + by + KEYS.length) % KEYS.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, [contenteditable]')) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="charcoal-switcher">
      <button onClick={() => step(-1)}>←</button>
      <span>{variant} ({VARIANTS[variant]})</span>
      <button onClick={() => step(1)}>→</button>
    </div>
  );
}
