// The pretend "who is this?" for tests. It never talks to Google:
// it reads a made-up sign-in instead, so a test can be the owner or a stranger just by picking one.
const PRETEND_SIGN_INS = {
    'owner-sign-in': { who: 'owner' },
    'stranger-sign-in': { who: 'stranger' },
};

async function whoIsThis(signIn) {
    return PRETEND_SIGN_INS[signIn] || { who: 'nobody' }; // anything else is like an old or made-up sign-in
}

module.exports = whoIsThis;
