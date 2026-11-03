// "Who is this?": takes the Google sign-in the page sends with each request,
// and answers who is asking. This is the only file that talks to Google.
// Tests swap it for the pretend one in __mocks__/who-is-this.js.
const { OAuth2Client } = require('google-auth-library');
const tidyEmail = require('../tidy-email');
const ROLE = require('./role');
const friendDao = require('../friends/friend.dao');

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

// The answer is one of (see role.js):
//   { role: 'owner' }     my own Google email
//   { role: 'friend', friendId, name }  the Google email I added to a friend, like Sam
//   { role: 'stranger' }  a real Google sign-in, but not an email on the list
//   { role: 'nobody' }    no sign-in, or one Google turns down (like an old one)
async function whoIsThis(signIn) {
    if (!signIn) return { role: ROLE.NOBODY };
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
