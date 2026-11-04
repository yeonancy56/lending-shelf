// Checks the Day / Night button: it switches the look, remembers my pick, and matches the computer until I pick.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ThemeToggle from './ThemeToggle';

// a pretend computer setting: dark or not. The pretend browser doesn't have one of its own
function computerIsDark(dark) {
  vi.stubGlobal('matchMedia', (query) => ({ matches: dark && query === '(prefers-color-scheme: dark)' }));
}

// the look the page is showing right now
const look = () => document.documentElement.dataset.theme;

beforeEach(() => {
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
  await userEvent.click(screen.getByRole('button', { name: '🌙 Night' }));
  expect(look()).toBe('dark');
  await userEvent.click(screen.getByRole('button', { name: '☀️ Day' }));
  expect(look()).toBe('light');
});

test('with no pick saved, the page matches the computer: night when the computer is dark', () => {
  computerIsDark(true);
  render(<ThemeToggle />);
  expect(look()).toBe('dark');
  expect(screen.getByRole('button', { name: '☀️ Day' })).toBeInTheDocument();
});

test('my pick wins over the computer, and is still there after a reload', async () => {
  computerIsDark(true);
  const { unmount } = render(<ThemeToggle />);
  await userEvent.click(screen.getByRole('button', { name: '☀️ Day' }));
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
  await userEvent.click(screen.getByRole('button', { name: '🌙 Night' }));
  expect(look()).toBe('dark');
});
