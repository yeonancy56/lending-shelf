// The gatekeeper: runs before every address except /health.
// The page sends the Google sign-in in the Authorization header, as "Bearer <sign-in>".
// First step: only people on the list (me, or a friend like Sam) get in at all.
// Then each address says whose it is: mine (onlyOwner) or a friend's (onlyFriend).
const whoIsThis = require('./who-is-this');

// lets in me and my friends, and remembers who it is in req.who, so a friend's address
// always knows it's Sam from the sign-in, never from anything the page sends
async function signedIn(req, res, next) {
    const signIn = (req.get('Authorization') || '').replace(/^Bearer /, '');
    const who = await whoIsThis(signIn);
    if (who.who === 'owner' || who.who === 'friend') {
        req.who = who;
        return next(); // let the request carry on to its route
    }
    // 401 = "I don't know you". The page goes back to the sign-in button either way
    const message = who.who === 'stranger' ? "You're not on the list." : 'Please sign in.';
    res.status(401).json({ error: message });
}

// 403 = "I know you, but this isn't yours". Like Sam trying to delete Dune without the page
function onlyOwner(req, res, next) {
    if (req.who.who === 'owner') return next();
    res.status(403).json({ error: 'Only the owner can do that.' });
}

// a friend's address, like "my loans". I'm not a friend, so I have no loans of my own to see
function onlyFriend(req, res, next) {
    if (req.who.who === 'friend') return next();
    res.status(403).json({ error: 'Only a friend can do that.' });
}

// "who am I?": the page asks this after sign-in, to show my page or the friend page
function whoAmI(req, res) {
    const { who, name } = req.who;
    res.json(who === 'friend' ? { who, name } : { who });
}

module.exports = { signedIn, onlyOwner, onlyFriend, whoAmI };
