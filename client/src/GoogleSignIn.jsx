import { useEffect, useRef } from 'react';

// Google's "Sign in with Google" button. Google draws it, and when I sign in
// it hands back a sign-in (a long code with my email inside, signed by Google), which goes to onSignIn.
// The client id tells Google which app this is. It lives in client/.env.local and in Vercel's settings
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';

function GoogleSignIn({ onSignIn }) {
  const buttonBox = useRef(null); // the spot on the page where Google draws its button

  useEffect(() => {
    if (!CLIENT_ID) return;
    function showButton() {
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: (answer) => onSignIn(answer.credential) });
      window.google.accounts.id.renderButton(buttonBox.current, { text: 'signin_with' });
    }
    // Google's code already loaded (like after signing out)? Then draw the button straight away
    if (window.google?.accounts) {
      showButton();
      return;
    }
    // otherwise load Google's code once, and draw the button when it arrives
    let script = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GOOGLE_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', showButton);
    return () => script.removeEventListener('load', showButton);
  }, [onSignIn]);

  if (!CLIENT_ID) {
    // a reminder for me while setting up, instead of an empty page
    return <p className="error" role="alert">Sign-in isn't set up yet: VITE_GOOGLE_CLIENT_ID is missing.</p>;
  }
  return <div ref={buttonBox} />;
}

export default GoogleSignIn;
