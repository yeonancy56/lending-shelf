const bookService = require('./book.service')

const MAX_NOTE = 30; // a copy note is "a few words", like "signed" or "Mum's copy"

// empty, only spaces, or not text at all? Then it's missing
function isBlank(value) {
    return typeof value !== 'string' || value.trim() === '';
}

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
    const { title, author, copyNote } = req.body ?? {}; // ?? {} = if nothing was sent at all, treat it as an empty form
    if (isBlank(title) || isBlank(author)) return res.status(400).json({ error: 'Please fill in the title and author' });

    const note = isBlank(copyNote) ? undefined : copyNote.trim(); // no note (or only spaces) = no copy note
    if (note && note.length > MAX_NOTE) return res.status(400).json({ error: 'Keep the note short (30 letters or fewer).' });

    const book = await bookService.addBook({ title, author, copyNote: note });
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