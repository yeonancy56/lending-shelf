const friendDao = require('./friend.dao')
const loanDao = require('../loans/loan.dao');
const requestDao = require('../requests/request.dao');
const bcrypt = require('bcryptjs');
const tidyEmail = require('../tidy-email');
const tidyUsername = require('../tidy-username');
const { badRequest, ruleBroken, DUPLICATE_KEY } = require('../errors');

function listFriends()             { return friendDao.findAll(); }
function getFriend(id)             { return friendDao.findById(id); }

// a friend who's borrowed or asked can't be deleted, because their loans and requests are kept forever and still need them.
// Gives back nothing when there's no such friend, so the controller can say "Friend not found"
async function deleteFriend(id) {
    if (!(await friendDao.exists(id))) return null;
    if (await loanDao.hasEverBorrowed(id)) {
        throw ruleBroken("This friend has borrowed before, so they can't be deleted. Their loans need them.");
    }
    if (await requestDao.hasEverAsked(id)) {
        throw ruleBroken("This friend has asked for a book before, so they can't be deleted. Their requests need them.");
    }
    return friendDao.remove(id);
}

// bcrypt's "how hard to scramble". 10 is bcrypt's usual choice: slow enough to make guessing hard, fast enough to sign in
const SCRAMBLE_ROUNDS = 10;

// the password I typed for Gran, scrambled. The controller already checked it's words and long enough.
// An empty box (or only spaces) means no new password, so editing Sam without typing one keeps his old one.
// The password isn't trimmed: spaces inside it count
async function scrambledPassword(password) {
    if (typeof password !== 'string' || password.trim() === '') return undefined;
    return bcrypt.hash(password, SCRAMBLE_ROUNDS);
}

// the friend form, ready to save: email and username tidied, so "SAM@gmail.com " becomes "sam@gmail.com" and " Sam " becomes "sam",
// and the password scrambled. An empty box (or only spaces) means none, so Gran (who'll never sign in) works like today.
// No new password means passwordHash is left out, so the saved one stays
async function readyToSave({ password, ...form }) {
    const data = { ...form, email: tidyEmail(form.email) || undefined, username: tidyUsername(form.username) || undefined };
    const passwordHash = await scrambledPassword(password);
    return passwordHash ? { ...data, passwordHash } : data;
}

// one email means one friend, and my own email is never a friend's, so sign-in always knows who it is.
// The email is already tidied by readyToSave, just before this.
// When editing, the friend being edited is left out, so Sam never clashes with Sam
async function checkEmail(email, editingId) {
    if (!email) return; // no email is always fine
    if (email === tidyEmail(process.env.OWNER_EMAIL)) {
        throw badRequest("That's your own email. A friend needs their own.");
    }
    const friendWithEmail = await friendDao.findByEmail(email);
    if (friendWithEmail && !friendWithEmail._id.equals(editingId)) {
        throw emailTaken(friendWithEmail);
    }
}

function emailTaken(friendWithEmail) {
    return badRequest(`${friendWithEmail.name} already has this email.`);
}

// one username means one friend, so a password sign-in always knows who it is. Works like checkEmail
async function checkUsername(username, editingId) {
    if (!username) return; // no username is always fine
    const friendWithUsername = await friendDao.findByUsername(username);
    if (friendWithUsername && !friendWithUsername._id.equals(editingId)) {
        throw usernameTaken(friendWithUsername);
    }
}

function usernameTaken(friendWithUsername) {
    return badRequest(`${friendWithUsername.name} already has this username.`);
}

// why saving didn't work. If another friend with this email or username was saved a moment before, the database said no,
// so I get the same message checkEmail or checkUsername gives. Anything else is a real breakdown, passed on as it is
async function whySaveFailed(err, data) {
    if (err.code !== DUPLICATE_KEY) return err;
    if (err.keyPattern?.username) return usernameTaken(await friendDao.findByUsername(data.username));
    return emailTaken(await friendDao.findByEmail(data.email));
}

async function addFriend(form) {
    const data = await readyToSave(form);
    await checkEmail(data.email);
    await checkUsername(data.username);
    try {
        return await friendDao.create(data);
    } catch (err) {
        throw await whySaveFailed(err, data);
    }
}

// gives back nothing when there's no such friend, so the controller can say "Friend not found"
async function updateFriend(id, form) {
    if (!(await friendDao.exists(id))) return null;
    const data = await readyToSave(form);
    await checkEmail(data.email, id);
    await checkUsername(data.username, id);
    try {
        return await friendDao.update(id, data);
    } catch (err) {
        throw await whySaveFailed(err, data);
    }
}

module.exports = {listFriends, getFriend, addFriend, updateFriend, deleteFriend};
