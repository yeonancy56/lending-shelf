// POST /sign-in: a friend like Gran types the username and password I gave her, and gets the server's own sign-in.
// It's open to anyone, like /health, because the person isn't signed in yet.
// Every wrong try gets the same words, so no one can find out which usernames exist.
const bcrypt = require('bcryptjs');
const friendDao = require('../friends/friend.dao');
const tidyUsername = require('../tidy-username');
const { makeSignIn, isSwitchedOn } = require('./own-sign-in');
const { tooManyTries, countWrongTry, forgetWrongTries } = require('./wrong-tries');

const WRONG = 'Wrong username or password.';
// a scramble no password matches. Checked when the username doesn't exist (or has no password),
// so a wrong username takes as long as a wrong password and doesn't give itself away
const NO_ONES_PASSWORD = bcrypt.hashSync('no friend has this password', 10);

// what was typed. Anything that isn't words counts as nothing typed
function words(value) {
    return typeof value === 'string' ? value : '';
}

async function signInWithPassword(req, res) {
    if (!isSwitchedOn()) return res.status(503).json({ error: "Password sign-in isn't set up yet." }); // no SIGN_IN_SECRET
    const username = tidyUsername(words(req.body?.username));
    const password = words(req.body?.password);
    if (tooManyTries(username)) return res.status(429).json({ error: 'Too many tries. Try again in 15 minutes.' });

    const friend = username ? await friendDao.findByUsername(username) : null;
    const right = await bcrypt.compare(password, friend?.passwordHash || NO_ONES_PASSWORD);
    if (!friend || !right) {
        countWrongTry(username);
        return res.status(401).json({ error: WRONG });
    }
    forgetWrongTries(username);
    res.json({ signIn: makeSignIn(friend.id) });
}

module.exports = signInWithPassword;
