import { describe, it, expect } from 'vitest';
import { pictureAnswer, pictureMode } from './picture-mode';

describe('picture mode', () => {
  it('says I am the owner, so the page shows my shelf', () => {
    expect(pictureAnswer('/me')).toEqual({ status: 200, body: { who: 'owner' } });
  });

  it('has a book with a long name, to see if the spine cuts it off', () => {
    const titles = pictureAnswer('/books').body.map((book) => book.title);
    expect(titles.some((title) => title.length > 60)).toBe(true);
  });

  it('answers every list my shelf asks for when it opens', () => {
    for (const path of ['/books', '/friends', '/loans', '/requests']) {
      expect(pictureAnswer(path).status).toBe(200);
    }
  });

  it('as Sam, says he is a friend, so the page shows his page', () => {
    expect(pictureAnswer('/me', 'friend')).toEqual({ status: 200, body: { who: 'friend', name: 'Sam' } });
  });

  it('as Sam, answers every list his page asks for when it opens', () => {
    for (const path of ['/shelf', '/me/loans', '/me/requests']) {
      expect(pictureAnswer(path, 'friend').status).toBe(200);
    }
  });

  it('as Sam, the shelf has a copy he rated, one he can rate but hasn\'t, and the long name with stars under it', () => {
    const shelf = pictureAnswer('/shelf', 'friend').body;
    expect(shelf.some((book) => book.canRate && book.myStars)).toBe(true);
    expect(shelf.some((book) => book.canRate && !book.myStars)).toBe(true);
    expect(shelf.some((book) => book.canRate && book.title.length > 60)).toBe(true);
  });

  it('on both pages, has a copy with an average from 2 ratings, one with "1 rating", and one with none', () => {
    for (const books of [pictureAnswer('/books').body, pictureAnswer('/shelf', 'friend').body]) {
      expect(books.map((book) => book.ratingCount)).toEqual([2, 1, undefined]);
    }
  });

  it('runs on its own door, not the real app\'s 5173, so its pretend sign-in stays out of the real app', () => {
    const { server } = pictureMode().config();
    expect(server.port).toBe(5174);
    expect(server.strictPort).toBe(true); // stops if 5174 is busy, instead of wandering to another door
  });

  it('says "not found" to anything else', () => {
    expect(pictureAnswer('/nothing-here').status).toBe(404);
  });
});
