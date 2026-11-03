const express = require('express');
const ratingController = require('./rating.controller');
const { onlyFriend } = require('../auth/gatekeeper');

// Sam's ratings. Only friends rate, so there's no address for me here
const router = express.Router();

// Sam sets his stars for one copy. PUT means "make it this", so rating again replaces the old stars
router.put('/me/ratings/:bookId', onlyFriend, ratingController.rate);

module.exports = router;
