const bookService = require('./book.service')
const { answerKnownMistake } = require('../errors');

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


// the book form, checked the same way for Add and Save: a title and author, and a short copy note if any.
// Gives back the error to show, or the form to save
function readBookForm(body) {
    const { title, author, copyNote } = body ?? {}; // ?? {} = if nothing was sent at all, treat it as an empty form
    if (isBlank(title) || isBlank(author)) return { error: 'Please fill in the title and author' };

    const trimmedCopyNote = isBlank(copyNote) ? undefined : copyNote.trim(); // no note (or only spaces) = no copy note
    if (trimmedCopyNote && trimmedCopyNote.length > MAX_COPY_NOTE_LENGTH) {
        return { error: `Keep the note short (${MAX_COPY_NOTE_LENGTH} letters or fewer).` };
    }
    return { form: { title, author, copyNote: trimmedCopyNote } };
}

async function create(req, res) {
    const { error, form } = readBookForm(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const book = await bookService.addBook(form);
        res.status(201).json(book)
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

async function update(req, res) {
    const { error, form } = readBookForm(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const book = await bookService.updateBook(req.params.id, form);
        if (!book) return res.status(404).json({error: 'Book not found'});
        res.json(book);
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

async function remove(req, res) {
    const book = await bookService.deleteBook(req.params.id);
    if (!book) return res.status(404).json({error: 'Book not found'});
    res.status(204).end()
}

module.exports = {list, getOne, create, update, remove}