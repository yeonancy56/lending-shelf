// Tests the lend form on the page. No server needed:
// the real api.js is swapped for a fake one, and the test tells the fake what to answer.
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import * as api from './api';

vi.mock('./api');
// Google's real button can't run in a test, so a plain button stands in for it.
// Clicking it is like signing in with Google: the page gets back a sign-in
vi.mock('./GoogleSignIn', () => ({
    default: ({ onSignIn }) => <button onClick={() => onSignIn('a-google-sign-in')}>Sign in with Google</button>,
}));

// most tests are about the shelf, so they start signed in as me
beforeEach(() => {
    api.isSignedIn.mockReturnValue(true);
    api.whoAmI.mockResolvedValue({ who: 'owner' });
});

const DUNE = { _id: 'dune-id', title: 'Dune', author: 'Frank Herbert' };
const SAM = { _id: 'sam-id', name: 'Sam' };
const MATILDA = { _id: 'matilda-id', title: 'Matilda', author: 'Roald Dahl' };

test('marks the message as an error when lending Dune fails', async () => {
    // the shelf the page sees when it opens: Dune, Sam, and no loans yet
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    // and when you click Lend, the "server" says no
    api.lendBook.mockResolvedValue({ error: 'This book is already lent out' });

    const user = userEvent.setup();
    render(<App />);

    // pick Dune and Sam (findBy waits for the lists to arrive, like the real page does)
    await user.selectOptions(await screen.findByDisplayValue('Pick a book'), await screen.findByRole('option', { name: 'Dune' }));
    await user.selectOptions(screen.getByDisplayValue('Pick a friend'), await screen.findByRole('option', { name: 'Sam' }));

    // no message yet, so whatever shows up next was caused by clicking Lend
    expect(screen.queryByText('This book is already lent out')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Lend' }));

    // marked as an error, so a screen reader reads it out loud right away
    expect(await screen.findByRole('alert')).toHaveTextContent('This book is already lent out');
    expect(api.lendBook).toHaveBeenCalledWith('dune-id', 'sam-id'); // sent Dune and Sam, not the wrong IDs
});

test('shows the copy note in brackets, so two Dunes look different', async () => {
    // two copies of Dune on the shelf: one with no copy note, one signed
    api.getBooks.mockResolvedValue([DUNE, { ...DUNE, _id: 'signed-dune-id', copyNote: 'signed' }]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);

    render(<App />);

    // in the "Pick a book" list, where I choose which copy goes to Sam
    expect(await screen.findByRole('option', { name: 'Dune (signed)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Dune' })).toBeInTheDocument(); // no copy note = no brackets
});

test('marks the message as an error when adding a second Dune fails, and keeps what I typed', async () => {
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    // the "server" says no, because I already have Dune
    const message = "You already have Dune. Add a note, like 'signed', to tell them apart.";
    api.addBook.mockResolvedValue({ error: message });

    const user = userEvent.setup();
    render(<App />);

    await user.type(await screen.findByPlaceholderText('Title'), 'Dune');
    await user.type(screen.getByPlaceholderText('Author'), 'Frank Herbert');
    await user.type(screen.getByPlaceholderText("Note (optional, like 'signed')"), 'paperback');
    await user.click(screen.getByRole('button', { name: 'Add book' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message); // marked as an error
    // the boxes still hold what I typed, so I only need to change what's wrong
    expect(screen.getByPlaceholderText('Title')).toHaveValue('Dune');
    expect(screen.getByPlaceholderText('Author')).toHaveValue('Frank Herbert');
    expect(screen.getByPlaceholderText("Note (optional, like 'signed')")).toHaveValue('paperback');
});

test('marks "Something went wrong" as an error when the server breaks while returning Dune', async () => {
    // Sam has Dune, so there's a Return button
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([{ _id: 'loan-id', book: DUNE, friend: SAM }]);
    // and when you click Return, the fake api.js answers the way it does for a breakdown
    api.returnLoan.mockResolvedValue({ error: 'Something went wrong. Try again.' });

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Return' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.'); // marked as an error
});

test('marks "Something went wrong" as an error when the lists can\'t load as the page opens', async () => {
    // the wifi is down, so all three lists come back as a breakdown instead of Dune and Sam
    api.getBooks.mockResolvedValue({ error: 'Something went wrong. Try again.' });
    api.getFriends.mockResolvedValue({ error: 'Something went wrong. Try again.' });
    api.getLoans.mockResolvedValue({ error: 'Something went wrong. Try again.' });

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.'); // one message, at the top
});

test('keeps "Something went wrong" up when only Loans broke and adding a book works', async () => {
    // Dune and Sam load fine, but the loans list breaks
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue({ error: 'Something went wrong. Try again.' });
    api.addBook.mockResolvedValue({ _id: 'matilda-id', title: 'Matilda', author: 'Roald Dahl' });

    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.');

    // adding Matilda works and reloads the books, but Loans is still missing
    api.getBooks.mockResolvedValue([DUNE, { _id: 'matilda-id', title: 'Matilda', author: 'Roald Dahl' }]);
    await user.type(screen.getByPlaceholderText('Title'), 'Matilda');
    await user.type(screen.getByPlaceholderText('Author'), 'Roald Dahl');
    await user.click(screen.getByRole('button', { name: 'Add book' }));
    expect(await screen.findByRole('option', { name: 'Matilda' })).toBeInTheDocument();

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Try again.'); // still up
});

test('shows when each book is due back, and marks an overdue one', async () => {
    api.getBooks.mockResolvedValue([DUNE, MATILDA]);
    api.getFriends.mockResolvedValue([SAM]);
    // midday, so the day is the same in every time zone
    api.getLoans.mockResolvedValue([
        { _id: 'loan-1', book: DUNE, friend: SAM, dueBack: '2026-11-16T12:00:00.000Z', overdue: true },
        { _id: 'loan-2', book: MATILDA, friend: SAM, dueBack: '2026-11-20T12:00:00.000Z', overdue: false },
    ]);

    render(<App />);

    const duneLine = (await screen.findByText(/Dune → Sam/)).closest('li');
    const matildaLine = screen.getByText(/Matilda → Sam/).closest('li');
    expect(duneLine).toHaveTextContent('due back 16 Nov · overdue');
    expect(duneLine).toHaveClass('overdue'); // the class that turns the line red
    expect(matildaLine).toHaveTextContent('due back 20 Nov');
    expect(matildaLine).not.toHaveTextContent('overdue');
    expect(matildaLine).not.toHaveClass('overdue');
});

test('clicking a spine puts that book in the form, ready to edit', async () => {
    api.getBooks.mockResolvedValue([{ ...DUNE, copyNote: 'signed' }]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Dune \(signed\)/ })); // the spine

    expect(screen.getByPlaceholderText('Title')).toHaveValue('Dune');
    expect(screen.getByPlaceholderText('Author')).toHaveValue('Frank Herbert');
    expect(screen.getByPlaceholderText("Note (optional, like 'signed')")).toHaveValue('signed');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add book' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dune \(signed\)/ })).toHaveAttribute('aria-pressed', 'true'); // the highlighted spine
});

