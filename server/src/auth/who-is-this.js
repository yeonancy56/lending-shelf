// "Who is this?": takes the Google sign-in the page sends with each request,
// and answers who is asking. This is the only file that talks to Google.
// Tests swap it for the pretend one in __mocks__/who-is-this.js.
const { OAuth2Client } = require('google-auth-library');

const google = new OAuth2Client();

// "Nancy@Gmail.com " and "nancy@gmail.com" are the same email
function tidyEmail(email) {
    return (email || '').trim().toLowerCase();
}

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

// The answer is one of:
//   { who: 'owner' }     my own Google email
//   { who: 'stranger' }  a real Google sign-in, but not an email on the list
//   { who: 'nobody' }    no sign-in, or one Google turns down (like an old one)
async function whoIsThis(signIn) {
    if (!signIn) return { who: 'nobody' };
    const email = await checkedEmail(signIn);
    if (!email) return { who: 'nobody' };
    const ownerEmail = tidyEmail(process.env.OWNER_EMAIL);
    if (ownerEmail && email === ownerEmail) return { who: 'owner' }; // ownerEmail && : with no owner email set, nobody is the owner
    return { who: 'stranger' };
}

module.exports = whoIsThis;
