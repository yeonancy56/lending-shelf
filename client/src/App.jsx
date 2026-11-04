import { useState, useEffect, useRef, useCallback } from 'react'; //useState = memory, what should the page remember, useEffect = do something at a certain time
import { getBooks, addBook, updateBook, getFriends, addFriend, updateFriend, getFriendLoans, getFriendRequests, getWaitingRequests, approveRequest, declineRequest, getLoans, lendBook, returnLoan, getShelf, getMyLoans, getMyRequests, askForBook, cancelRequest, rateBook, whoAmI, isSignedIn, saveSignIn, signOut, whenSignedOut } from './api';
import GoogleSignIn from './GoogleSignIn';
import ErrorMessage from './ErrorMessage';

// the three words the server puts next to each book on Sam's page. The server has its own copy
// (server/src/books/book.shelf-state.js), so a rename changes this list and that file
const SHELF_STATE = {
  AT_HOME: 'at home',     // the only one the page checks: these books get the Ask button
  LENT_OUT: 'lent out',
  ASKED_FOR: 'asked for',
};

// a book's name on the page: "Dune (signed)" when it has a copy note, just "Dune" when it doesn't
function bookName(book) {
  return book.copyNote ? `${book.title} (${book.copyNote})` : book.title;
}

// a short day, like "16 Nov", for when a book is due back, was lent, or came back.
// The server sends the exact moment, and this turns it into the day on my own calendar
function shortDay(dueBack) {
  return new Date(dueBack).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// does this book match what I typed in the search box? "herb" finds Dune by Frank Herbert.
// Capitals don't matter, part of a word is enough, and only title and author count, not the copy note
function matchesSearch(book, search) {
  const typed = search.trim().toLowerCase();
  return book.title.toLowerCase().includes(typed) || book.author.toLowerCase().includes(typed);
}

// fill a list with the server's answer, and remember whether that list broke,
// so the red message at the top stays until every broken list has loaded
function fillList(result, list, setList, setListErrors) {
  setListErrors((errors) => ({ ...errors, [list]: result.error || '' }));
  if (!result.error) {
    setList(result);
  }
}

// under the title: how many books are on the shelf, lent out ones too, like "12 books" or "1 book".
// Nothing until the books have arrived, so a slow or broken server never shows a wrong "0 books"
function BookCount({ books, arrived }) {
  if (!arrived) return null;
  return <p className="book-count">{books.length === 1 ? '1 book' : `${books.length} books`}</p>;
}

// a copy's average rating, like "★ 4.5 · 2 ratings", to one decimal place. A copy no one has rated shows nothing, not "0 stars".
// Only the average and how many: never who gave what
function AverageRating({ book }) {
  if (!book.ratingCount) return null;
  const count = book.ratingCount === 1 ? '1 rating' : `${book.ratingCount} ratings`;
  return <span className="average-rating">★ {book.averageStars.toFixed(1)} · {count}</span>;
}

// Sam's own stars for one copy he's returned: five buttons, filled up to his stars (★★★★☆), or all empty (☆☆☆☆☆) before he rates.
// Clicking one saves it straight away. Labelled "your stars", so it's never mixed up with anyone else's
const STARS = [1, 2, 3, 4, 5];
function YourStars({ book, onRate }) {
  return (
    <span role="group" aria-label={`Your stars for ${bookName(book)}`} className="your-stars">
      your stars{' '}
      {STARS.map((stars) => (
        <button
          key={stars}
          className="star"
          aria-label={stars === 1 ? '1 star' : `${stars} stars`}
          aria-pressed={book.myStars === stars}
          onClick={() => onRate(book._id, stars)}
        >
          {stars <= (book.myStars ?? 0) ? '★' : '☆'}
        </button>
      ))}
    </span>
  );
}

// one request's line, like "Dune · declined · “I'm rereading it this week”". The note only shows when I wrote one
function requestLine(request) {
  const line = `${bookName(request.book)} · ${request.status}`;
  return request.note ? `${line} · “${request.note}”` : line;
}

// one friend's loans, in a box under the Friends list: how many they have, what they have now, what they had before,
// and every request they made. loans and requests are null while the server hasn't answered yet
function FriendPanel({ friend, loans, requests, onEdit, onClose }) {
  return (
    <section aria-labelledby="friend-panel-title">
      <h3 id="friend-panel-title">{friend.name}'s loans</h3>
      {!loans && <p>Loading…</p>} {/* Sam's loans are still on the way */}
      <ErrorMessage message={loans?.error} />
      {loans && !loans.error && <FriendLoans loans={loans} />}
      <h4>Requests</h4>
      <ErrorMessage message={requests?.error} />
      {requests && !requests.error && requests.length === 0 && <p>No requests yet</p>}
      <ul aria-label={`${friend.name}'s requests`}> {/* newest first, the order the server sends */}
        {requests && !requests.error && requests.map((request) => (
          <li key={request._id}>{requestLine(request)}</li>
        ))}
      </ul>
      <button onClick={onEdit}>Edit</button> {/* puts Sam's name and email in the friend form */}
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

// what a signed-out visitor sees: the name, the Google button, and why they were sent back here (if they were)
function SignInScreen({ message, onSignIn }) {
  return (
    <div>
      <h1>Lending Shelf</h1>
      <ErrorMessage message={message} /> {/* like "You're not on the list." */}
      <GoogleSignIn onSignIn={onSignIn} />
    </div>
  );
}

// The whole page: the sign-in screen until someone signs in, then my shelf or the friend page.
// Nothing is asked from the server until someone's signed in, so a stranger sees no books, friends or loans
function App() {
  const [signedIn, setSignedIn] = useState(isSignedIn); // already signed in from before a reload?
  const [signInMessage, setSignInMessage] = useState('');
  // the server's answer to "who am I?": { who: 'owner' } or { who: 'friend', name: 'Sam' }. null while it's on the way
  const [me, setMe] = useState(null);

  // the server says it doesn't know me (a stranger, or a sign-in that's too old): back to the sign-in button
  useEffect(() => {
    whenSignedOut((message) => {
      setSignInMessage(message);
      setSignedIn(false);
      setMe(null);
    });
  }, []);

  // once signed in, ask "who am I?", so the page knows which page to show
  useEffect(() => {
    if (!signedIn) return;
    let stillSignedIn = true;
    whoAmI().then((answer) => {
      if (stillSignedIn) setMe(answer); // signed out while the answer was on the way? Then it's thrown away
    });
    return () => { stillSignedIn = false; };
  }, [signedIn]);

  // useCallback keeps this the same function every time, so Google's button isn't drawn again on every change
  const handleSignIn = useCallback((signIn) => {
    saveSignIn(signIn);
    setSignInMessage('');
    setSignedIn(true);
  }, []);

  function handleSignOut() {
    signOut();
    setSignedIn(false);
    setMe(null); // the next person to sign in might be someone else
  }

  if (!signedIn) return <SignInScreen message={signInMessage} onSignIn={handleSignIn} />;
  if (!me) return <p>Loading…</p>; // "who am I?" is still on the way
  if (me.error) {
    // the server broke while saying who I am, so there's no page to show yet. Sign out lets me try again
    return (
      <div>
        <h1>Lending Shelf</h1>
        <ErrorMessage message={me.error} />
        <button onClick={handleSignOut}>Sign out</button>
      </div>
    );
  }
  if (me.who === 'friend') return <FriendPage name={me.name} onSignOut={handleSignOut} />;
  return <Shelf onSignOut={handleSignOut} />;
}

// Sam's page: every book on the shelf, Sam's own loans, and Sam's own requests.
// Sam can ask for a book that's at home, and cancel a waiting request. Nothing else,
// because lending, returning, adding and editing are only for me
function FriendPage({ name, onSignOut }) {
  const [shelf, setShelf] = useState([]);
  const [myLoans, setMyLoans] = useState(null); // null while the server hasn't answered yet
  const [myRequests, setMyRequests] = useState(null); // null while the server hasn't answered yet
  const [listErrors, setListErrors] = useState({});
  const [clickError, setClickError] = useState(''); // the red message for whatever Sam just clicked: Ask, Cancel or a star
  const listError = Object.values(listErrors).find((error) => error);

  // fill in (or fill in again) the shelf and Sam's requests: asking or cancelling changes both
  function loadShelfAndRequests() {
    getShelf().then((result) => fillList(result, 'shelf', setShelf, setListErrors));
    getMyRequests().then(setMyRequests);
  }

  useEffect(() => { // when the page opens, fill in the shelf, Sam's loans and Sam's requests
    loadShelfAndRequests();
    getMyLoans().then(setMyLoans);
  }, []);

  // Sam clicks Ask on Dune. If a lending rule says no (like already having 3), Sam sees why straight away
  async function handleAsk(bookId) {
    const result = await askForBook(bookId);
    setClickError(result.error || '');
    if (!result.error) loadShelfAndRequests();
  }

  // Sam clicks Cancel on a waiting request: Dune is free again, and it stops counting toward Sam's 3
  async function handleCancel(requestId) {
    const result = await cancelRequest(requestId);
    setClickError(result.error || '');
    if (!result.error) loadShelfAndRequests();
  }

  // Sam clicks a star on Dune: it's saved straight away, and the shelf shows his new stars
  async function handleRate(bookId, stars) {
    const result = await rateBook(bookId, stars);
    setClickError(result.error || '');
    if (!result.error) loadShelfAndRequests();
  }

  return (
    <div>
      <h1>Lending Shelf</h1>
      <BookCount books={shelf} arrived={listErrors.shelf === ''} /> {/* '' means the shelf arrived with no error */}
      <h2>Hi, {name}</h2>
      <button onClick={onSignOut}>Sign out</button>
      <ErrorMessage message={listError} />
      <ErrorMessage message={clickError} />
      <section>
        <h2 id="friend-shelf">Books</h2>
        {/* each book says "at home", "lent out" or "asked for", but never who: the server doesn't send that */}
        <ul aria-labelledby="friend-shelf">
          {shelf.map((book) => (
            <li key={book._id}>
              {bookName(book)} by {book.author} · {book.state}
              {book.state === SHELF_STATE.AT_HOME && <button onClick={() => handleAsk(book._id)}>Ask</button>}
              <AverageRating book={book} />
              {book.canRate && <YourStars book={book} onRate={handleRate} />} {/* only copies Sam has returned */}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="my-loans">
        <h2 id="my-loans">My loans</h2>
        {!myLoans && <p>Loading…</p>}
        <ErrorMessage message={myLoans?.error} />
        {myLoans && !myLoans.error && <FriendLoans loans={myLoans} />} {/* the same lists as Sam's panel on my page */}
      </section>
      <section aria-labelledby="my-requests">
        <h2 id="my-requests">My requests</h2>
        {!myRequests && <p>Loading…</p>}
        <ErrorMessage message={myRequests?.error} />
        {myRequests && !myRequests.error && myRequests.length === 0 && <p>No requests yet</p>}
        <ul aria-labelledby="my-requests"> {/* newest first, the order the server sends */}
          {myRequests && !myRequests.error && myRequests.map((request) => (
            <li key={request._id}>
              {requestLine(request)}
              {request.status === 'waiting' && <button onClick={() => handleCancel(request._id)}>Cancel</button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Shelf({ onSignOut }) { //these are memory boxes 
  const[books, setBooks] = useState([]);
  const[title, setTitle] = useState('');
  const[author, setAuthor] = useState('');
  const[copyNote, setCopyNote] = useState(''); // optional, like "signed"
  const[editingId, setEditingId] = useState(''); // the book in the form for editing, or '' when the form adds a new book
  const[search, setSearch] = useState(''); // what I typed in the search box above the shelf
  const[friends, setFriends] = useState([]);
  const[name, setName] = useState('');
  const[email, setEmail] = useState(''); // optional: Sam's Google email, so Sam can sign in
  const[editingFriendId, setEditingFriendId] = useState(''); // the friend in the form for editing, or '' when the form adds a new friend
  const[openFriend, setOpenFriend] = useState(null); // the friend whose panel is open, or null when it's closed
  const[friendLoans, setFriendLoans] = useState(null); // that friend's loans, once the server answers
  const[friendRequests, setFriendRequests] = useState(null); // that friend's requests, once the server answers
  const[waitingRequests, setWaitingRequests] = useState([]); // my Requests list: what still needs an answer from me
  const[declineNotes, setDeclineNotes] = useState({}); // what I typed in each request's note box, like { 'request-2': 'Not this week' }
  const[requestError, setRequestError] = useState(''); // the red message for Approve and Decline
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
  // the books that are out right now, like Dune while Sam has it. The loans list keeps returned ones too, so skip those
  const lentOutIds = new Set(loans.filter((loan) => !loan.returnedAt).map((loan) => loan.book?._id));

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
    setSearch(''); // empty the search, so Matilda shows on the shelf even if I'd searched "herb"
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
 
  // empty the friend form, and go back to adding a new friend
  function resetFriendForm() {
    setEditingFriendId('');
    setFriendError('');
    setName('');
    setEmail('');
  }

  async function handleSaveFriend(e) { // note e = event "the thing that just happened"
    e.preventDefault();
    const form = { name: name, email: email }; // an empty email box means no email
    // editing? Then save the changes to that friend. Otherwise add a new one
    const result = editingFriendId ? await updateFriend(editingFriendId, form) : await addFriend(form);
    if (result.error) {
      setFriendError(result.error); // like "Sam already has this email.", and what I typed stays in the boxes
      return;
    }
    if (openFriend?._id === result._id) setOpenFriend(result); // Sam's panel shows Sam's new name, and Edit gets the new email
    const wasEditing = editingFriendId;
    resetFriendForm();
    loadFriends();
    if (wasEditing) loadLoans(); // a loan shows the friend's name, so a fixed name shows there too
  }

  // Edit in Sam's panel puts Sam in the form, so I can add, change or remove Sam's email
  function startEditingFriend(friend) {
    setEditingFriendId(friend._id);
    setName(friend.name);
    setEmail(friend.email || '');
    setFriendError('');
  }

  // ask the server for Sam's loans and requests, and put them in Sam's panel
  async function loadFriendLoans(friend) {
    askedFriendId.current = friend._id;
    const [loans, requests] = await Promise.all([getFriendLoans(friend._id), getFriendRequests(friend._id)]);
    // clicked Alex while Sam's answer was on the way? Then Sam's late answer is thrown away
    if (askedFriendId.current === friend._id) {
      setFriendLoans(loans);
      setFriendRequests(requests);
    }
  }

  // clicking Sam's name opens Sam's panel, and asks the server for Sam's loans
  function openFriendPanel(friend) {
    setOpenFriend(friend);
    setFriendLoans(null); // don't show someone else's loans while Sam's are on the way
    setFriendRequests(null);
    loadFriendLoans(friend);
  }

  function closeFriendPanel() {
    setOpenFriend(null);
    setFriendLoans(null);
    setFriendRequests(null);
  }

  function loadLoans() {
    return getLoans().then((result) => fillList(result, 'loans', setLoans, setListErrors));
  }

  function loadRequests() {
    return getWaitingRequests().then((result) => fillList(result, 'requests', setWaitingRequests, setListErrors));
  }

  // Approve on Sam's request for Dune: the server lends Dune to Sam right away.
  // If a lending rule says no (like Sam's loan going overdue), I see why and the request stays in the list
  async function handleApprove(id) {
    const result = await approveRequest(id);
    setRequestError(result.error || '');
    if (result.error) return;
    loadRequests();
    loadLoans();
    if (openFriend) loadFriendLoans(openFriend); // Sam's panel is open? Then it shows the new loan and the approved request
  }

  // Decline on Sam's request for Dune, with whatever is in its note box (maybe nothing). Nothing is lent.
  // If the server says no (like a note that's too long), I see why, and the request and my note stay
  async function handleDecline(id) {
    const result = await declineRequest(id, declineNotes[id] || '');
    setRequestError(result.error || '');
    if (result.error) return;
    setDeclineNotes((notes) => ({ ...notes, [id]: '' })); // that note is sent, so its box is done
    loadRequests();
    if (openFriend) loadFriendLoans(openFriend); // Sam's panel is open? Then it shows the declined request and my note
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


useEffect(() => { // when the page opens, fill in all four lists
  loadRequests();
  loadBooks();
  loadFriends();
  loadLoans();
}, []);

return (
  <div>
    <h1>Lending Shelf</h1>
    <BookCount books={books} arrived={listErrors.books === ''} /> {/* '' means the books arrived with no error */}
    <button onClick={onSignOut}>Sign out</button>
    <ErrorMessage message={listError} />
    <section>
      <h2 id="requests">Requests</h2> {/* at the top, so I see them as soon as I sign in */}
      {waitingRequests.length === 0 && <p>No requests waiting</p>}
      <ul aria-labelledby="requests"> {/* oldest first, the order the server sends, so I answer them in the order they came */}
        {waitingRequests.map((request) => (
          <li key={request._id}>
            {request.friend.name} asked for {bookName(request.book)}{' '}
            <button onClick={() => handleApprove(request._id)}>Approve</button>
            {/* the note box is always there, so declining is one click */}
            <input
              aria-label={`Note for ${request.friend.name} (optional)`}
              placeholder="Note (optional)"
              value={declineNotes[request._id] || ''}
              onChange={(e) => setDeclineNotes((notes) => ({ ...notes, [request._id]: e.target.value }))}
            />
            <button onClick={() => handleDecline(request._id)}>Decline</button>
          </li>
        ))}
      </ul>
      <ErrorMessage message={requestError} />
    </section>
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
    {/* type "herb" and only Dune by Frank Herbert stays on the shelf */}
    <input type="search" className="search-box" aria-label="Search books" placeholder="Search by title or author" value={search} onChange={(e) => setSearch(e.target.value)} />
    {/* nothing on the shelf matches? Say so, without the extra spaces the search ignores */}
    {search.trim() && shelfBooks.length === 0 && <p>No books match '{search.trim()}'</p>}
    <ul className="books-list"> {/* the books stand on the shelf as spines. Only the ones that match the search */}
      {shelfBooks.map((book) => {
        const lentOut = lentOutIds.has(book._id); // like Dune while Sam has it
        return (
          // a lent-out book's spine is darker and faded (see index.css)
          <li key = {book._id} className={lentOut ? 'lent-out' : undefined}>
            {/* a button, so the spine can be clicked, or reached with the keyboard. aria-pressed = this one is in the form */}
            <button className="spine" aria-pressed={book._id === editingId} onClick={() => startEditing(book)}>
              <span className="book-name">{bookName(book)}</span> <span className="book-author">by {book.author}</span>
              {/* the fading can't be heard, so a screen reader hears "lent out" instead. Hidden from eyes */}
              {lentOut && <span className="hidden-words">, lent out</span>}
              <AverageRating book={book} />
            </button>
          </li>
        );
      })}
    </ul>
    </section>
    <section>
    <h2>Friends</h2>
     <form onSubmit={handleSaveFriend}>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      {/* type="email": a phone shows the @ key, and the browser stops a typo like "sam.gmail.com" before it's sent */}
      <input type="email" placeholder="Google email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
      {editingFriendId ? (
        <>
          <button>Save</button>
          <button type="button" onClick={resetFriendForm}>Cancel</button>
        </>
      ) : (
        <button>Add Friend</button>
      )}
     </form>
     <ErrorMessage message={friendError} />
     <ul>
      {friends.map((friend) => (
        <li key={friend._id}><button onClick={() => openFriendPanel(friend)}>{friend.name}</button></li>
      ))}
     </ul>
     {openFriend && <FriendPanel friend={openFriend} loans={friendLoans} requests={friendRequests} onEdit={() => startEditingFriend(openFriend)} onClose={closeFriendPanel} />}
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