test('Save sends the fixed author, then the form goes back to adding books', async () => {
    api.getBooks.mockResolvedValue([{ ...DUNE, author: 'Frank Hebert' }]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    api.updateBook.mockResolvedValue(DUNE);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Dune/ }));
    api.getBooks.mockResolvedValue([DUNE]); // what the shelf looks like after saving
    await user.clear(screen.getByPlaceholderText('Author'));
    await user.type(screen.getByPlaceholderText('Author'), 'Frank Herbert');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(api.updateBook).toHaveBeenCalledWith('dune-id', { title: 'Dune', author: 'Frank Herbert', copyNote: '' });
    expect(await screen.findByText('by Frank Herbert')).toBeInTheDocument(); // the shelf shows the fixed name
    expect(api.getLoans).toHaveBeenCalledTimes(2); // the loans list reloads too, so it shows the fixed name
    expect(screen.getByRole('button', { name: 'Add book' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Author')).toHaveValue('');
});

test('Cancel empties the form and goes back to adding books, without saving', async () => {
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Dune/ }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByPlaceholderText('Title')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Add book' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dune/ })).toHaveAttribute('aria-pressed', 'false'); // no longer highlighted
    expect(api.updateBook).not.toHaveBeenCalled();
});

test('a Save that fails shows the red message and keeps what I typed, still ready to save', async () => {
    api.getBooks.mockResolvedValue([DUNE, { ...DUNE, _id: 'signed-dune-id', copyNote: 'signed' }]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    const message = 'You already have Dune (signed). Use a different note.';
    api.updateBook.mockResolvedValue({ error: message });

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /^Dune by/ })); // the Dune with no copy note
    await user.type(screen.getByPlaceholderText("Note (optional, like 'signed')"), 'signed');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByPlaceholderText("Note (optional, like 'signed')")).toHaveValue('signed');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument(); // fix the note and try again
});

