const express = require('express');
const loanController = require('./loan.controller');
const { onlyFriend } = require('../auth/gatekeeper');

// Sam's own loans. It's Sam's address, not mine, so it lives apart from /loans, which is only mine.
// It works out it's Sam from the sign-in, so Sam can only ever see Sam's own loans
const router = express.Router();

router.get('/me/loans', onlyFriend, loanController.listMine);

module.exports = router;
