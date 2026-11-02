// PROTOTYPE, throw me away. Lives only on the prototype/cozy-looks branch.
// Three cozy looks for the real Lending Shelf page, switchable with ?variant=A, B or C.
// This bar picks the look and puts it on <html data-look="...">, and looks.prototype.css does the rest.
import { useEffect, useState } from 'react';
import './looks.prototype.css';

const LOOKS = [
  { key: 'A', name: 'Library cards' },
  { key: 'B', name: 'Notebook' },
  { key: 'C', name: 'Wooden shelf' },
];

function startingLook() {
  const fromUrl = new URLSearchParams(window.location.search).get('variant');
  return LOOKS.some((look) => look.key === fromUrl) ? fromUrl : 'A';
}

export default function PrototypeSwitcher() {
  const [current, setCurrent] = useState(startingLook);
  const index = LOOKS.findIndex((look) => look.key === current);

  function go(step) {
    setCurrent(LOOKS[(index + step + LOOKS.length) % LOOKS.length].key);
  }

  // put the look on the page and in the address bar, so a reload keeps it
  useEffect(() => {
    document.documentElement.dataset.look = current.toLowerCase();
    const url = new URL(window.location.href);
    url.searchParams.set('variant', current);
    window.history.replaceState(null, '', url);
  }, [current]);

  // ← and → also switch, but not while typing in a box
  useEffect(() => {
    function onKey(e) {
      if (e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="prototype-switcher">
      <button type="button" onClick={() => go(-1)} aria-label="Previous look">←</button>
      <span>{current} ({LOOKS[index].name})</span>
      <button type="button" onClick={() => go(1)} aria-label="Next look">→</button>
    </div>
  );
}
