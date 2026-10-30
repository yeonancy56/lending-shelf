import { useState, useEffect } from 'react'; //useState = memory, what should the page remember, useEffect = do something at a certain time
import { getBooks, addBook, getFriends, addFriend, getLoans, lendBook, returnLoan} from './api';

// a book's name on the page: "Dune (signed)" when it has a copy note, just "Dune" when it doesn't
function bookName(book) {
  return book.copyNote ? `${book.title} (${book.copyNote})` : book.title;
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
  const[error, setError] = useState('');
  const[bookError, setBookError] = useState(''); // the red message under the book form
  const[friendError, setFriendError] = useState(''); // the red message under the friend form

  async function loadBooks() { //load function, fill a list from the server
    setBooks(await getBooks());
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

  async function loadFriends() {
    setFriends(await getFriends());
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

  async function loadLoans() {
    setLoans(await getLoans());
  }

  async function handleAddLoan(e) {
    e.preventDefault();
    const results = await lendBook(bookId, friendId);
    if (results.error) {
      setError(results.error);
    }else {
      setError('');
    }
    loadLoans();
  }

  async function handleReturn(id) {
    await returnLoan(id);
    loadLoans();
  }


useEffect(() => {
  loadBooks();
  loadFriends();
  loadLoans();
}, []);

return (
  <div>
    <h1>Lending Shelf</h1>
     <h2>Books</h2>
      <form onSubmit={handleAddBook}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <input placeholder="Note (optional, like 'signed')" value={copyNote} onChange={(e) => setCopyNote(e.target.value)} />
        <button>Add book</button>
      </form>
      {bookError && <p style={{ color: 'red' }}>{bookError}</p>}
    <ul> 
      {books.map((book) => (
        <li key = {book._id}>{bookName(book)} by {book.author}</li>
     ) )}
    </ul>
    <h2>Friends</h2>
     <form onSubmit={handleAddFriend}>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <button>Add Friend</button>
     </form>
     {friendError && <p style={{ color: 'red' }}>{friendError}</p>}
     <ul>
      {friends.map((friend) => (
        <li key={friend._id}>{friend.name}</li>
      ))}
     </ul>
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

{error && <p style={{ color: 'red' }}>{error}</p>}

<ul>
{loans.map((loan) => (
  <li key={loan._id}>
    {bookName(loan.book)} → {loan.friend.name}{' '}
    {loan.returnedAt ? '(returned)' : <button onClick={() => handleReturn(loan._id)}>Return</button>}
  </li>
))}
      </ul>
  </div>
);
}

export default App;
