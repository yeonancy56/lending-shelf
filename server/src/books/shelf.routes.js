const express = require('express');
const bookController = require('./book.controller');
const { onlyFriend } = require('../auth/gatekeeper');

// Sam's view of the shelf. It's Sam's address, not mine, so it lives apart from /books, which is only mine
const router = express.Router();

router.get('/shelf', onlyFriend, bookController.shelf); // every book, "on the shelf", "lent out" or "asked for", with no names

module.exports = router;
