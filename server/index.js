require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db');

async function start() {
    await connectDB(process.env.MONGO_URL)
    app.listen(4000, () => console.log('server on 4000')) // starting server

}

start();