import { describe, it, expect } from 'vitest';
import { pictureAnswer } from './picture-mode';

describe('picture mode', () => {
  it('says I am the owner, so the page shows my shelf', () => {
    expect(pictureAnswer('/me')).toEqual({ status: 200, body: { who: 'owner' } });
  });

  it('has a book with a long name, to see if the spine cuts it off', () => {
    const names = pictureAnswer('/books').body.map((book) => `${book.title} (${book.copyNote})`);
    expect(names.some((name) => name.length > 60)).toBe(true);
  });

  it('answers every list my shelf asks for when it opens', () => {
    for (const path of ['/books', '/friends', '/loans', '/requests']) {
      expect(pictureAnswer(path).status).toBe(200);
    }
  });

  it('says "not found" to anything else', () => {
    expect(pictureAnswer('/nothing-here').status).toBe(404);
  });
});
