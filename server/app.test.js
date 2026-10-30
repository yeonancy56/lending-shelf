// Checks the server can find all its files and start up.
// If a file moves and a path breaks, loading the app crashes and this test fails.
// No database needed: the app only connects to MongoDB in index.js.
const request = require('supertest');
const app = require('./src/app');

test('server starts and answers /health', async () => {
    const res = await request(app).get('/health');
    expect(res.text).toBe('ok');
});
