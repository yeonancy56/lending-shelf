// Who someone is, once "who is this?" has asked Google. Written once here,
// so the gatekeeper, the lending rules' words and the requests code all spell them the same way
const ROLE = {
    OWNER: 'owner',       // me
    FRIEND: 'friend',     // a friend I added with their Google email, like Sam
    STRANGER: 'stranger', // a real Google sign-in, but not an email on the list
    NOBODY: 'nobody',     // no sign-in, or one Google turns down (like an old one)
};

module.exports = ROLE;
