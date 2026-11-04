const mongoose = require('mongoose');
const Friend =  require ('./friend.model')

// the scrambled password is left behind unless it's asked for (friend.model.js). These ask for it,
// so the friends list and Sam's panel can say "Has a password", and sign-in can check it. It never reaches the page
const WITH_PASSWORD = '+passwordHash';

function findAll()         { return Friend.find().select(WITH_PASSWORD)};
// an ID in the wrong shape, like "abc", can't belong to any friend, so there's nothing to find
function findById(id)      { return mongoose.isValidObjectId(id) ? Friend.findById(id).select(WITH_PASSWORD) : null; }
function create(data)      { return Friend.create(data)};
// a friend with no email or username has none saved at all, so emptying Sam's email or username box removes it ($unset).
// A password left out of the changes stays as it was
function update(id, { email, username, ...rest }) {
    const emptied = {};
    if (!email) emptied.email = 1;
    if (!username) emptied.username = 1;
    const changes = { ...rest, ...(email && { email }), ...(username && { username }) };
    if (Object.keys(emptied).length) changes.$unset = emptied; // only when a box was emptied
    return Friend.findByIdAndUpdate(id, changes, { returnDocument: 'after'}).select(WITH_PASSWORD);
}
function remove(id)        { return Friend.findByIdAndDelete(id)};
function findByEmail(email) { return Friend.findOne({ email })}; // the friend with this (already tidied) email, or null
// the friend with this (already tidied) username, or null. With the scrambled password, so sign-in can check it
function findByUsername(username) { return Friend.findOne({ username }).select(WITH_PASSWORD)};

// is there a friend with this ID? (an ID in the wrong shape, like "abc", can't belong to any friend)
async function exists(id) {
    if (!mongoose.isValidObjectId(id)) return false;
    return (await Friend.exists({ _id: id })) !== null;
}

module.exports= {findAll, findById, create, update, remove, exists, findByEmail, findByUsername}
