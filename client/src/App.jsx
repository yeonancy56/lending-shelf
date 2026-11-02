import { useState, useEffect } from 'react'; //useState = memory, what should the page remember, useEffect = do something at a certain time
import { getBooks, addBook, getFriends, addFriend, getLoans, lendBook, returnLoan} from './api';

// a book's name on the page: "Dune (signed)" when it has a copy note, just "Dune" when it doesn't
function bookName(book) {
  return book.copyNote ? `${book.title} (${book.copyNote})` : book.title;
}

// a red message, like "This book is already lent out". Marked as an alert so a screen reader
// reads it out loud right away. Shows nothing when there's no message
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

function App() { //these are memory boxes 
  const[books, setBooks] = useState([]);
  const[title, setTitle] = useState('');
  const[author, setAuthor] = useState('');
  const[copyNote, setCopyNote] = useState(''); // optional, like "signed"
  const[friends, setFriends] = useState([]);
  const[name, setName] = useState('');
  const[loans, setLoans] = useState([]);
  const[bookId, setBookId] = useState('');
  const[friendId, setFriendId] = useState('');
  const[loanError, setLoanError] = useState(''); // the red message under the lend form, for Lend and Return
  const[bookError, setBookError] = useState(''); // the red message under the book form
  const[friendError, setFriendError] = useState(''); // the red message under the friend form
  const[listErrors, setListErrors] = useState({}); // which lists couldn't load, like { loans: 'Something went wrong. Try again.' }
  const listError = Object.values(listErrors).find((error) => error); // the red message at the top, if any list is broken

  function loadBooks() { //load function, fill a list from the server
    return getBooks().then((result) => fillList(result, 'books', setBooks, setListErrors)); // fill the list in once the server answers
  }
  
  async function handleAddBook(e) { // this function runs when you click a button on the page
    e.preventDefault(); //Dont refresh the page
    const result = await addBook({ title: title, author: author, copyNote: copyNote });// take what you tyoed (ex title = "matilda") and send it to the server
    if (result.error) {
      setBookError(result.error); // show what's missing, and keep "Matilda" in the box so you only add the author
      return;
    }
    setBookError('');
    setTitle(''); //clear the text box
    setAuthor(''); //clear the text box
    setCopyNote(''); //clear the text box
    loadBooks(); // get the fresh list from the server, and Matilda will appear 
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
  }

  async function handleReturn(id) {
    const result = await returnLoan(id);
    setLoanError(result.error || '');
    loadLoans();
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
      <form onSubmit={handleAddBook}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <input placeholder="Note (optional, like 'signed')" value={copyNote} onChange={(e) => setCopyNote(e.target.value)} />
        <button>Add book</button>
      </form>
      <ErrorMessage message={bookError} />
    <ul className="books-list"> {/* the books stand on the shelf as spines */}
      {books.map((book) => (
        <li key = {book._id}><span className="book-name">{bookName(book)}</span> <span className="book-author">by {book.author}</span></li>
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
        <li key={friend._id}>{friend.name}</li>
      ))}
     </ul>
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
  <li key={loan._id}>
    {bookName(loan.book)} → {loan.friend.name}{' '}
    {loan.returnedAt ? '(returned)' : <button onClick={() => handleReturn(loan._id)}>Return</button>}
  </li>
))}
      </ul>
    </section>
  </div>
);
}

export default App;
