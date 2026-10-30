const friendService = require ('./friend.service');

// empty, only spaces, or not text at all? Then it's missing
function isBlank(value) {
    return typeof value !== 'string' || value.trim() === '';
}

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
    // ?. = if nothing was sent at all, don't crash, just treat the name as missing
    if (isBlank(req.body?.name)) return res.status(400).json({ error: "Every friend needs a name" });

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