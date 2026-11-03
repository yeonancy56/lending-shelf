const express = require ('express'); // load express
const app = express();               // make the app
const cors = require('cors');
app.use(cors());

app.get ('/health', (req,res) => {       // health route, open to anyone, so Render can check the server is awake
   res.send('ok')
});

// every address below this line needs a sign-in: mine, or a friend's like Sam's
const { signedIn, onlyOwner, onlyFriend, whoAmI } = require('./auth/gatekeeper');
app.use(signedIn);

app.use(express.json());

// "who am I?", for both of us: the page asks it to know which page to show
app.get('/me', whoAmI);

// Sam's addresses. Each one works out it's Sam from the sign-in, so Sam can only ever see Sam's own things
const bookController = require('./books/book.controller');
const loanController = require('./loans/loan.controller');
app.get('/shelf', onlyFriend, bookController.shelf);          // every book, "on the shelf" or "lent out", with no names
app.get('/me/loans', onlyFriend, loanController.listMine);    // Sam's own loans
const requestController = require('./requests/request.controller');
app.get('/me/requests', onlyFriend, requestController.listMine); // Sam's own requests, newest first
app.post('/requests', onlyFriend, requestController.ask);     // Sam asks for a book
app.post('/requests/:id/cancel', onlyFriend, requestController.cancel); // Sam takes back Sam's own waiting request

// my addresses. A friend gets 403 on every one of them
const bookRoutes = require('./books/book.routes');
app.use('/books', onlyOwner, bookRoutes);

const friendRoutes = require('./friends/friend.routes');
app.use('/friends', onlyOwner, friendRoutes);

const loanRoutes = require('./loans/loan.routes');
app.use('/loans', onlyOwner, loanRoutes);

app.get('/requests', onlyOwner, requestController.listWaiting); // my Requests list: waiting requests, oldest first
app.post('/requests/:id/approve', onlyOwner, requestController.approve); // I say yes, and the book is lent right away

module.exports = app;                // sharing the app
