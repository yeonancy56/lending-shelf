// Tests the real "who is this?", with Google swapped for a pretend one.
// The test says what Google would answer for a sign-in, and checks who the app thinks it is.
jest.mock('google-auth-library');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// what the pretend Google answers. Set before each test
let googleSays;
OAuth2Client.prototype.verifyIdToken = jest.fn(async (options) => googleSays(options));

const whoIsThis = require('./who-is-this');
const Friend = require('../friends/friend.model');
const testDb = require('../../test-db'); // friends' emails live in the database, so this uses the pretend one

beforeAll(testDb.start, 60000);
afterAll(testDb.stop);

// Google checked the sign-in and says it belongs to this email
function googleChecked(email, emailVerified = true) {
    return () => ({ getPayload: () => ({ email, email_verified: emailVerified }) });
}

beforeEach(async () => {
    await testDb.clear();
    process.env.OWNER_EMAIL = 'nancy@gmail.com';
    process.env.GOOGLE_CLIENT_ID = 'my-app-id';
});

test('my own Google email is the owner', async () => {
    googleSays = googleChecked('nancy@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ role: 'owner' });
});

test('capitals and spaces don\'t matter, in the setting or from Google', async () => {
    process.env.OWNER_EMAIL = ' Nancy@Gmail.com ';
    googleSays = googleChecked('NANCY@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ role: 'owner' });
});

test('anyone else\'s Google email is a stranger', async () => {
    googleSays = googleChecked('someone@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ role: 'stranger' });
});

test('the Google email I added to Sam is Sam, a friend, with Sam\'s id and name', async () => {
    const sam = await Friend.create({ name: 'Sam', email: 'sam@gmail.com' });
    googleSays = googleChecked('Sam@Gmail.com'); // capitals don't matter here either

    expect(await whoIsThis('a-sign-in')).toEqual({ role: 'friend', friendId: sam.id, name: 'Sam' });
});

test('my own email is still the owner, never a friend', async () => {
    // the friend form refuses my email, but even if one slipped in, I'm the owner first
    await Friend.collection.insertOne({ name: 'Sneaky', email: 'nancy@gmail.com' });
    googleSays = googleChecked('nancy@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ role: 'owner' });
});

test('asks Google about this sign-in, made for my app', async () => {
    googleSays = googleChecked('nancy@gmail.com');

    await whoIsThis('a-sign-in');

    expect(OAuth2Client.prototype.verifyIdToken).toHaveBeenCalledWith({ idToken: 'a-sign-in', audience: 'my-app-id' });
});

test('a Google sign-in still goes to Google, now that our server makes sign-ins of the same kind too', async () => {
    // a real Google sign-in is a signed code like ours, but Google's name is written inside it
    const fromGoogle = jwt.sign({ email: 'nancy@gmail.com' }, 'googles-own-key', { issuer: 'https://accounts.google.com' });
    googleSays = googleChecked('nancy@gmail.com');
    process.env.SIGN_IN_SECRET = 'a-long-made-up-secret-for-tests';

    expect(await whoIsThis(fromGoogle)).toEqual({ role: 'owner' });
    expect(OAuth2Client.prototype.verifyIdToken).toHaveBeenCalledWith({ idToken: fromGoogle, audience: 'my-app-id' });
});

test('a sign-in Google turns down (old, made up, or for another app) is nobody', async () => {
    googleSays = () => { throw new Error('Token used too late'); };

    expect(await whoIsThis('an-old-sign-in')).toEqual({ role: 'nobody' });
});

test('an email Google hasn\'t checked doesn\'t count, even if it\'s mine', async () => {
    googleSays = googleChecked('nancy@gmail.com', false);

    expect(await whoIsThis('a-sign-in')).toEqual({ role: 'nobody' });
});

test('no sign-in at all is nobody, without asking Google', async () => {
    OAuth2Client.prototype.verifyIdToken.mockClear();

    expect(await whoIsThis('')).toEqual({ role: 'nobody' });
    expect(OAuth2Client.prototype.verifyIdToken).not.toHaveBeenCalled();
});

test('with no owner email in the settings, nobody is the owner', async () => {
    delete process.env.OWNER_EMAIL;
    googleSays = googleChecked('nancy@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ role: 'stranger' });
});

test('with no client id in the settings, nobody gets in, not even me', async () => {
    // without it, Google's library skips the "made for my app?" check,
    // so a sign-in made for some other website would work here too
    delete process.env.GOOGLE_CLIENT_ID;
    googleSays = googleChecked('nancy@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ role: 'nobody' });
});

test('when Google can\'t be reached, it\'s a real breakdown, not a sign-out', async () => {
    // like a wifi hiccup on Render: the page should say "Something went wrong", not send me back to the button
    OAuth2Client.prototype.getFederatedSignonCertsAsync = jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    googleSays = googleChecked('nancy@gmail.com');

    await expect(whoIsThis('a-sign-in')).rejects.toThrow('ENOTFOUND');
    OAuth2Client.prototype.getFederatedSignonCertsAsync = jest.fn(); // Google is back for the other tests
});
