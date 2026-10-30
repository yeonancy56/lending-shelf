# Lending Shelf
The app is built to help book owners keep track of books they lend to friends. Some rules include: A book that’s already lent out can’t be lent again, A friend can have at most 3 books, A loan is overdue after 14 days and a  friend with an overdue book can’t borrow more.

I built this project to understand how a full web app works, not just to get one working - to understand Git, GitHub, different testing methods, and the MERN stack.

## Live app

**https://lending-shelf.vercel.app**

The first visit after a quiet spell can take **30–60 seconds** to show the books. The free server goes to sleep when nobody uses it, and wakes up on the first request.

## How it's hosted

| Part | Where | What it does |
| --- | --- | --- |
| Page (React, `client/`) | Vercel | Shows the page. Passes anything starting with `/api` on to the server (see `client/vercel.json`) |
| Server (Express, `server/`) | Render (https://lending-shelf.onrender.com) | Runs the lending rules. Uses the port Render gives it |
| Data | MongoDB Atlas | Stores books, friends and loans. Its link (with the password) lives only in Render's settings as `MONGO_URL` |

Merging a PR into `main` updates both by itself. Vercel rebuilds the page, and Render waits for CI's tests to pass before putting the new server online.

### Running it on your computer

1. `cd server`, copy `.env.example` to `.env`, and fill in `MONGO_URL`. Then run `node index.js`.
2. In a second terminal: `cd client`, then `npm run dev`. Vite passes `/api` on to the server at `localhost:4000`.
