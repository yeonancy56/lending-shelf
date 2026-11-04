// The server's own sign-in, for a friend who signed in with a username and password, like Gran.
// It's a signed code (a JWT) holding only the friend's id. Signed with SIGN_IN_SECRET from the settings,
// so no one can make one without the secret. It lasts 1 hour, like Google's.
const jwt = require('jsonwebtoken');

const ISSUER = 'lending-shelf'; // written inside each one, so "who is this?" can tell ours from Google's
const LASTS = '1h';

// the setting's secret, or '' when it's missing
function secret() {
    return process.env.SIGN_IN_SECRET || '';
}

// without the secret, password sign-in is switched off, the same rule as a missing Google client id
function isSwitchedOn() {
    return Boolean(secret());
}

// a new sign-in for Sam. Only called when password sign-in is switched on
function makeSignIn(friendId) {
    return jwt.sign({ friendId }, secret(), { issuer: ISSUER, expiresIn: LASTS });
}

// does this sign-in say it's one of ours? Only a look at what it says, not a check: readSignIn does the checking
function isOurs(signIn) {
    return jwt.decode(signIn)?.iss === ISSUER;
}

// the friend's id inside one of our sign-ins, or '' when it's made up, signed with another secret, or over an hour old
function readSignIn(signIn) {
    if (!isSwitchedOn()) return '';
    try {
        return jwt.verify(signIn, secret(), { issuer: ISSUER, algorithms: ['HS256'] }).friendId || '';
    } catch {
        return '';
    }
}

module.exports = { isSwitchedOn, makeSignIn, isOurs, readSignIn };
