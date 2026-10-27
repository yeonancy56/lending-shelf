const loanService = require ('../services/loan.service');

async function list (req, res) {
    const loans = await loanService.listLoans();
    res.json(loans);
}

async function lend(req, res) {
    try {
        const loan = await loanService.lendBook(req.body.bookId, req.body.friendId);
        res.status(201).json(loan)
    } catch (err) {
        res.status(409).json({ error: err.message });
    }
}

async function returnLoan(req, res) {
    try{
        const loan = await loanService.returnBook(req.params.id);
        if (!loan) return res.status (404).json({ error: 'Loan not found '});
        res.json(loan);
    } catch (err) {
        res.status(409).json({ error: err.message });
    }
}

module.exports = {list, lend, returnLoan}; 