test('clicking Sam opens Sam\'s panel with what Sam has now, and Close shuts it', async () => {
    api.getBooks.mockResolvedValue([DUNE, MATILDA]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    // the "server" says Sam has 2 books right now, one overdue, and the limit is 3
    api.getFriendLoans.mockResolvedValue({
        active: [
            { _id: 'loan-1', book: DUNE, dueBack: '2026-11-16T12:00:00.000Z', overdue: true },
            { _id: 'loan-2', book: MATILDA, dueBack: '2026-11-20T12:00:00.000Z', overdue: false },
        ],
        returned: [],
        limit: 3,
    });

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Sam' })); // Sam's name in the Friends list

    const panel = await screen.findByRole('region', { name: "Sam's loans" });
    expect(api.getFriendLoans).toHaveBeenCalledWith('sam-id');
    expect(panel).toHaveTextContent('2 of 3 books');
    const duneLine = within(panel).getByText(/Dune/).closest('li');
    const matildaLine = within(panel).getByText(/Matilda/).closest('li');
    expect(duneLine).toHaveTextContent('due back 16 Nov · overdue');
    expect(duneLine).toHaveClass('overdue'); // red, like the loans list
    expect(matildaLine).toHaveTextContent('due back 20 Nov');
    expect(matildaLine).not.toHaveClass('overdue');

    await user.click(within(panel).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('region', { name: "Sam's loans" })).not.toBeInTheDocument();
});

test('Sam\'s panel lists past loans in the server\'s order, newest first, with when each was lent and returned', async () => {
    const EMMA = { _id: 'emma-id', title: 'Emma', author: 'Jane Austen' };
    api.getBooks.mockResolvedValue([DUNE, EMMA]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    api.getFriendLoans.mockResolvedValue({
        active: [],
        returned: [
            { _id: 'loan-2', book: EMMA, lentAt: '2026-09-01T12:00:00.000Z', returnedAt: '2026-09-10T12:00:00.000Z' },
            { _id: 'loan-1', book: DUNE, lentAt: '2026-07-01T12:00:00.000Z', returnedAt: '2026-07-05T12:00:00.000Z' },
        ],
        limit: 3,
    });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));

    const returned = within(await screen.findByRole('region', { name: "Sam's loans" })).getByRole('list', { name: 'Past loans' });
    const lines = within(returned).getAllByRole('listitem');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveTextContent('Emma, lent 1 Sept, returned 10 Sept');
    expect(lines[1]).toHaveTextContent('Dune, lent 1 Jul, returned 5 Jul');
});

test('Sam\'s panel says "Nothing right now" and "No past loans yet" when Sam has never borrowed anything', async () => {
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    api.getFriendLoans.mockResolvedValue({ active: [], returned: [], limit: 3 });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));

    const panel = await screen.findByRole('region', { name: "Sam's loans" });
    expect(panel).toHaveTextContent('0 of 3 books');
    expect(panel).toHaveTextContent('Nothing right now');
    expect(panel).toHaveTextContent('No past loans yet');
});

test('Sam\'s panel shows the red message when the server can\'t send Sam\'s loans', async () => {
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    api.getFriendLoans.mockResolvedValue({ error: 'Something went wrong. Try again.' });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));

    const panel = await screen.findByRole('region', { name: "Sam's loans" });
    expect(within(panel).getByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
    expect(within(panel).getByRole('button', { name: 'Close' })).toBeInTheDocument(); // so I can still close it
});

test('Sam\'s panel updates when Sam returns Dune while the panel is open', async () => {
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([{ _id: 'loan-id', book: DUNE, friend: SAM, dueBack: '2026-11-16T12:00:00.000Z' }]);
    api.returnLoan.mockResolvedValue({ _id: 'loan-id' });
    // first Sam has Dune. After the return, the "server" says Sam has nothing
    api.getFriendLoans
        .mockResolvedValueOnce({ active: [{ _id: 'loan-id', book: DUNE, dueBack: '2026-11-16T12:00:00.000Z', overdue: false }], returned: [], limit: 3 })
        .mockResolvedValueOnce({ active: [], returned: [], limit: 3 });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));
    const panel = await screen.findByRole('region', { name: "Sam's loans" });
    expect(panel).toHaveTextContent('1 of 3 books');

    await user.click(screen.getByRole('button', { name: 'Return' })); // in the loans list, not the panel

    expect(await within(panel).findByText('0 of 3 books')).toBeInTheDocument();
    expect(api.getFriendLoans).toHaveBeenLastCalledWith('sam-id');
});

