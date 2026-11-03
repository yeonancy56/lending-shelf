const express = require ('express'); // load express
const app = express();               // make the app
const cors = require('cors');
app.use(cors());

app.get ('/health', (req,res) => {       // health route, open to anyone, so Render can check the server is awake
   res.send('ok')
});

// every address below this line needs a sign-in: mine, or a friend's like Sam's
const { signedIn, onlyOwner, whoAmI } = require('./auth/gatekeeper');
app.use(signedIn);

app.use(express.json());

// "who am I?", for both of us: the page asks it to know which page to show
app.get('/me', whoAmI);

// Sam's addresses. Each one works out it's Sam from the sign-in, so Sam can only ever see Sam's own things
const shelfRoutes = require('./books/shelf.routes');
app.use(shelfRoutes);       // /shelf: every book and whether it is free, with no names
const myLoansRoutes = require('./loans/my-loans.routes');
app.use(myLoansRoutes);     // /me/loans: Sam's own loans

// requests: some addresses are Sam's and some are mine, so each one says whose it is in its own file
const requestRoutes = require('./requests/request.routes');
app.use(requestRoutes);

// my addresses. A friend gets 403 on every one of them
const bookRoutes = require('./books/book.routes');
app.use('/books', onlyOwner, bookRoutes);

const friendRoutes = require('./friends/friend.routes');
app.use('/friends', onlyOwner, friendRoutes);

const loanRoutes = require('./loans/loan.routes');
app.use('/loans', onlyOwner, loanRoutes);

module.exports = app;                // sharing the app
