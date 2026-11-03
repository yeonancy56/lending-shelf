// The one rule for "the same email": "Sam@Gmail.com " and "sam@gmail.com" are the same.
// Used for my owner email, the email Google checked, and friends' emails, so they always match the same way
function tidyEmail(email) {
    return (email || '').trim().toLowerCase();
}

module.exports = tidyEmail;
