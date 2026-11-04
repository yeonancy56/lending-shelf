// Checks the Day / Night button: it switches the look, remembers my pick, and matches the computer until I pick.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ThemeToggle from './ThemeToggle';

// a pretend computer setting: dark or not. The pretend browser doesn't have one of its own.
// Calling it again while the page is open is like switching the computer's setting
let tellPage = () => {};
function computerIsDark(dark) {
  const setting = { matches: dark, addEventListener: (_, listener) => { tellPage = listener; }, removeEventListener: () => {} };
  vi.stubGlobal('matchMedia', () => setting);
  tellPage(setting);
}

// the look the page is showing right now: my pick if there is one, or else the computer's
const look = () => document.documentElement.dataset.theme ?? (matchMedia().matches ? 'dark' : 'light');

beforeEach(() => {
  tellPage = () => {};
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  computerIsDark(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('clicking the button switches between the day and night look, and the label says where it goes next', async () => {
  render(<ThemeToggle />);
  expect(look()).toBe('light');
  await userEvent.click(screen.getByRole('button', { name: 'Night' }));
  expect(look()).toBe('dark');
  await userEvent.click(screen.getByRole('button', { name: 'Day' }));
  expect(look()).toBe('light');
});

test('with no pick saved, the page matches the computer: night when the computer is dark', () => {
  computerIsDark(true);
  render(<ThemeToggle />);
  expect(look()).toBe('dark');
  expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
});

test('my pick wins over the computer, and is still there after a reload', async () => {
  computerIsDark(true);
  const { unmount } = render(<ThemeToggle />);
  await userEvent.click(screen.getByRole('button', { name: 'Day' }));
  unmount(); // a pretend reload: the page starts again from nothing
  delete document.documentElement.dataset.theme;
  render(<ThemeToggle />);
  expect(look()).toBe('light');
});

test("if the browser can't remember (like a private window), the page matches the computer and the button still switches", async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage is blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage is blocked'); });
  render(<ThemeToggle />);
  expect(look()).toBe('light');
  await userEvent.click(screen.getByRole('button', { name: 'Night' }));
  expect(look()).toBe('dark');
});

test('with no pick saved, the page keeps following the computer while it is open', () => {
  render(<ThemeToggle />);
  act(() => computerIsDark(true));
  expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
  expect(look()).toBe('dark');
});
