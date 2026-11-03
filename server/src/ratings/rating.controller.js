const ratingService = require('./rating.service');
const { answerKnownMistake } = require('../errors');

const LEAST_STARS = 1;
const MOST_STARS = 5;

// Sam rates a copy, through PUT /me/ratings/:bookId. Which friend comes from Sam's sign-in (req.who),
// never from the body, so Sam can't rate on Alex's behalf
async function rate(req, res) {
    const { stars } = req.body ?? {};
    // whole stars only: no 0, no 6, no 3.5, and not the word "4"
    if (!Number.isInteger(stars) || stars < LEAST_STARS || stars > MOST_STARS) {
        return res.status(400).json({ error: `Pick from ${LEAST_STARS} to ${MOST_STARS} stars` });
    }
    try {
        res.json(await ratingService.rateBook(req.params.bookId, req.who.friendId, stars));
    } catch (err) {
        answerKnownMistake(res, err);
    }
}

module.exports = { rate };
