require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db');

async function start() {
    await connectDB(process.env.MONGO_URL)
    const port = process.env.PORT || 4000; // Render tells us which door number (port) to use; on my computer it's 4000 (client/vite.config.js points here)
    app.listen(port, () => console.log('server on ' + port)) // starting server

}

start();