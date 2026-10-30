// A pretend database for tests: it starts empty, lives in memory, and is thrown away after.
// The real database from .env is never touched.
const os = require('os');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function start() {
    mongoServer = await MongoMemoryServer.create();
    // The MongoDB driver normally loads Node's os tool with import('os'), which Jest blocks.
    // So we hand it over ourselves. Without this, connecting fails with "Missing required sub-document 'driver'".
    await mongoose.connect(mongoServer.getUri(), { runtimeAdapters: { os } });
}

// empty every collection, so each test starts with a clean shelf
async function clear() {
    const collections = mongoose.connection.collections;
    for (const name in collections) {
        await collections[name].deleteMany({});
    }
}

async function stop() {
    await mongoose.disconnect();
    await mongoServer?.stop(); // the ?. skips this if the pretend database never started, so the real error shows
}

module.exports = { start, clear, stop };
