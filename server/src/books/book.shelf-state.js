// The three words Sam's page shows next to a book. Written once here, so the server always spells them the same way.
// Sam's page has its own copy (SHELF_STATE in client/src/App.jsx), so a rename changes this file and that line
const SHELF_STATE = {
    AT_HOME: 'at home',     // not lent out, and no one has asked for it, so Sam can ask
    LENT_OUT: 'lent out',   // a friend has it right now
    ASKED_FOR: 'asked for', // someone is waiting for my answer
};

module.exports = SHELF_STATE;
