// "Who is this?": takes the sign-in the page sends with each request, and answers who is asking.
// The sign-in is either our server's own (from a username and password, see own-sign-in.js) or Google's.
// This is the only file that talks to Google.
// Most tests swap it for the pretend one in __mocks__/who-is-this.js.
const { OAuth2Client } = require('google-auth-library');
const tidyEmail = require('../tidy-email');
const ROLE = require('./role');
const friendDao = require('../friends/friend.dao');
const ownSignIn = require('./own-sign-in');

const google = new OAuth2Client();

// Asks Google whether this sign-in is real, recent, and made for my app (the client id).
// Hands back the email Google checked, or '' if Google says no
async function checkedEmail(signIn) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return ''; // without it, Google's library skips the "made for my app?" check, so let no one in
    // Google's keys for checking sign-ins. If Google can't be reached, that's a real breakdown,
    // so it isn't caught here: Express answers it, and the page says "Something went wrong" instead of signing me out
    await google.getFederatedSignonCertsAsync();
    try {
        const ticket = await google.verifyIdToken({ idToken: signIn, audience: clientId });
        const { email, email_verified } = ticket.getPayload();
        return email_verified ? tidyEmail(email) : ''; // an email Google hasn't checked could belong to anyone
    } catch {
        return ''; // made up, too old, or made for a different app
    }
}

// one of our own sign-ins: the friend whose id is inside it. Never the owner, because I only sign in with Google.
// Made up, over an hour old, or the friend is gone? Then it's nobody
async function friendFromOwnSignIn(signIn) {
    const friend = await friendDao.findById(ownSignIn.readSignIn(signIn));
    return friend ? { role: ROLE.FRIEND, friendId: friend.id, name: friend.name } : { role: ROLE.NOBODY };
}

// The answer is one of (see role.js):
//   { role: 'owner' }     my own Google email
//   { role: 'friend', friendId, name }  the Google email I added to a friend, like Sam, or a friend's password sign-in
//   { role: 'stranger' }  a real Google sign-in, but not an email on the list
//   { role: 'nobody' }    no sign-in, or one that's turned down (like an old one)
async function whoIsThis(signIn) {
    if (!signIn) return { role: ROLE.NOBODY };
    if (ownSignIn.isOurs(signIn)) return friendFromOwnSignIn(signIn); // ours never goes to Google
    const email = await checkedEmail(signIn);
    if (!email) return { role: ROLE.NOBODY };
    const ownerEmail = tidyEmail(process.env.OWNER_EMAIL);
    if (ownerEmail && email === ownerEmail) return { role: ROLE.OWNER }; // ownerEmail && : with no owner email set, nobody is the owner
    // friends' emails are saved tidied too, so "Sam@Gmail.com" from Google finds Sam
    const friend = await friendDao.findByEmail(email);
    if (friend) return { role: ROLE.FRIEND, friendId: friend.id, name: friend.name };
    return { role: ROLE.STRANGER };
}

module.exports = whoIsThis;
