const mongoose = require('mongoose');
const Friend =  require ('./friend.model')

function findAll()         { return Friend.find()};
function findById(id)      { return Friend.findById(id)};
function create(data)      { return Friend.create(data)};
// a friend with no email has no email saved at all, so emptying Sam's email box removes it ($unset)
function update(id, { email, ...rest }) {
    const changes = email ? { ...rest, email } : { ...rest, $unset: { email: 1 } };
    return Friend.findByIdAndUpdate(id, changes, { returnDocument: 'after'});
}
function remove(id)        { return Friend.findByIdAndDelete(id)};
function findByEmail(email) { return Friend.findOne({ email })}; // the friend with this (already tidied) email, or null

// is there a friend with this ID? (an ID in the wrong shape, like "abc", can't belong to any friend)
async function exists(id) {
    if (!mongoose.isValidObjectId(id)) return false;
    return (await Friend.exists({ _id: id })) !== null;
}

module.exports= {findAll, findById, create, update, remove, exists, findByEmail}