// The gatekeeper: runs before every address except /health, and lets only the owner through.
// The page sends the Google sign-in in the Authorization header, as "Bearer <sign-in>".
const whoIsThis = require('./who-is-this');

async function onlyOwner(req, res, next) {
    const signIn = (req.get('Authorization') || '').replace(/^Bearer /, '');
    const { who } = await whoIsThis(signIn);
    if (who === 'owner') return next(); // let the request carry on to its route
    // 401 = "I don't know you". The page goes back to the sign-in button either way
    const message = who === 'stranger' ? "You're not on the list." : 'Please sign in.';
    res.status(401).json({ error: message });
}

module.exports = onlyOwner;
