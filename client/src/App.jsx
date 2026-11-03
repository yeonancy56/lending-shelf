import { useState, useEffect, useRef } from 'react'; //useState = memory, what should the page remember, useEffect = do something at a certain time
import { getBooks, addBook, updateBook, getFriends, addFriend, getFriendLoans, getLoans, lendBook, returnLoan} from './api';

// a book's name on the page: "Dune (signed)" when it has a copy note, just "Dune" when it doesn't
function bookName(book) {
  return book.copyNote ? `${book.title} (${book.copyNote})` : book.title;
}

// a short day, like "16 Nov", for when a book is due back, was lent, or came back.
// The server sends the exact moment, and this turns it into the day on my own calendar
function shortDay(dueBack) {
  return new Date(dueBack).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// a red message, like "This book is already lent out". Marked as an alert so a screen reader
// reads it out loud right away. Shows nothing when there's no message
// does this book match what I typed in the search box? "herb" finds Dune by Frank Herbert.
// Capitals don't matter, part of a word is enough, and only title and author count, not the copy note
function matchesSearch(book, search) {
  const words = search.trim().toLowerCase();
  return book.title.toLowerCase().includes(words) || book.author.toLowerCase().includes(words);
}

function ErrorMessage({ message }) {
  return message ? <p className="error" role="alert">{message}</p> : null;
}

// fill a list with the server's answer, and remember whether that list broke,
// so the red message at the top stays until every broken list has loaded
function fillList(result, list, setList, setListErrors) {
  setListErrors((errors) => ({ ...errors, [list]: result.error || '' }));
  if (!result.error) {
    setList(result);
  }
}

// one friend's loans, in a box under the Friends list: how many they have, what they have now, and what they had before.
// loans is null while the server hasn't answered yet
function FriendPanel({ friend, loans, onClose }) {
  return (
    <section aria-labelledby="friend-panel-title">
      <h3 id="friend-panel-title">{friend.name}'s loans</h3>
      {!loans && <p>Loading…</p>} {/* Sam's loans are still on the way */}
      <ErrorMessage message={loans?.error} />
      {loans && !loans.error && <FriendLoans loans={loans} />}
      <button onClick={onClose}>Close</button>
    </section>
  );
}

// what's inside the panel once the server has sent Sam's loans
function FriendLoans({ loans }) {
  return (
    <>
      <p>{loans.active.length} of {loans.limit} books</p>
      <h4 id="friend-has-now">Has now</h4>
      {loans.active.length === 0 && <p>Nothing right now</p>}
      <ul aria-labelledby="friend-has-now">
        {loans.active.map((loan) => (
          <li key={loan._id} className={loan.overdue ? 'overdue' : undefined}>
            {bookName(loan.book)}, due back {shortDay(loan.dueBack)}
            {loan.overdue && ' · overdue'}
          </li>
        ))}
      </ul>
      <h4 id="friend-past-loans">Past loans</h4>
      {loans.returned.length === 0 && <p>No past loans yet</p>}
      <ul aria-labelledby="friend-past-loans"> {/* newest first, the order the server sends */}
        {loans.returned.map((loan) => (
          <li key={loan._id}>
            {bookName(loan.book)}, lent {shortDay(loan.lentAt)}, returned {shortDay(loan.returnedAt)}
          </li>
        ))}
      </ul>
    </>
  );
}

function App() { //these are memory boxes 
  const[books, setBooks] = useState([]);
  const[title, setTitle] = useState('');
  const[author, setAuthor] = useState('');
  const[copyNote, setCopyNote] = useState(''); // optional, like "signed"
  const[editingId, setEditingId] = useState(''); // the book in the form for editing, or '' when the form adds a new book
  const[search, setSearch] = useState(''); // what I typed in the search box above the shelf
  const[friends, setFriends] = useState([]);
  const[name, setName] = useState('');
  const[openFriend, setOpenFriend] = useState(null); // the friend whose panel is open, or null when it's closed
  const[friendLoans, setFriendLoans] = useState(null); // that friend's loans, once the server answers
  // the friend I last asked the server about. A ref, not useState, because the page doesn't show it
  const askedFriendId = useRef(null);
  const[loans, setLoans] = useState([]);
  const[bookId, setBookId] = useState('');
  const[friendId, setFriendId] = useState('');
  const[loanError, setLoanError] = useState(''); // the red message under the lend form, for Lend and Return
  const[bookError, setBookError] = useState(''); // the red message under the book form
  const[friendError, setFriendError] = useState(''); // the red message under the friend form
  const[listErrors, setListErrors] = useState({}); // which lists couldn't load, like { loans: 'Something went wrong. Try again.' }
  const listError = Object.values(listErrors).find((error) => error); // the red message at the top, if any list is broken
  const shelfBooks = books.filter((book) => matchesSearch(book, search)); // the books on the shelf right now

  function loadBooks() { //load function, fill a list from the server
    return getBooks().then((result) => fillList(result, 'books', setBooks, setListErrors)); // fill the list in once the server answers
  }
  
  // empty the book form, and go back to adding a new book
  function resetBookForm() {
    setEditingId('');
    setBookError('');
    setTitle(''); //clear the text box
    setAuthor(''); //clear the text box
    setCopyNote(''); //clear the text box
  }

  async function handleSaveBook(e) { // this function runs when you click Add book or Save
    e.preventDefault(); //Dont refresh the page
    const form = { title: title, author: author, copyNote: copyNote }; // what you typed, ex title = "matilda"
    // editing? Then save the changes to that book. Otherwise add a new one
    const result = editingId ? await updateBook(editingId, form) : await addBook(form);
    if (result.error) {
      setBookError(result.error); // show what's missing, and keep "Matilda" in the box so you only add the author
      return;
    }
    const wasEditing = editingId;
    resetBookForm();
    loadBooks(); // get the fresh list from the server, and Matilda will appear
    if (wasEditing) loadLoans(); // a loan shows the book's name, so a fixed name shows there too
  }

  // clicking a spine puts that book in the form, so I can fix its title, author or copy note
  function startEditing(book) {
    setEditingId(book._id);
    setTitle(book.title);
    setAuthor(book.author);
    setCopyNote(book.copyNote || '');
    setBookError('');
  }

  function loadFriends() {
    return getFriends().then((result) => fillList(result, 'friends', setFriends, setListErrors));
  }
 
  async function handleAddFriend(e) { // note e = event "the thing that just happened"
    e.preventDefault();
    const result = await addFriend({ name: name });
    if (result.error) {
      setFriendError(result.error);
      return;
    }
    setFriendError('');
    setName('');
    loadFriends();
  }

  // ask the server for Sam's loans, and put them in Sam's panel
  async function loadFriendLoans(friend) {
    askedFriendId.current = friend._id;
    const result = await getFriendLoans(friend._id);
    // clicked Alex while Sam's answer was on the way? Then Sam's late answer is thrown away
    if (askedFriendId.current === friend._id) setFriendLoans(result);
  }

  // clicking Sam's name opens Sam's panel, and asks the server for Sam's loans
  function openFriendPanel(friend) {
    setOpenFriend(friend);
    setFriendLoans(null); // don't show someone else's loans while Sam's are on the way
    loadFriendLoans(friend);
  }

  function closeFriendPanel() {
    setOpenFriend(null);
    setFriendLoans(null);
  }

  function loadLoans() {
    return getLoans().then((result) => fillList(result, 'loans', setLoans, setListErrors));
  }

  async function handleAddLoan(e) {
    e.preventDefault();
    const results = await lendBook(bookId, friendId);
    if (results.error) {
      setLoanError(results.error);
    }else {
      setLoanError('');
    }
    loadLoans();
    if (openFriend) loadFriendLoans(openFriend); // Sam's panel is open? Then it shows the new loan too
  }

  async function handleReturn(id) {
    const result = await returnLoan(id);
    setLoanError(result.error || '');
    loadLoans();
    if (openFriend) loadFriendLoans(openFriend); // Sam's panel is open? Then it shows the book came back
  }


useEffect(() => { // when the page opens, fill in all three lists
  loadBooks();
  loadFriends();
  loadLoans();
}, []);

return (
  <div>
    <h1>Lending Shelf</h1>
    <ErrorMessage message={listError} />
    <section>
     <h2>Books</h2>
      <form onSubmit={handleSaveBook}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <input placeholder="Note (optional, like 'signed')" value={copyNote} onChange={(e) => setCopyNote(e.target.value)} />
        {editingId ? (
          <>
            <button>Save</button>
            <button type="button" onClick={resetBookForm}>Cancel</button>
          </>
        ) : (
          <button>Add book</button>
        )}
      </form>
      <ErrorMessage message={bookError} />
    <input type="search" aria-label="Search books" placeholder="Search by title or author" value={search} onChange={(e) => setSearch(e.target.value)} />
    {search && shelfBooks.length === 0 && <p>No books match '{search}'</p>}
    <ul className="books-list"> {/* the books stand on the shelf as spines. Only the ones that match the search */}
      {shelfBooks.map((book) => (
        <li key = {book._id}>
          {/* a button, so the spine can be clicked, or reached with the keyboard. aria-pressed = this one is in the form */}
          <button className="spine" aria-pressed={book._id === editingId} onClick={() => startEditing(book)}>
            <span className="book-name">{bookName(book)}</span> <span className="book-author">by {book.author}</span>
          </button>
        </li>
     ) )}
    </ul>
    </section>
    <section>
    <h2>Friends</h2>
     <form onSubmit={handleAddFriend}>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <button>Add Friend</button>
     </form>
     <ErrorMessage message={friendError} />
     <ul>
      {friends.map((friend) => (
        <li key={friend._id}><button onClick={() => openFriendPanel(friend)}>{friend.name}</button></li>
      ))}
     </ul>
     {openFriend && <FriendPanel friend={openFriend} loans={friendLoans} onClose={closeFriendPanel} />}
    </section>
    <section>
    <h2>Loans</h2>
<form onSubmit={handleAddLoan}>
<select value={bookId} onChange={(e) => setBookId(e.target.value)}>
  <option value="">Pick a book</option>
  {books.map((book) => (
    <option key={book._id} value={book._id}>{bookName(book)}</option>
  ))}
</select>
<select value={friendId} onChange={(e) => setFriendId(e.target.value)}>
  <option value="">Pick a friend</option>
  {friends.map((friend) => (
    <option key={friend._id} value={friend._id}>{friend.name}</option>
  ))}
</select>
<button>Lend</button>
</form>

<ErrorMessage message={loanError} />

<ul>
{loans.map((loan) => (
  <li key={loan._id} className={loan.overdue ? 'overdue' : undefined}>
    {bookName(loan.book)} → {loan.friend.name}
    {loan.dueBack && `, due back ${shortDay(loan.dueBack)}`}
    {loan.overdue && ' · overdue'}{' '}
    {loan.returnedAt ? '(returned)' : <button onClick={() => handleReturn(loan._id)}>Return</button>}
  </li>
))}
      </ul>
    </section>
  </div>
);
}

export default App;
