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

// what the server would say to each question my shelf asks. Anything else gets "not found"
const ANSWERS = {
  '/me': { who: 'owner' },
  '/books': [longBook, dune, matilda],
  '/friends': [sam, ana],
  '/loans': [samsLoan],
  '/requests': [anasRequest],
};

// the pretend server's answer to one address, like '/books'
export function pictureAnswer(path) {
  if (path in ANSWERS) return { status: 200, body: ANSWERS[path] };
  return { status: 404, body: { error: 'Picture mode only shows the page' } };
}

// /phone shows my shelf in a frame as wide as a phone (375), with no gaps around it.
// Chrome's picture-taker can't make its own window narrower than 500, but it can picture this frame
const PHONE_WIDTH = 375;
const PHONE_HEIGHT = 2400; // keep in step with --window-size in CLAUDE.md rule 6, or the bottom is left out of the picture
const PHONE_PAGE = `<!doctype html><title>Phone width</title>
<body style="margin:0"><iframe src="/" width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" style="border:0;display:block"></iframe></body>`;

// the Vite plugin: answers /api with the pretend answers, and starts the page already signed in
export function pictureMode() {
  return {
    name: 'picture-mode',
    apply: 'serve', // only while running on my computer, never in the built app
    configureServer(server) {
      server.middlewares.use('/phone', (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(PHONE_PAGE);
      });
      server.middlewares.use('/api', (req, res) => {
        const { status, body } = pictureAnswer(req.url.split('?')[0]);
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      });
    },
    // a pretend sign-in in the browser, so the page skips the Google button
    transformIndexHtml() {
      return [{ tag: 'script', children: `localStorage.setItem('${SIGN_IN_KEY}', 'picture-mode');`, injectTo: 'head-prepend' }];
    },
  };
}
