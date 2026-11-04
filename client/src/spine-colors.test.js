// Checks that the words on every book spine stay easy to read, in light and dark mode,
// and that dark mode is the black-and-white "Charcoal library" look.
// It reads the colors straight from index.css, so changing a color there is checked too.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

// the file without its comments, so an old color in a comment can't be picked up
const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const WORDS = ['--spine-title', '--spine-author']; // the book's name, and the author under it
const EASY_TO_READ = 4.5; // the usual rule for normal-size words
const PLAIN_HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i; // like #fff or #3f6a3a, the only way this test can read a color

// every "--name: value;" inside one :root { ... } block
function colorsIn(block) {
    return Object.fromEntries([...(block ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

// light mode is the :root at the top. Dark mode starts from light and swaps in what its own :root changes
const lightOwn = colorsIn(css.match(/^:root\s*\{([^}]*)\}/m)?.[1]);
const darkOwn = colorsIn(css.match(/@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*\{\s*:root\s*\{([^}]*)\}/)?.[1]);
const light = lightOwn;
const dark = { ...light, ...darkOwn };

// the spines are --spine-green, --spine-rust, ... however many index.css has. The two word colors also start with --spine-, so leave them out.
// Any other --spine- name counts as a spine, so a new color for words on a spine must go in WORDS
const SPINES = Object.keys(light).filter((name) => name.startsWith('--spine-') && !WORDS.includes(name));

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

test('the contrast formula gives the known answers: black on white is 21, and gray #777 on white just misses 4.5', () => {
    expect(contrast('#000', '#fff')).toBeCloseTo(21);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
});

test('finds at least the three spines: green, rust and deep gold', () => {
    expect(SPINES.length).toBeGreaterThanOrEqual(3);
});

test('finds dark mode\'s own spine colors, not just the light ones', () => {
    expect(Object.keys(darkOwn).some((name) => name.startsWith('--spine-'))).toBe(true);
});

// a spine or word color written another way, like rgb(...), fails here instead of being skipped
for (const [mode, own] of [['light', lightOwn], ['dark', darkOwn]]) {
    test(`${mode} mode: every spine and word color is written like #3f6a3a, so this test can read it`, () => {
        for (const [name, value] of Object.entries(own)) {
            if (name.startsWith('--spine-')) expect(value, `${name} in ${mode} mode`).toMatch(PLAIN_HEX);
        }
    });
}

for (const [mode, colors] of [['light', light], ['dark', dark]]) {
    for (const spine of SPINES) {
        for (const words of WORDS) {
            test(`${mode} mode: ${words} words on the ${spine} spine are easy to read (at least ${EASY_TO_READ}:1)`, () => {
                expect(colors[spine], spine).toMatch(PLAIN_HEX);
                expect(colors[words], words).toMatch(PLAIN_HEX);
                expect(contrast(colors[words], colors[spine])).toBeGreaterThanOrEqual(EASY_TO_READ);
            });
        }
    }
}

// a grey has the same amount of red, green and blue, like #3a3a3a
function isGrey(hex) {
    let h = hex.slice(1);
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return h.slice(0, 2) === h.slice(2, 4) && h.slice(2, 4) === h.slice(4, 6);
}

test('the grey check knows a grey from a colour', () => {
    expect(isGrey('#3a3a3a')).toBe(true);
    expect(isGrey('#fff')).toBe(true);
    expect(isGrey('#3c5a38')).toBe(false); // the old dark green spine
});

// the page, shelf board, words, spines and buttons. Only the error red is left out
test('dark mode: every color is a grey, except the error red', () => {
    for (const [name, value] of Object.entries(dark)) {
        if (name === '--error') continue;
        expect(value, name).toMatch(PLAIN_HEX);
        expect(isGrey(value), `${name} is ${value}`).toBe(true);
    }
});

// a grey error would look like any other line, so I could miss that Sam's book is overdue
test('dark mode: the error color is not a grey', () => {
    expect(dark['--error']).toMatch(PLAIN_HEX);
    expect(isGrey(dark['--error']), `--error is ${dark['--error']}`).toBe(false);
});
