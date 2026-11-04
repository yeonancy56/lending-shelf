import { describe, it, expect } from 'vitest';
import { pictureAnswer, pictureMode } from './picture-mode';

// what Sam's shelf says about one book: "at home", "lent out" or "asked for"
const stateOnSamsShelf = (bookId) => pictureAnswer('/shelf', 'friend').body.find((book) => book._id === bookId).state;

describe('picture mode', () => {
  it('says I am the owner, so the page shows my shelf', () => {
    expect(pictureAnswer('/me')).toEqual({ status: 200, body: { who: 'owner' } });
  });

  it('has a book with a long name, to see if the spine cuts it off', () => {
    const titles = pictureAnswer('/books').body.map((book) => book.title);
    expect(titles.some((title) => title.length > 60)).toBe(true);
  });

  it('has a request for a book with a long name, to see if the Requests list cuts it off', () => {
    const titles = pictureAnswer('/requests').body.map((request) => request.book.title);
    expect(titles.some((title) => title.length > 60)).toBe(true);
  });

  it('answers every list my shelf asks for when it opens', () => {
    for (const path of ['/books', '/friends', '/loans', '/requests']) {
      expect(pictureAnswer(path).status).toBe(200);
    }
  });

  it('Sam\'s panel on my page has the long name in what he has now, his past loans and his requests', () => {
    const isLong = (item) => item.book.title.length > 60;
    const loans = pictureAnswer('/friends/friend-sam/loans');
    const requests = pictureAnswer('/friends/friend-sam/requests');
    expect(loans.body.active.some(isLong)).toBe(true);
    expect(loans.body.returned.some(isLong)).toBe(true);
    expect(requests.body.some(isLong)).toBe(true);
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

  it('as Sam, his own past loans have the long name too', () => {
    const { returned } = pictureAnswer('/me/loans', 'friend').body;
    expect(returned.some((loan) => loan.book.title.length > 60)).toBe(true);
  });

  it('as Sam, he has a book now, and his shelf says it\'s "lent out"', () => {
    const { active } = pictureAnswer('/me/loans', 'friend').body;
    expect(active).toHaveLength(1);
    expect(stateOnSamsShelf(active[0].book._id)).toBe('lent out');
  });

  it('as Sam, he has a waiting request, and his shelf says that book is "asked for"', () => {
    const [request] = pictureAnswer('/me/requests', 'friend').body;
    expect(request.status).toBe('waiting'); // so the picture shows its Cancel button
    expect(stateOnSamsShelf(request.book._id)).toBe('asked for');
  });

  it('on both pages, has a copy with an average from 2 ratings, one with "1 rating", and one with none', () => {
    for (const books of [pictureAnswer('/books').body, pictureAnswer('/shelf', 'friend').body]) {
      const counts = books.map((book) => book.ratingCount);
      expect(counts).toEqual(expect.arrayContaining([2, 1, undefined])); // in any order
    }
  });

  it('only one friend asks for a book at a time, so Sam never asks for the book Ana asked for', () => {
    const [anasRequest] = pictureAnswer('/requests').body;
    const [samsRequest] = pictureAnswer('/me/requests', 'friend').body;
    expect(samsRequest.book._id).not.toBe(anasRequest.book._id);
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
