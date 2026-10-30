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

test('shows the error in red when lending Dune fails', async () => {
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

    const message = await screen.findByText('This book is already lent out');
    expect(message).toHaveStyle({ color: 'rgb(255, 0, 0)' }); // red
    expect(api.lendBook).toHaveBeenCalledWith('dune-id', 'sam-id'); // sent Dune and Sam, not the wrong IDs
});
