// Counts wrong password tries for each username, so no one can guess Gran's password over and over.
// After 5 wrong tries, that username waits 15 minutes, counted from the 5th try. The count is kept in the server's memory only,
// so it starts again from zero when the server restarts. That's fine for a few friends.
const MOST_TRIES = 5;
const WAIT = 15 * 60 * 1000; // 15 minutes

const tries = new Map(); // username → { count, last }: how many wrong tries, and when the latest one was

// the wrong tries for this username. 15 quiet minutes after the latest one, they're all forgotten.
// A refused try (429) isn't counted, so once there are 5, the latest is the 5th, and the wait is a full 15 minutes from it
function triesNow(username) {
    const counted = tries.get(username);
    if (counted && Date.now() - counted.last >= WAIT) {
        tries.delete(username);
        return null;
    }
    return counted;
}

function tooManyTries(username) {
    return (triesNow(username)?.count ?? 0) >= MOST_TRIES;
}

function countWrongTry(username) {
    const count = (triesNow(username)?.count ?? 0) + 1;
    tries.set(username, { count, last: Date.now() });
}

// a right sign-in starts this username's count again
function forgetWrongTries(username) {
    tries.delete(username);
}

// every count gone, so each test starts with none
function forgetAllWrongTries() {
    tries.clear();
}

module.exports = { tooManyTries, countWrongTry, forgetWrongTries, forgetAllWrongTries };
