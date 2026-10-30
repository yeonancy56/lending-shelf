const mongoose = require('mongoose');
const Friend =  require ('./friend.model')

function findAll()         { return Friend.find()};
function findById(id)      { return Friend.findById(id)};
function create(data)      { return Friend.create(data)};
function update(id, data)  { return Friend.findByIdAndUpdate(id, data, { returnDocument: 'after'})};
function remove(id)        { return Friend.findByIdAndDelete(id)};

// is there a friend with this ID? (an ID in the wrong shape, like "abc", can't belong to any friend)
async function exists(id) {
    if (!mongoose.isValidObjectId(id)) return false;
    return (await Friend.exists({ _id: id })) !== null;
}

module.exports= {findAll, findById, create, update, remove, exists}