test('a slow answer for Sam doesn\'t show up in Alex\'s panel', async () => {
    const ALEX = { _id: 'alex-id', name: 'Alex' };
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM, ALEX]);
    api.getLoans.mockResolvedValue([]);
    // Sam's answer is slow: it only arrives when the test says so
    let sendSamsAnswer;
    const samsAnswer = new Promise((resolve) => { sendSamsAnswer = resolve; });
    api.getFriendLoans.mockImplementation((id) => id === 'sam-id'
        ? samsAnswer
        : Promise.resolve({ active: [], returned: [], limit: 3 }));

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));
    await user.click(screen.getByRole('button', { name: 'Alex' })); // changed my mind before Sam's loans arrived
    const panel = await screen.findByRole('region', { name: "Alex's loans" });
    expect(panel).toHaveTextContent('0 of 3 books');

    // now Sam's late answer arrives: Sam has Dune
    await act(async () => { // act waits until the page has finished redrawing
        sendSamsAnswer({ active: [{ _id: 'loan-id', book: DUNE, dueBack: '2026-11-16T12:00:00.000Z', overdue: false }], returned: [], limit: 3 });
    });

    expect(screen.getByRole('region', { name: "Alex's loans" })).toHaveTextContent('0 of 3 books'); // still Alex's, not Sam's Dune
});

test('Sam\'s panel says "Loading…" while Sam\'s loans are on the way', async () => {
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    let sendSamsAnswer;
    api.getFriendLoans.mockReturnValue(new Promise((resolve) => { sendSamsAnswer = resolve; }));

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));

    const panel = await screen.findByRole('region', { name: "Sam's loans" });
    expect(panel).toHaveTextContent('Loading…');

    await act(async () => { sendSamsAnswer({ active: [], returned: [], limit: 3 }); });

    expect(panel).toHaveTextContent('0 of 3 books');
    expect(panel).not.toHaveTextContent('Loading…');
});


// the shelf, as spines: each spine is a button named like "Dune by Frank Herbert"
function spine(name) {
    return screen.queryByRole('button', { name: (spineName) => spineName.startsWith(`${name} by`) });
}

test('typing part of a title or author, in any capitals, leaves only matching books on the shelf', async () => {
    api.getBooks.mockResolvedValue([DUNE, MATILDA]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Dune by Frank Herbert' }); // the shelf has loaded
    const search = screen.getByRole('searchbox', { name: 'Search books' });

    await user.type(search, 'HERB'); // part of "Frank Herbert", in capitals
    expect(spine('Dune')).toBeInTheDocument();
    expect(spine('Matilda')).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'mati'); // part of "Matilda"
    expect(spine('Matilda')).toBeInTheDocument();
    expect(spine('Dune')).not.toBeInTheDocument();
});

