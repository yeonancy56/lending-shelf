const requestService = require('./request.service');
const { answerKnownMistake } = require('../errors');

// Sam asks for a book, through POST /requests. Which friend comes from Sam's sign-in (req.who),
// never from the body, so Sam can't ask on Alex's behalf
async function ask(req, res) {
    const { bookId } = req.body ?? {};
    try {
        const request = await requestService.askForBook(bookId, req.who.friendId);
        res.status(201).json(request);
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

// Sam's own requests, through /me/requests. Which friend comes from Sam's sign-in, so Sam can't see Alex's
async function listMine(req, res) {
    res.json(await requestService.listFriendRequests(req.who.friendId));
}

// Sam cancels, through POST /requests/:id/cancel. Only Sam's own request: Alex's is "not found" for Sam
async function cancel(req, res) {
    try {
        const request = await requestService.cancelRequest(req.params.id, req.who.friendId);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

module.exports = { ask, listMine, cancel };
