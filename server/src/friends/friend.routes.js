const express = require ('express');
const friendController = require('./friend.controller');
const loanController = require('../loans/loan.controller');

const router = express.Router();

router.get('/',         friendController.list);
router.get('/:id',      friendController.getOne);
router.post('/',        friendController.create);
router.put('/:id',      friendController.update);
router.delete('/:id',   friendController.remove);
router.get('/:id/loans', loanController.listForFriend); // Sam's panel: the loans part lives with the other loan code

module.exports = router;