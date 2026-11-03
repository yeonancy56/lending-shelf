const friendDao = require('./friend.dao')
const loanDao = require('../loans/loan.dao');
const { ruleBroken } = require('../errors');

function listFriends()             { return friendDao.findAll(); }
function getFriend(id)             { return friendDao.findById(id); }
function addFriend(data)           { return friendDao.create(data); }
function updateFriend(id, data)    {return friendDao.update(id, data); }

// a friend who's borrowed can't be deleted, because their loans (out now or returned) still need them
async function deleteFriend(id) {
    if (await loanDao.hasEverBorrowed(id)) {
        throw ruleBroken("This friend has borrowed before, so they can't be deleted. Their loans need them.");
    }
    return friendDao.remove(id);
}

module.exports = {listFriends, getFriend, addFriend, updateFriend, deleteFriend};