const bookService = require('./book.service')

const MAX_COPY_NOTE_LENGTH = 30; // a copy note is "a few words", like "signed" or "Mum's copy"

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

    const trimmedCopyNote = isBlank(copyNote) ? undefined : copyNote.trim(); // no note (or only spaces) = no copy note
    if (trimmedCopyNote && trimmedCopyNote.length > MAX_COPY_NOTE_LENGTH) {
        return res.status(400).json({ error: `Keep the note short (${MAX_COPY_NOTE_LENGTH} letters or fewer).` });
    }

    try {
        const book = await bookService.addBook({ title, author, copyNote: trimmedCopyNote });
        res.status(201).json(book)
    } catch (err) {
        if (!err.status) throw err; // a real crash, not a mistake in the form, so let Express handle it
        res.status(err.status).json({ error: err.message });
    }
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