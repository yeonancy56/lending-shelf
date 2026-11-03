// Checks that the words on every book spine stay easy to read, in light and dark mode.
// It reads the colors straight from index.css, so changing a color there is checked too.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8');

const SPINES = ['--spine-1', '--spine-2', '--spine-3']; // green, rust, deep gold
const WORDS = ['--spine-title', '--spine-author']; // the book's name, and the author under it
const EASY_TO_READ = 4.5; // the usual rule for normal-size words

// every "--name: #abc123;" in a piece of the file
function colorsIn(text) {
    return Object.fromEntries([...text.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{3,6})\b/gi)].map((m) => [m[1], m[2]]));
}

// light mode is the first :root. Dark mode starts from light and swaps in what the dark block changes
const darkStart = css.indexOf('@media (prefers-color-scheme: dark)');
const darkEnd = css.indexOf('\n}\n', darkStart);
const light = colorsIn(css.slice(0, darkStart));
const dark = { ...light, ...colorsIn(css.slice(darkStart, darkEnd)) };

// how bright a color looks to the eye, from 0 (black) to 1 (white)
function brightness(hex) {
    let h = hex.slice(1);
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const [r, g, b] = [0, 2, 4].map((i) => {
        const c = parseInt(h.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// from 1 (same color, can't read) to 21 (black on white)
function contrast(a, b) {
    const [hi, lo] = [brightness(a), brightness(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

test('the contrast sum gives the known answers: black on white is 21, and gray #777 on white just misses 4.5', () => {
    expect(contrast('#000', '#fff')).toBeCloseTo(21);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
});

test('dark mode finds its own spine colors, not just the light ones', () => {
    expect(dark['--spine-1']).not.toBe(light['--spine-1']);
});

for (const [mode, colors] of [['light', light], ['dark', dark]]) {
    for (const spine of SPINES) {
        for (const words of WORDS) {
            test(`${mode} mode: ${words} words on the ${spine} spine are easy to read (at least ${EASY_TO_READ}:1)`, () => {
                expect(colors[spine]).toMatch(/^#/);
                expect(colors[words]).toMatch(/^#/);
                expect(contrast(colors[words], colors[spine])).toBeGreaterThanOrEqual(EASY_TO_READ);
            });
        }
    }
}
