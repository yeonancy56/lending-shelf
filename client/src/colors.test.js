// Checks that each color is written once, as a day and night pair, that the words on every book spine
// stay easy to read in both, and that night is the black-and-white "Charcoal library" look.
// It reads the colors straight from index.css, so changing a color there is checked too.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

// the file without its comments, so an old color in a comment can't be picked up
const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const WORDS = ['--spine-title', '--spine-author']; // the book's name, and the author under it
const EASY_TO_READ = 4.5; // the usual rule for normal-size words
const PLAIN_HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i; // like #fff or #3f6a3a, the only way this test can read a color

// every "--name: light-dark(day, night);" in the :root at the top: each color is written once, as a day and night pair
const PAIR = /(--[\w-]+)\s*:\s*light-dark\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)\s*;/g;
const pairs = [...(css.match(/^:root\s*\{([^}]*)\}/m)?.[1] ?? '').matchAll(PAIR)];
const light = Object.fromEntries(pairs.map(([, name, day]) => [name, day]));
const dark = Object.fromEntries(pairs.map(([, name, , night]) => [name, night]));

// the spines are --spine-green, --spine-rust, ... however many index.css has. The two word colors also start with --spine-, so leave them out.
// Any other --spine- name counts as a spine, so a new color for words on a spine must go in WORDS
const SPINES = Object.keys(light).filter((name) => name.startsWith('--spine-') && !WORDS.includes(name));

// #fff and #ffffff are the same color: always give back the 6-letter one, without the #
function sixLetters(hex) {
    const h = hex.slice(1);
    return h.length === 3 ? [...h].map((c) => c + c).join('') : h;
}

// how bright a color looks to the eye, from 0 (black) to 1 (white)
function brightness(hex) {
    const h = sixLetters(hex);
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

// a color written twice (like a night copy in another block) could drift apart, so each one is written exactly once, as a pair
test('every color is written once, as a day and night pair, in the :root at the top', () => {
    const everyColor = [...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]);
    expect(pairs.length).toBeGreaterThan(0);
    expect(everyColor.sort()).toEqual(Object.keys(light).sort());
});

// a color written another way, like rgb(...), fails here instead of being skipped
for (const [mode, colors] of [['light', light], ['dark', dark]]) {
    test(`${mode} mode: every color is written like #3f6a3a, so this test can read it`, () => {
        for (const [name, value] of Object.entries(colors)) expect(value, `${name} in ${mode} mode`).toMatch(PLAIN_HEX);
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
    const h = sixLetters(hex);
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

// the darkest spine (like Matilda's) must not blend into the charcoal page
test('dark mode: every spine is lighter than the page', () => {
    for (const spine of SPINES) {
        expect(brightness(dark[spine]), `${spine} is ${dark[spine]}`).toBeGreaterThan(brightness(dark['--page']));
    }
});
