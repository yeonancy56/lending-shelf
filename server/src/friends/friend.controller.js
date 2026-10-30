const friendService = require ('./friend.service');

async function list(req, res) {
    const friends = await friendService.listFriends();
    res.json(friends);
}

async function getOne(req, res) {
    const friend = await friendService.getFriend(req.params.id);
    if (!friend) return res.status(404).json({error: 'Friend not found'});
    res.json(friend);
}

async function create(req, res) {
    const friend = await friendService.addFriend(req.body);
    res.status(201).json(friend);
}

async function update(req, res) {
    const friend = await friendService.updateFriend(req.params.id, req.body);
    if (!friend) return res.status(404).json({error: 'Friend not found'});
    res.json(friend);
}

async function remove(req, res) {
    const friend = await friendService.deleteFriend(req.params.id);
    if (!friend) return res.status(404).json({error: 'Friend not found'});
    res.status(204).end();
}

module.exports = {list, getOne, create, update, remove};