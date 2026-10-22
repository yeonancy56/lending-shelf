const express = require ('express'); // load express
const app = express();               // make the app

const bookRoutes = require('./routes/book.routes');

app.use(express.json());
app.use('/books', bookRoutes);

app.get ('/health', (req,res) => {       // health route 
   res.send('ok')
});

module.exports = app;                // sharing the app 
