const express = require ('express'); // load express
const app = express();               // make the app

app.get ('/health', (req,res) => {       // health route 
   res.send('ok')
});

module.exports = app;                // sharing the app 
