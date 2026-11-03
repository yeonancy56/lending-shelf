// The pretend "who is this?" for tests. It never talks to Google:
// it reads a made-up sign-in instead, so a test can be the owner, a stranger or a friend just by picking one.
// A friend's made-up sign-in is "friend-sign-in:" and their email, like "friend-sign-in:sam@gmail.com".
// Sam is made fresh in each test, so the pretend one looks Sam up in the pretend database, like the real one does
const friendDao = require('../../friends/friend.dao');

const PRETEND_SIGN_INS = {
    'owner-sign-in': { who: 'owner' },
    'stranger-sign-in': { who: 'stranger' },
};
const FRIEND_SIGN_IN = 'friend-sign-in:';

async function whoIsThis(signIn) {
    if (signIn.startsWith(FRIEND_SIGN_IN)) {
        const friend = await friendDao.findByEmail(signIn.slice(FRIEND_SIGN_IN.length));
        return friend ? { who: 'friend', friendId: friend.id, name: friend.name } : { who: 'stranger' };
    }
    return PRETEND_SIGN_INS[signIn] || { who: 'nobody' }; // anything else is like an old or made-up sign-in
}

// the made-up sign-in for a friend with this email, so a test can sign in as Sam
whoIsThis.friendSignIn = (email) => FRIEND_SIGN_IN + email;

module.exports = whoIsThis;