test('copy notes aren\'t searched, and the shelf says so when nothing matches', async () => {
    api.getBooks.mockResolvedValue([{ ...DUNE, copyNote: 'signed' }, MATILDA]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Matilda by Roald Dahl' });

    await user.type(screen.getByRole('searchbox', { name: 'Search books' }), ' signed '); // only in Dune's copy note, with stray spaces

    expect(spine('Dune (signed)')).not.toBeInTheDocument();
    expect(spine('Matilda')).not.toBeInTheDocument();
    expect(screen.getByText("No books match 'signed'")).toBeInTheDocument();
});

test('"Pick a book" still lists every book while searching, and emptying the box brings the whole shelf back', async () => {
    api.getBooks.mockResolvedValue([DUNE, MATILDA]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Dune by Frank Herbert' });
    const search = screen.getByRole('searchbox', { name: 'Search books' });

    await user.type(search, 'dune');
    expect(spine('Matilda')).not.toBeInTheDocument(); // gone from the shelf...
    expect(screen.getByRole('option', { name: 'Matilda' })).toBeInTheDocument(); // ...but I can still lend it

    await user.clear(search);
    expect(spine('Dune')).toBeInTheDocument();
    expect(spine('Matilda')).toBeInTheDocument();
});

test('adding a book empties the search box, so the new book shows on the shelf', async () => {
    // the shelf has Dune. After adding, the "server" sends Dune and Matilda
    api.getBooks.mockResolvedValueOnce([DUNE]).mockResolvedValue([DUNE, MATILDA]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    api.addBook.mockResolvedValue(MATILDA);

    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Dune by Frank Herbert' });
    const search = screen.getByRole('searchbox', { name: 'Search books' });
    await user.type(search, 'herb'); // Matilda won't match this

    await user.type(screen.getByPlaceholderText('Title'), 'Matilda');
    await user.type(screen.getByPlaceholderText('Author'), 'Roald Dahl');
    await user.click(screen.getByRole('button', { name: 'Add book' }));

    expect(await screen.findByRole('button', { name: 'Matilda by Roald Dahl' })).toBeInTheDocument();
    expect(search).toHaveValue('');
});

test('signed out, the page shows only the sign-in button and asks the server for nothing', async () => {
    api.isSignedIn.mockReturnValue(false);
    api.getBooks.mockClear();
    api.getFriends.mockClear();
    api.getLoans.mockClear();

    render(<App />);

    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Books' })).not.toBeInTheDocument();
    expect(api.getBooks).not.toHaveBeenCalled();
    expect(api.getFriends).not.toHaveBeenCalled();
    expect(api.getLoans).not.toHaveBeenCalled();
});

test('signing in with my Google account shows my shelf', async () => {
    api.isSignedIn.mockReturnValue(false);
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(api.saveSignIn).toHaveBeenCalledWith('a-google-sign-in'); // kept, so a reload stays signed in
    expect(await screen.findByRole('button', { name: /Dune/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in with Google' })).not.toBeInTheDocument();
});

test('signing in with someone else\'s Google account says they\'re not on the list, and shows no books', async () => {
    api.isSignedIn.mockReturnValue(false);
    // the server says 401 to a stranger, and api.js tells the page (api.test.js checks that part)
    const notOnTheList = async () => {
        const tellThePage = api.whenSignedOut.mock.lastCall[0];
        tellThePage("You're not on the list.");
        return { error: "You're not on the list." };
    };
    api.getBooks.mockImplementation(notOnTheList);
    api.getFriends.mockImplementation(notOnTheList);
    api.getLoans.mockImplementation(notOnTheList);

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("You're not on the list.");
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument(); // back to the sign-in button
    expect(screen.queryByRole('heading', { name: 'Books' })).not.toBeInTheDocument();
});

test('Sign out forgets me and goes back to the sign-in button', async () => {
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: /Dune/ });
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(api.signOut).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dune/ })).not.toBeInTheDocument();
});

const EMAIL_BOX = 'Google email (optional)';

test('adding Sam sends the Google email I typed, then empties the form', async () => {
    api.getBooks.mockResolvedValue([]);
    api.getFriends.mockResolvedValue([]);
    api.getLoans.mockResolvedValue([]);
    api.addFriend.mockResolvedValue({ ...SAM, email: 'sam@gmail.com' });

    const user = userEvent.setup();
    render(<App />);

    await user.type(await screen.findByPlaceholderText('Name'), 'Sam');
    await user.type(screen.getByPlaceholderText(EMAIL_BOX), 'Sam@Gmail.com');
    await user.click(screen.getByRole('button', { name: 'Add Friend' }));

    expect(api.addFriend).toHaveBeenCalledWith({ name: 'Sam', email: 'Sam@Gmail.com' });
    expect(screen.getByPlaceholderText('Name')).toHaveValue('');
    expect(screen.getByPlaceholderText(EMAIL_BOX)).toHaveValue('');
});

test('an email another friend already has shows the red message, and keeps what I typed', async () => {
    api.getBooks.mockResolvedValue([]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    api.addFriend.mockResolvedValue({ error: 'Sam already has this email.' });

    const user = userEvent.setup();
    render(<App />);

    await user.type(await screen.findByPlaceholderText('Name'), 'Alex');
    await user.type(screen.getByPlaceholderText(EMAIL_BOX), 'sam@gmail.com');
    await user.click(screen.getByRole('button', { name: 'Add Friend' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Sam already has this email.');
    expect(screen.getByPlaceholderText('Name')).toHaveValue('Alex');
    expect(screen.getByPlaceholderText(EMAIL_BOX)).toHaveValue('sam@gmail.com');
});

// Sam's panel is open, and the "server" says Sam has nothing borrowed
function samsPanelIsEmpty() {
    api.getFriendLoans.mockResolvedValue({ active: [], returned: [], limit: 3 });
}

test('Edit in Sam\'s panel puts Sam\'s name and email in the friend form', async () => {
    api.getBooks.mockResolvedValue([]);
    api.getFriends.mockResolvedValue([{ ...SAM, email: 'sam@gmail.com' }]);
    api.getLoans.mockResolvedValue([]);
    samsPanelIsEmpty();

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));
    const panel = await screen.findByRole('region', { name: "Sam's loans" });
    await user.click(within(panel).getByRole('button', { name: 'Edit' }));

    expect(screen.getByPlaceholderText('Name')).toHaveValue('Sam');
    expect(screen.getByPlaceholderText(EMAIL_BOX)).toHaveValue('sam@gmail.com');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Friend' })).not.toBeInTheDocument();
});

test('emptying Sam\'s email box and saving removes Sam\'s email, then the form goes back to adding friends', async () => {
    api.getBooks.mockResolvedValue([]);
    api.getFriends.mockResolvedValue([{ ...SAM, email: 'sam@gmail.com' }]);
    api.getLoans.mockResolvedValue([]);
    samsPanelIsEmpty();
    api.updateFriend.mockResolvedValue(SAM);

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));
    await user.click(within(await screen.findByRole('region', { name: "Sam's loans" })).getByRole('button', { name: 'Edit' }));
    api.getFriends.mockResolvedValue([SAM]); // what the list looks like after saving
    await user.clear(screen.getByPlaceholderText(EMAIL_BOX));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(api.updateFriend).toHaveBeenCalledWith('sam-id', { name: 'Sam', email: '' });
    expect(await screen.findByRole('button', { name: 'Add Friend' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toHaveValue('');
    expect(api.getFriends).toHaveBeenCalledTimes(2); // the friends list reloads
    expect(api.getLoans).toHaveBeenCalledTimes(2); // and the loans list, which shows Sam's name
});

test('changing Sam\'s email to my own shows the red message, and keeps it in the box ready to fix', async () => {
    api.getBooks.mockResolvedValue([]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    samsPanelIsEmpty();
    const message = "That's your own email. A friend needs their own.";
    api.updateFriend.mockResolvedValue({ error: message });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));
    await user.click(within(await screen.findByRole('region', { name: "Sam's loans" })).getByRole('button', { name: 'Edit' }));
    await user.type(screen.getByPlaceholderText(EMAIL_BOX), 'nancy@gmail.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(api.updateFriend).toHaveBeenCalledWith('sam-id', { name: 'Sam', email: 'nancy@gmail.com' });
    expect(screen.getByPlaceholderText(EMAIL_BOX)).toHaveValue('nancy@gmail.com');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
});

test('Cancel empties the friend form without saving', async () => {
    api.getBooks.mockResolvedValue([]);
    api.getFriends.mockResolvedValue([{ ...SAM, email: 'sam@gmail.com' }]);
    api.getLoans.mockResolvedValue([]);
    samsPanelIsEmpty();
    api.updateFriend.mockClear();

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Sam' }));
    await user.click(within(await screen.findByRole('region', { name: "Sam's loans" })).getByRole('button', { name: 'Edit' }));
    // the friend form's Cancel, not the book form's
    const friendForm = screen.getByPlaceholderText('Name').closest('form');
    await user.click(within(friendForm).getByRole('button', { name: 'Cancel' }));

    expect(screen.getByPlaceholderText('Name')).toHaveValue('');
    expect(screen.getByPlaceholderText(EMAIL_BOX)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Add Friend' })).toBeInTheDocument();
    expect(api.updateFriend).not.toHaveBeenCalled();
});

// Sam is signed in. The "server" says who Sam is, what's on the shelf, and Sam's own loans and requests
function signedInAsSam({ shelf = [], myLoans = { active: [], returned: [], limit: 3 }, myRequests = [] } = {}) {
    api.whoAmI.mockResolvedValue({ who: 'friend', name: 'Sam' });
    api.getShelf.mockResolvedValue(shelf);
    api.getMyLoans.mockResolvedValue(myLoans);
    api.getMyRequests.mockResolvedValue(myRequests);
}

test('signing in with Sam\'s Google account shows the friend page, not mine', async () => {
    api.isSignedIn.mockReturnValue(false);
    signedInAsSam();
    api.getBooks.mockClear();
    api.getFriends.mockClear();
    api.getLoans.mockClear();

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(await screen.findByRole('heading', { name: 'Hi, Sam' })).toBeInTheDocument();
    expect(api.whoAmI).toHaveBeenCalled();
    // my lists hold every friend's name, so the friend page never asks for them
    expect(api.getBooks).not.toHaveBeenCalled();
    expect(api.getFriends).not.toHaveBeenCalled();
    expect(api.getLoans).not.toHaveBeenCalled();
});

test('the friend page shows every book as "lent out" or "on the shelf", and never who has it', async () => {
    signedInAsSam({ shelf: [
        { ...DUNE, copyNote: 'signed', state: 'lent out' },
        { ...MATILDA, state: 'on the shelf' },
    ] });

    render(<App />);

    const shelf = await screen.findByRole('list', { name: 'Books' });
    const books = await within(shelf).findAllByRole('listitem');
    expect(books[0]).toHaveTextContent('Dune (signed) by Frank Herbert · lent out');
    expect(books[1]).toHaveTextContent('Matilda by Roald Dahl · on the shelf');
    expect(shelf).not.toHaveTextContent('Alex'); // no "→ Alex" like on my Loans list
    expect(shelf).not.toHaveTextContent('→');
});

test('the friend page shows none of my buttons or boxes: no lend, return, add, edit or delete', async () => {
    signedInAsSam({
        shelf: [{ ...DUNE, state: 'lent out' }],
        myLoans: { active: [{ _id: 'loan-1', book: DUNE, lentAt: '2026-11-01T10:00:00Z', dueBack: '2026-11-15T10:00:00Z', overdue: false }], returned: [], limit: 3 },
    });

    render(<App />);
    await screen.findByRole('heading', { name: 'Hi, Sam' });
    await screen.findByText(/due back/);

    // Sign out is the only button, and there's nothing to type in
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Sign out']);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument(); // no "Pick a book" or "Pick a friend"
});

test('Sam sees Dune with its due back day and overdue, and Matilda as a past loan', async () => {
    signedInAsSam({ myLoans: {
        active: [{ _id: 'loan-1', book: DUNE, lentAt: '2026-10-01T10:00:00Z', dueBack: '2026-10-15T10:00:00Z', overdue: true }],
        returned: [{ _id: 'loan-2', book: MATILDA, lentAt: '2026-09-01T10:00:00Z', returnedAt: '2026-09-10T10:00:00Z', overdue: false }],
        limit: 3,
    } });

    render(<App />);

    const myLoans = await screen.findByRole('region', { name: 'My loans' });
    expect(await within(myLoans).findByText('1 of 3 books')).toBeInTheDocument();
    expect(within(myLoans).getByRole('list', { name: 'Has now' })).toHaveTextContent('Dune, due back 15 Oct · overdue');
    expect(within(myLoans).getByRole('list', { name: 'Past loans' })).toHaveTextContent('Matilda, lent 1 Sept, returned 10 Sept');
});

test('only books on the shelf get an Ask button: not "lent out" or "asked for" ones', async () => {
    signedInAsSam({ shelf: [
        { ...DUNE, state: 'lent out' },
        { ...MATILDA, state: 'on the shelf' },
        { _id: 'emma-id', title: 'Emma', author: 'Jane Austen', state: 'asked for' },
    ] });

    render(<App />);

    const books = await within(await screen.findByRole('list', { name: 'Books' })).findAllByRole('listitem');
    expect(within(books[0]).queryByRole('button', { name: 'Ask' })).not.toBeInTheDocument();
    expect(within(books[1]).getByRole('button', { name: 'Ask' })).toBeInTheDocument();
    expect(books[2]).toHaveTextContent('Emma by Jane Austen · asked for');
    expect(within(books[2]).queryByRole('button', { name: 'Ask' })).not.toBeInTheDocument();
});

test('Sam clicks Ask on Matilda: it\'s sent, then Matilda says "asked for" and shows in My requests as waiting', async () => {
    signedInAsSam({ shelf: [{ ...MATILDA, state: 'on the shelf' }] });
    api.askForBook.mockResolvedValue({ _id: 'request-1', book: 'matilda-id', status: 'waiting' });

    const user = userEvent.setup();
    render(<App />);
    const ask = await screen.findByRole('button', { name: 'Ask' });
    // what the "server" says once Sam's request is saved
    api.getShelf.mockResolvedValue([{ ...MATILDA, state: 'asked for' }]);
    api.getMyRequests.mockResolvedValue([{ _id: 'request-1', book: MATILDA, status: 'waiting', askedAt: '2026-11-02T10:00:00Z' }]);
    await user.click(ask);

    expect(api.askForBook).toHaveBeenCalledWith('matilda-id');
    const myRequests = await screen.findByRole('list', { name: 'My requests' });
    expect(await within(myRequests).findByText(/Matilda/)).toHaveTextContent('Matilda · waiting');
    expect(screen.getByRole('list', { name: 'Books' })).toHaveTextContent('Matilda by Roald Dahl · asked for');
    expect(screen.queryByRole('button', { name: 'Ask' })).not.toBeInTheDocument();
});

test('when a lending rule says no to Sam\'s Ask, Sam sees the red message', async () => {
    signedInAsSam({ shelf: [{ ...MATILDA, state: 'on the shelf' }] });
    api.askForBook.mockResolvedValue({ error: 'You already have 3 books and requests' });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Ask' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You already have 3 books and requests');
});

test('My requests lists every request with its status, and only waiting ones get a Cancel button', async () => {
    signedInAsSam({ myRequests: [
        { _id: 'request-2', book: DUNE, status: 'waiting', askedAt: '2026-11-02T10:00:00Z' },
        { _id: 'request-1', book: MATILDA, status: 'cancelled', askedAt: '2026-10-01T10:00:00Z', cancelledAt: '2026-10-02T10:00:00Z' },
    ] });

    render(<App />);

    const items = await within(await screen.findByRole('list', { name: 'My requests' })).findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Dune · waiting');
    expect(within(items[0]).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(items[1]).toHaveTextContent('Matilda · cancelled');
    expect(within(items[1]).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
});

test('My requests says so when Sam has never asked for anything', async () => {
    signedInAsSam();

    render(<App />);

    const myRequests = await screen.findByRole('region', { name: 'My requests' });
    expect(await within(myRequests).findByText('No requests yet')).toBeInTheDocument();
});

test('Sam cancels the waiting request for Dune: it\'s sent, then it shows as cancelled and Dune is on the shelf again', async () => {
    signedInAsSam({
        shelf: [{ ...DUNE, state: 'asked for' }],
        myRequests: [{ _id: 'request-1', book: DUNE, status: 'waiting', askedAt: '2026-11-02T10:00:00Z' }],
    });
    api.cancelRequest.mockResolvedValue({ _id: 'request-1', status: 'cancelled' });

    const user = userEvent.setup();
    render(<App />);
    const cancel = await screen.findByRole('button', { name: 'Cancel' });
    api.getShelf.mockResolvedValue([{ ...DUNE, state: 'on the shelf' }]);
    api.getMyRequests.mockResolvedValue([{ _id: 'request-1', book: DUNE, status: 'cancelled', askedAt: '2026-11-02T10:00:00Z', cancelledAt: '2026-11-02T11:00:00Z' }]);
    await user.click(cancel);

    expect(api.cancelRequest).toHaveBeenCalledWith('request-1');
    expect(await screen.findByText('Dune · cancelled')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Ask' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
});

test('when Cancel fails, Sam sees the red message', async () => {
    signedInAsSam({ myRequests: [{ _id: 'request-1', book: DUNE, status: 'waiting', askedAt: '2026-11-02T10:00:00Z' }] });
    api.cancelRequest.mockResolvedValue({ error: 'This request was already cancelled' });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This request was already cancelled');
});

test('signing in as me still shows my page', async () => {
    api.isSignedIn.mockReturnValue(false);
    api.getBooks.mockResolvedValue([DUNE]);
    api.getFriends.mockResolvedValue([SAM]);
    api.getLoans.mockResolvedValue([]);
    api.getShelf.mockClear();

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(await screen.findByRole('button', { name: 'Lend' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hi, Sam' })).not.toBeInTheDocument();
    expect(api.getShelf).not.toHaveBeenCalled();
});

test('when "who am I?" breaks, the page says something went wrong and still lets me sign out', async () => {
    api.whoAmI.mockResolvedValue({ error: 'Something went wrong. Try again.' });

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument();
});
