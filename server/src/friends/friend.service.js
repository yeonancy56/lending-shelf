const friendDao = require('./friend.dao')
const loanDao = require('../loans/loan.dao');
const requestDao = require('../requests/request.dao');
const tidyEmail = require('../tidy-email');
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

// the friend form, with its email tidied, so "SAM@gmail.com " becomes "sam@gmail.com".
// An empty box (or only spaces) means no email, so Gran (who'll never sign in) works like today
function withTidyEmail(form) {
    return { ...form, email: tidyEmail(form.email) || undefined };
}

// one email means one friend, and my own email is never a friend's, so sign-in always knows who it is.
// The email is already tidied by withTidyEmail, just before this.
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

// why saving didn't work. If another friend with this email was saved a moment before, the database said no,
// so I get the same message checkEmail gives. Anything else is a real breakdown, passed on as it is
async function whySaveFailed(err, email) {
    if (err.code === DUPLICATE_KEY) return emailTaken(await friendDao.findByEmail(email));
    return err;
}

async function addFriend(form) {
    const data = withTidyEmail(form);
    await checkEmail(data.email);
    try {
        return await friendDao.create(data);
    } catch (err) {
        throw await whySaveFailed(err, data.email);
    }
}

// gives back nothing when there's no such friend, so the controller can say "Friend not found"
async function updateFriend(id, form) {
    if (!(await friendDao.exists(id))) return null;
    const data = withTidyEmail(form);
    await checkEmail(data.email, id);
    try {
        return await friendDao.update(id, data);
    } catch (err) {
        throw await whySaveFailed(err, data.email);
    }
}

module.exports = {listFriends, getFriend, addFriend, updateFriend, deleteFriend};
