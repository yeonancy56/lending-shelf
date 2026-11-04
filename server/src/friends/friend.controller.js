const friendService = require ('./friend.service');
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

const SHORTEST_PASSWORD = 8;

// what's wrong with the password I typed, or '' when it's fine. An empty box is fine: it means no new password
function passwordMistake(password) {
    if (password === undefined || password === null) return '';
    if (typeof password !== 'string') return 'The password must be words.';
    if (password.trim() === '') return '';
    if (password.length < SHORTEST_PASSWORD) return `A password needs at least ${SHORTEST_PASSWORD} characters.`;
    return '';
}

// the checks that need no look in the database: a name, and a password that's words and long enough
function formMistake(body) {
    // ?. = if nothing was sent at all, don't crash, just treat the name as missing
    if (isBlank(body?.name)) return "Every friend needs a name";
    return passwordMistake(body?.password);
}

// the friend form: a name, and a Google email, a username and a password if there are any.
// The service tidies the email and username, and scrambles the password
function readFriendForm(body) {
    const { name, email, username, password } = body ?? {}; // ?? {} = if nothing was sent at all, treat it as an empty form
    return { name, email, username, password };
}

async function create(req, res) {
    const mistake = formMistake(req.body);
    if (mistake) return res.status(400).json({ error: mistake });

    try {
        const friend = await friendService.addFriend(readFriendForm(req.body));
        res.status(201).json(friend);
    } catch (err) {
        answerKnownMistake(res, err); // like "Sam already has this email."
    }
}

async function update(req, res) {
    const mistake = formMistake(req.body);
    if (mistake) return res.status(400).json({ error: mistake });

    try {
        const friend = await friendService.updateFriend(req.params.id, readFriendForm(req.body));
        if (!friend) return res.status(404).json({error: 'Friend not found'});
        res.json(friend);
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

async function remove(req, res) {
    try {
        const friend = await friendService.deleteFriend(req.params.id);
        if (!friend) return res.status(404).json({error: 'Friend not found'});
        res.status(204).end();
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

module.exports = {list, getOne, create, update, remove};