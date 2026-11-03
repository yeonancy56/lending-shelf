const express = require ('express');
const friendController = require('./friend.controller');
const loanController = require('../loans/loan.controller');
const requestController = require('../requests/request.controller');

const router = express.Router();

router.get('/',         friendController.list);
router.get('/:id',      friendController.getOne);
router.post('/',        friendController.create);
router.put('/:id',      friendController.update);
router.delete('/:id',   friendController.remove);
router.get('/:id/loans', loanController.listForFriend); // Sam's panel. The address starts with /friends, but the answer is loans, so the loans code handles it
router.get('/:id/requests', requestController.listForFriend); // Sam's requests in Sam's panel, handled by the requests code the same way

module.exports = router;