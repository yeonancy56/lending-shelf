const { badRequest } = require('./errors');

// The one rule for "the same email": "Sam@Gmail.com " and "sam@gmail.com" are the same.
// Used for my owner email, the email Google checked, and friends' emails, so they always match the same way.
// No email at all becomes "". An email that isn't words, like a number, is a mistake in the form
function tidyEmail(email) {
    if (email === undefined || email === null) return '';
    if (typeof email !== 'string') throw badRequest('The email must be words.');
    return email.trim().toLowerCase();
}

module.exports = tidyEmail;
