const bookService = require('../services/book.service')

async function list(req, res) {
    const books = await bookService.listBooks();
    res.json(books);
}

async function getOne(req, res) {
    const book = await bookService.getBook(req.params.id);
    if(!book) return res.status(404).json({error: 'Book not found'});
    res.json(book)
}


async function create(req, res) {
    const book = await bookService.addBook(req.body);
    res.status(201).json(book)
}

async function update(req, res) {
    const book = await bookService.updateBook(req.params.id, req.body);
    if (!book) return res.status(404).json({error: 'Book not found'});
    res.json(book);
}

async function remove(req, res) {
    const book = await bookService.deleteBook(req.params.id);
    if (!book) return res.status(404).json({error: 'Book not found'});
    res.status(204).end()
}

module.exports = {list, getOne, create, update, remove}