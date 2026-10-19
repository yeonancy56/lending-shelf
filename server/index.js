const express = require ('express');
const app = express();

app.get ('/health', (req,res) => {
   res.send('ok')
});

app.listen(4000, () => console.log('server on 4000'))