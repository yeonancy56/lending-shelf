// Counts wrong password tries for each username, so no one can guess Gran's password over and over.
// After 5 wrong tries, that username waits 15 minutes. The count is kept in the server's memory only,
// so it starts again from zero when the server restarts. That's fine for a few friends.
const MOST_TRIES = 5;
const WAIT = 15 * 60 * 1000; // 15 minutes

const tries = new Map(); // username → { count, since }: how many wrong tries since when

// the wrong tries for this username in the last 15 minutes. Older ones are forgotten
function triesNow(username) {
    const counted = tries.get(username);
    if (counted && Date.now() - counted.since >= WAIT) {
        tries.delete(username);
        return null;
    }
    return counted;
}

function tooManyTries(username) {
    return (triesNow(username)?.count ?? 0) >= MOST_TRIES;
}

function countWrongTry(username) {
    const counted = triesNow(username) ?? { count: 0, since: Date.now() };
    tries.set(username, { ...counted, count: counted.count + 1 });
}

// a right sign-in starts the count again. With no username, every count is forgotten (for tests)
function forgetWrongTries(username) {
    if (username === undefined) tries.clear();
    else tries.delete(username);
}

module.exports = { tooManyTries, countWrongTry, forgetWrongTries };
