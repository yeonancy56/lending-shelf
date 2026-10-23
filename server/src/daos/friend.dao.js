const Friend =  require ('../models/friend.model')

function findAll()         { return Friend.find()};
function findById(id)      { return Friend.findById(id)};
function create(data)      { return Friend.create(data)};
function update(id, data)  { return Friend.findByIdAndUpdate(id, data, { returnDocument: 'after'})};
function remove(id)        { return Friend.findByIdAndDelete(id)};

module.exports= {findAll, findById, create, update, remove}