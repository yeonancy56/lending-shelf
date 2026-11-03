const express = require('express');
const requestController = require('./request.controller');
const { onlyOwner, onlyFriend } = require('../auth/gatekeeper');

// Every requests address, each with whose it is: Sam's (onlyFriend) or mine (onlyOwner).
// The addresses are written out in full, because Sam's own list lives at /me/requests, not under /requests
const router = express.Router();

// Sam's addresses. Each one works out it's Sam from the sign-in, so Sam can only ever see Sam's own requests
router.get('/me/requests',          onlyFriend, requestController.listMine); // Sam's own requests, newest first
router.post('/requests',            onlyFriend, requestController.ask);      // Sam asks for a book
router.post('/requests/:id/cancel', onlyFriend, requestController.cancel);   // Sam takes back Sam's own waiting request

// my addresses
router.get('/requests',              onlyOwner, requestController.listWaiting); // my Requests list: waiting requests, oldest first
router.post('/requests/:id/approve', onlyOwner, requestController.approve);     // I say yes, and the book is lent right away
router.post('/requests/:id/decline', onlyOwner, requestController.decline);     // I say no, maybe with a short note for Sam

module.exports = router;
