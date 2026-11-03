const friendService = require ('./friend.service');
const tidyEmail = require('../auth/tidy-email');
const { answerKnownMistake } = require('../errors');

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

// the friend form: a name, and a Google email if there is one.
// An empty email box means no email, so Gran (who'll never sign in) works like today
function readFriendForm(body) {
    const { name, email } = body ?? {}; // ?? {} = if nothing was sent at all, treat it as an empty form
    return { name, email: isBlank(email) ? undefined : tidyEmail(email) };
}

async function create(req, res) {
    // ?. = if nothing was sent at all, don't crash, just treat the name as missing
    if (isBlank(req.body?.name)) return res.status(400).json({ error: "Every friend needs a name" });

    try {
        const friend = await friendService.addFriend(readFriendForm(req.body));
        res.status(201).json(friend);
    } catch (err) {
        answerKnownMistake(res, err); // like "Sam already has this email."
    }
}

async function update(req, res) {
    if (isBlank(req.body?.name)) return res.status(400).json({ error: "Every friend needs a name" });

    try {
        const friend = await friendService.updateFriend(req.params.id, readFriendForm(req.body));
        if (!friend) return res.status(404).json({error: 'Friend not found'});
        res.json(friend);
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

async function remove(req, res) {
    const friend = await friendService.deleteFriend(req.params.id);
    if (!friend) return res.status(404).json({error: 'Friend not found'});
    res.status(204).end();
}

module.exports = {list, getOne, create, update, remove};