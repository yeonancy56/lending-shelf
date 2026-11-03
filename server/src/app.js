const express = require ('express'); // load express
const app = express();               // make the app
const cors = require('cors');
app.use(cors());

app.get ('/health', (req,res) => {       // health route, open to anyone, so Render can check the server is awake
   res.send('ok')
});

// every address below this line needs the owner's sign-in
const onlyOwner = require('./auth/sign-in');
app.use(onlyOwner);

const bookRoutes = require('./books/book.routes');

app.use(express.json());
app.use('/books', bookRoutes);

const friendRoutes = require('./friends/friend.routes');
app.use('/friends', friendRoutes);

const loanRoutes = require('./loans/loan.routes');
app.use('/loans', loanRoutes);

module.exports = app;                // sharing the app 
