// Picture mode: `npm run picture` shows my shelf with pretend answers instead of the real server,
// so the review can open the page at phone width and take a picture without Google sign-in or a database.
// It only runs on my computer, and only in this mode. The real app never sees it.
import { SIGN_IN_KEY } from './src/api';

const longBook = {
  _id: 'book-long',
  title: 'The Strange Case of Dr Jekyll and Mr Hyde and Other Tales of Terror',
  author: 'Robert Louis Stevenson',
  copyNote: 'falling apart, from Grandma',
};
const dune = { _id: 'book-dune', title: 'Dune', author: 'Frank Herbert', copyNote: 'signed' };
const matilda = { _id: 'book-matilda', title: 'Matilda', author: 'Roald Dahl' };
const sam = { _id: 'friend-sam', name: 'Sam', email: 'sam@example.com' };
const ana = { _id: 'friend-ana', name: 'Ana' };

const lentAt = '2026-10-01T12:00:00.000Z';
const dueBack = '2026-10-15T12:00:00.000Z';
const samsLoan = { _id: 'loan-1', book: longBook, friend: sam, lentAt, dueBack, overdue: true };
const anasRequest = { _id: 'request-1', book: dune, friend: ana, status: 'waiting' };

// Sam's page: he's returned the long book (and rated it 4) and Matilda (not rated yet), so both get his stars
const samsPastLoans = [
  { _id: 'loan-2', book: longBook, lentAt: '2026-09-01T12:00:00.000Z', returnedAt: '2026-09-10T12:00:00.000Z' },
  { _id: 'loan-3', book: matilda, lentAt: '2026-08-01T12:00:00.000Z', returnedAt: '2026-08-12T12:00:00.000Z' },
];

// the averages: the long book has 2 ratings (Sam's 4 and someone's 5), Dune has 1, and Matilda has none
const longBookAverage = { averageStars: 4.5, ratingCount: 2 };
const duneAverage = { averageStars: 3, ratingCount: 1 };

// what the server would say to each question a page asks: mine (owner), or Sam's (friend).
// Anything else gets "not found"
const ANSWERS = {
  owner: {
    '/me': { who: 'owner' },
    '/books': [{ ...longBook, ...longBookAverage }, { ...dune, ...duneAverage }, matilda],
    '/friends': [sam, ana],
    '/loans': [samsLoan],
    '/requests': [anasRequest],
  },
  friend: {
    '/me': { who: 'friend', name: 'Sam' },
    '/shelf': [
      { ...longBook, state: 'at home', canRate: true, myStars: 4, ...longBookAverage },
      { ...dune, state: 'asked for', ...duneAverage },
      { ...matilda, state: 'at home', canRate: true },
    ],
    '/me/loans': { active: [], returned: samsPastLoans, limit: 3 },
    '/me/requests': [],
  },
};

// the pretend server's answer to one address, like '/books', for me (owner) or for Sam (friend)
export function pictureAnswer(path, who = 'owner') {
  if (path in ANSWERS[who]) return { status: 200, body: ANSWERS[who][path] };
  return { status: 404, body: { error: 'Picture mode only shows the page' } };
}

// the pretend sign-in for each page. /phone?as=friend pictures Sam's page, plain /phone pictures mine
const PRETEND_SIGN_IN = { owner: 'picture-mode', friend: 'picture-mode-friend' };
const AS_FRIEND = 'as=friend'; // the bit of the address that asks for Sam's page

// /phone shows my shelf in a frame as wide as a phone (375), with no gaps around it, and /phone?as=friend shows Sam's page.
// Chrome's picture-taker can't make its own window narrower than 500, but it can picture this frame
const PHONE_WIDTH = 375;
const PHONE_HEIGHT = 2400; // keep in step with --window-size in CLAUDE.md rule 6, or the bottom is left out of the picture
const phonePage = (search) => `<!doctype html><title>Phone width</title>
<body style="margin:0"><iframe src="/${search}" width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" style="border:0;display:block"></iframe></body>`;

// picture mode's own door. The browser keeps each door's saved things apart, so the pretend sign-in
// stays here and the real app on 5173 (Vite's usual door) never sees it. Keep in step with CLAUDE.md rule 6
const PICTURE_PORT = 5174;

// the Vite plugin: answers /api with the pretend answers, and starts the page already signed in
export function pictureMode() {
  return {
    name: 'picture-mode',
    apply: 'serve', // only while running on my computer, never in the built app
    // strictPort: stop if the door is busy, instead of quietly using another one the review won't look at
    config() {
      return { server: { port: PICTURE_PORT, strictPort: true } };
    },
    configureServer(server) {
      server.middlewares.use('/phone', (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(phonePage(req.url.includes(AS_FRIEND) ? '?' + AS_FRIEND : ''));
      });
      server.middlewares.use('/api', (req, res) => {
        // the page sends its pretend sign-in, so it's Sam's answers for Sam's page
        const who = req.headers.authorization === 'Bearer ' + PRETEND_SIGN_IN.friend ? 'friend' : 'owner';
        const { status, body } = pictureAnswer(req.url.split('?')[0], who);
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      });
    },
    // a pretend sign-in in the browser, so the page skips the Google button. Sam's when the address says ?as=friend
    transformIndexHtml() {
      const signIn = `location.search.includes('${AS_FRIEND}') ? '${PRETEND_SIGN_IN.friend}' : '${PRETEND_SIGN_IN.owner}'`;
      return [{ tag: 'script', children: `localStorage.setItem('${SIGN_IN_KEY}', ${signIn});`, injectTo: 'head-prepend' }];
    },
  };
}
