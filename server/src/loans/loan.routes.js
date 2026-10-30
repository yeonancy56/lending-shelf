const express = require('express');
const loanController = require('./loan.controller');

const router = express.Router();

router.get('/',              loanController.list);
router.post('/',             loanController.lend);
router.post('/:id/return',   loanController.returnLoan);

module.exports = router;