const Rating = require('./rating.model');

// Sam's stars for this copy: a new rating the first time, his new stars after that.
// One step, so two quick clicks can't make two ratings
function setStars(bookId, friendId, stars) {
    return Rating.findOneAndUpdate(
        { book: bookId, friend: friendId },
        { stars },
        { upsert: true, returnDocument: 'after' },
    );
}

// every rating this friend gave, so Sam's shelf can show his own stars. Only his: never Alex's
function findByFriend(friendId) {
    return Rating.find({ friend: friendId });
}

module.exports = { setStars, findByFriend };
