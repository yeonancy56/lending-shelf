const friendDao = require('./friend.dao')
const loanDao = require('../loans/loan.dao');
const tidyEmail = require('../auth/tidy-email');
const { badRequest, ruleBroken } = require('../errors');

function listFriends()             { return friendDao.findAll(); }
function getFriend(id)             { return friendDao.findById(id); }

// a friend who's borrowed can't be deleted, because their loans (out now or returned) still need them
async function deleteFriend(id) {
    if (await loanDao.hasEverBorrowed(id)) {
        throw ruleBroken("This friend has borrowed before, so they can't be deleted. Their loans need them.");
    }
    return friendDao.remove(id);
}

// one email means one friend, and my own email is never a friend's, so sign-in always knows who it is.
// The email is already tidied, so "SAM@gmail.com " has become "sam@gmail.com".
// When editing, the friend being edited is left out, so Sam never clashes with Sam
async function checkEmail(email, editingId) {
    if (!email) return; // no email is always fine
    if (email === tidyEmail(process.env.OWNER_EMAIL)) {
        throw badRequest("That's your own email. A friend needs their own.");
    }
    const friendWithEmail = await friendDao.findByEmail(email);
    if (friendWithEmail && !friendWithEmail._id.equals(editingId)) {
        throw badRequest(`${friendWithEmail.name} already has this email.`);
    }
}

async function addFriend(data) {
    await checkEmail(data.email);
    return friendDao.create(data);
}

// gives back nothing when there's no such friend, so the controller can say "Friend not found"
async function updateFriend(id, data) {
    if (!(await friendDao.exists(id))) return null;
    await checkEmail(data.email, id);
    return friendDao.update(id, data);
}

module.exports = {listFriends, getFriend, addFriend, updateFriend, deleteFriend};
