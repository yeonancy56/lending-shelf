const loanService = require ('./loan.service');
const { answerKnownMistake } = require('../errors');

async function list (req, res) {
    const loans = await loanService.listLoans();
    res.json(loans);
}

async function lend(req, res) {
    const { bookId, friendId } = req.body;
    // nothing picked? Answer straight away, no need to ask the service
    if (!bookId || !friendId) return res.status(400).json({ error: 'Pick a book and a friend' });

    try {
        const loan = await loanService.lendBook(bookId, friendId);
        res.status(201).json(loan)
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

async function returnLoan(req, res) {
    try{
        const loan = await loanService.returnBook(req.params.id);
        if (!loan) return res.status (404).json({ error: 'Loan not found '});
        res.json(loan);
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

module.exports = {list, lend, returnLoan}; 
