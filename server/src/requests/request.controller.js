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

// cancel, approve and decline all answer the same way: the request as it is now,
// "Request not found" when there's no such request, or the red message when a rule says no.
// changeRequest is the service step to run, like cancelling Sam's request
async function answerWithRequest(res, changeRequest) {
    try {
        const request = await changeRequest();
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

// Sam cancels, through POST /requests/:id/cancel. Only Sam's own request: Alex's is "not found" for Sam
async function cancel(req, res) {
    await answerWithRequest(res, () => requestService.cancelRequest(req.params.id, req.who.friendId));
}

// Sam's panel on my page, through /friends/:id/requests
async function listForFriend(req, res) {
    const requests = await requestService.listRequestsForPanel(req.params.id);
    if (!requests) return res.status(404).json({ error: 'Friend not found' });
    res.json(requests);
}

// my Requests list, through GET /requests
async function listWaiting(req, res) {
    res.json(await requestService.listWaitingRequests());
}

// I approve, through POST /requests/:id/approve. If a lending rule says no, I see why, and the request keeps waiting
async function approve(req, res) {
    await answerWithRequest(res, () => requestService.approveRequest(req.params.id));
}

// I decline, through POST /requests/:id/decline, with an optional note for Sam in the body
async function decline(req, res) {
    const { note } = req.body ?? {};
    await answerWithRequest(res, () => requestService.declineRequest(req.params.id, note));
}

module.exports = { ask, listMine, cancel, listWaiting, approve, decline, listForFriend };
