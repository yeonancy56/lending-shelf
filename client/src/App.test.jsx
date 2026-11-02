// Tests the lend form on the page. No server needed:
// the real api.js is swapped for a fake one, and the test tells the fake what to answer.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import App from './App';
import * as api from './api';

vi.mock('./api');

const DUNE = { _id: 'dune-id', title: 'Dune', author: 'Frank Herbert' };
const SAM = { _id: 'sam-id', name: 'Sam' };

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
    await user.selectOptions(screen.getByDisplayValue('Pick a book'), await screen.findByRole('option', { name: 'Dune' }));
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

    await user.type(screen.getByPlaceholderText('Title'), 'Dune');
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
