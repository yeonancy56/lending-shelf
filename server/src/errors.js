// The two kinds of known mistakes, shared by every feature.
// Anything else that goes wrong (like the database being down) is a real breakdown,
// so the controllers let Express answer it instead of showing it as a red message.

// a mistake in the request, like a second Dune with no copy note, or a book that doesn't exist (400)
function badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

// the request is fine, but a lending rule says no, like Dune already being with Sam (409)
function ruleBroken(message) {
    const err = new Error(message);
    err.status = 409;
    return err;
}

// what every controller does when the service says no: a known mistake gets its red message,
// and a real breakdown is passed on to Express
function answerKnownMistake(res, err) {
    if (!err.status) throw err;
    res.status(err.status).json({ error: err.message }); // 400 for a bad request, 409 for a broken rule
}

// the database's own code for "that would break a one-only rule", like a second active loan of Dune.
// Shared, because books, friends, loans and requests each have a one-only rule the database guards
const DUPLICATE_KEY = 11000;

module.exports = { badRequest, ruleBroken, answerKnownMistake, DUPLICATE_KEY };
