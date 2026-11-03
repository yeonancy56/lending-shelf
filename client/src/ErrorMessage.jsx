// a red message, like "This book is already lent out". Marked as an alert so a screen reader
// reads it out loud right away. Shows nothing when there's no message
function ErrorMessage({ message }) {
  return message ? <p className="error" role="alert">{message}</p> : null;
}

export default ErrorMessage;
