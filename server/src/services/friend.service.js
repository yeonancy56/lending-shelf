const friendDao = require('../daos/friend.dao')

function listFriends()             { return friendDao.findAll(); }
function getFriend(id)             { return friendDao.findById(id); }
function addFriend(data)           { return friendDao.create(data); }
function updateFriend(id, data)    {return friendDao.update(id, data); }
function deleteFriend(id)          {return friendDao.remove(id); }

module.exports = {listFriends, getFriend, addFriend, updateFriend, deleteFriend};