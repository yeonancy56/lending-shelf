// Tests the real "who is this?", with Google swapped for a pretend one.
// The test says what Google would answer for a sign-in, and checks who the app thinks it is.
jest.mock('google-auth-library');
const { OAuth2Client } = require('google-auth-library');

// what the pretend Google answers. Set before each test
let googleSays;
OAuth2Client.prototype.verifyIdToken = jest.fn(async (options) => googleSays(options));

const whoIsThis = require('./who-is-this');

// Google checked the sign-in and says it belongs to this email
function googleChecked(email, emailVerified = true) {
    return () => ({ getPayload: () => ({ email, email_verified: emailVerified }) });
}

beforeEach(() => {
    process.env.OWNER_EMAIL = 'nancy@gmail.com';
    process.env.GOOGLE_CLIENT_ID = 'my-app-id';
});

test('my own Google email is the owner', async () => {
    googleSays = googleChecked('nancy@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ who: 'owner' });
});

test('capitals and spaces don\'t matter, in the setting or from Google', async () => {
    process.env.OWNER_EMAIL = ' Nancy@Gmail.com ';
    googleSays = googleChecked('NANCY@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ who: 'owner' });
});

test('anyone else\'s Google email is a stranger', async () => {
    googleSays = googleChecked('someone@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ who: 'stranger' });
});

test('asks Google about this sign-in, made for my app', async () => {
    googleSays = googleChecked('nancy@gmail.com');

    await whoIsThis('a-sign-in');

    expect(OAuth2Client.prototype.verifyIdToken).toHaveBeenCalledWith({ idToken: 'a-sign-in', audience: 'my-app-id' });
});

test('a sign-in Google turns down (old, made up, or for another app) is nobody', async () => {
    googleSays = () => { throw new Error('Token used too late'); };

    expect(await whoIsThis('an-old-sign-in')).toEqual({ who: 'nobody' });
});

test('an email Google hasn\'t checked doesn\'t count, even if it\'s mine', async () => {
    googleSays = googleChecked('nancy@gmail.com', false);

    expect(await whoIsThis('a-sign-in')).toEqual({ who: 'nobody' });
});

test('no sign-in at all is nobody, without asking Google', async () => {
    OAuth2Client.prototype.verifyIdToken.mockClear();

    expect(await whoIsThis('')).toEqual({ who: 'nobody' });
    expect(OAuth2Client.prototype.verifyIdToken).not.toHaveBeenCalled();
});

test('with no owner email in the settings, nobody is the owner', async () => {
    delete process.env.OWNER_EMAIL;
    googleSays = googleChecked('nancy@gmail.com');

    expect(await whoIsThis('a-sign-in')).toEqual({ who: 'stranger' });
});
