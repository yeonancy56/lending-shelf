// Checks the server can find all its files and start up.
// If a file moves and a path breaks, loading the app crashes and this test fails.
// No database needed: the app only connects to MongoDB in index.js.
const app = require('./src/app');

test('server starts and answers /health', async () => {
    const server = app.listen(0); // 0 = pick any free port
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/health`);
    expect(await res.text()).toBe('ok');

    server.close();
});
