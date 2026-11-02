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

module.exports = { badRequest, ruleBroken };
