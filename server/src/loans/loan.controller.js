const loanService = require ('./loan.service');

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
        res.status(err.status || 409).json({ error: err.message }); // 400 for a bad request, 409 for a broken rule
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
