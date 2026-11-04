const { badRequest } = require('./errors');

// The one rule for "the same username": " Sam " and "sam" are the same, like emails.
// Used when I save a friend and when someone signs in, so they always match the same way.
// No username at all becomes "". A username that isn't words, like a number, is a mistake in the form
function tidyUsername(username) {
    if (username === undefined || username === null) return '';
    if (typeof username !== 'string') throw badRequest('The username must be words.');
    return username.trim().toLowerCase();
}

module.exports = tidyUsername;
