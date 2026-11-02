// The one rule for "the same words": capitals and spaces around the text don't count.
// So "dune" is the same title as "Dune", and " Paperback " the same copy note as "paperback".
// Used for title, author and copy note, so changing what "same" means is one edit here.

// a search for exactly this text, for asking the database.
// Characters like "?" or "(" mean something special in a search, so they get a "\" in front to stay plain letters
function sameTextPattern(text) {
    const plain = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^\\s*${plain}\\s*$`, 'i');
}

// are these two the same words? Uses the same search as the database, so the rule is written only once.
// (no text at all only matches no text at all)
function isSameText(a, b) {
    if (!a || !b) return !a && !b;
    return sameTextPattern(a).test(b);
}

module.exports = { sameTextPattern, isSameText };
