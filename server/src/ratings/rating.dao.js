const Rating = require('./rating.model');

// Sam's stars for this copy: a new rating the first time, his new stars after that.
// One step, so two quick clicks can't make two ratings. If both try to make the first one at the same moment,
// the database's one-rating rule stops the second, and the database tries it again by itself as a change.
// It only does that because this search is exactly the rule's two fields, book and friend, so keep them that way
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

// for each copy someone rated: the average of every friend's stars, and how many friends rated it.
// Only the totals come back, never who gave what. Each friend has one rating per copy, so Sam counts once
function findAverageStarsByBook() {
    return Rating.aggregate([
        { $group: { _id: '$book', averageStars: { $avg: '$stars' }, ratingCount: { $sum: 1 } } },
    ]);
}

module.exports = { setStars, findByFriend, findAverageStarsByBook };
