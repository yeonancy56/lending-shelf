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
| Sign-in | Google | Checks who is signing in. Only the email in `OWNER_EMAIL` gets in |

Merging a PR into `main` updates both by itself. Vercel rebuilds the page, and Render waits for CI's tests to pass before putting the new server online.

### Running it on your computer

1. `cd server`, copy `.env.example` to `.env`, and fill in `MONGO_URL`, `OWNER_EMAIL` and `GOOGLE_CLIENT_ID`. Then run `npm run dev`. It restarts the server by itself whenever you save a server code file. (After changing `.env`, stop it with Ctrl+C and start it again yourself.)
2. In a second terminal: `cd client`, copy `.env.example` to `.env.local` and fill in `VITE_GOOGLE_CLIENT_ID`. Then run `npm run dev`. Vite passes `/api` on to the server at `localhost:4000`.

## Setting up Google sign-in

Only I can do this part, because it happens in my own Google account. I do it once.

### 1. Make the client id in Google's console

1. Go to https://console.cloud.google.com and sign in with my Google account.
2. At the top, click the project picker, then **New project**. Name it `Lending Shelf` and click **Create**. Make sure it's the selected project.
3. In the menu, open **APIs & Services → OAuth consent screen** (it may be called **Google Auth Platform**). Click **Get started**.
   - App name: `Lending Shelf`. Support email: my email.
   - Audience: **External**.
   - Contact email: my email. Agree, and click **Create**.
4. Open **Audience** and click **Publish app**, then confirm. (While it's "Testing", only people I list there can even reach the sign-in, so I couldn't check that a stranger is turned away. The app only asks for name and email, so Google doesn't need to review it.)
5. Open **Clients** (or **Credentials → Create credentials → OAuth client ID**).
   - Application type: **Web application**. Name: `Lending Shelf page`.
   - **Authorized JavaScript origins**, add all three:
     - `http://localhost`
     - `http://localhost:5173`
     - `https://lending-shelf.vercel.app`
   - Leave **Authorized redirect URIs** empty. Click **Create**.
6. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`). It isn't a secret, so it's fine in settings. If Google also shows a client secret, I don't need it.

### 2. Put the settings in place

| Where | Setting | Value |
| --- | --- | --- |
| `server/.env` | `OWNER_EMAIL` | my Google email |
| `server/.env` | `GOOGLE_CLIENT_ID` | the client id |
| `client/.env.local` | `VITE_GOOGLE_CLIENT_ID` | the same client id |
| Render → lending-shelf → Environment | `OWNER_EMAIL` and `GOOGLE_CLIENT_ID` | same as `server/.env` |
| Vercel → lending-shelf → Settings → Environment Variables | `VITE_GOOGLE_CLIENT_ID` | the client id |

Do Render and Vercel **before** merging the sign-in PR. Without `OWNER_EMAIL`, the live server turns everyone away, me included. After adding the Vercel setting, redeploy the page (Deployments → ⋯ → Redeploy), because the page only reads it while being built.

### 3. Check it by hand

1. Start the server and the page (see "Running it on your computer"). Restart both if they were already running, so they read the new settings.
2. Open http://localhost:5173. I see only the Google button.
3. Sign in with my own Google account. My shelf shows, the same as before.
4. Reload the page. I'm still signed in.
5. Click **Sign out**. I'm back at the Google button.
6. Sign in with a different Google account. I see "You're not on the list." and no books.
7. Do steps 2 to 6 once more on https://lending-shelf.vercel.app after merging.

A sign-in lasts about an hour. After that, the next thing I do sends me back to the Google button, and I sign in again.
