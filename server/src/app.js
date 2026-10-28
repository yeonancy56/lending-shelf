const express = require ('express'); // load express
const app = express();               // make the app
const cors = require('cors');
app.use(cors());

const bookRoutes = require('./routes/book.routes');

app.use(express.json());
app.use('/books', bookRoutes);

const friendRoutes = require('./routes/friend.routes');
app.use('/friends', friendRoutes);

const loanRoutes = require('./routes/loan.routes');
app.use('/loans', loanRoutes);

app.get ('/health', (req,res) => {       // health route 
   res.send('ok')
});

module.exports = app;                // sharing the app 
