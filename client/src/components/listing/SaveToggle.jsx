// The ★ / ☆ toggle that adds a listing to the saved list (stored in the database).
// variant="icon" is the round button on photos, variant="wide" is the big button on the listing page.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { api, http } from '../../lib/http.js';
import { useSession } from '../../context/SessionContext.jsx';

export default function SaveToggle({ listingId, saved, onSavedChange, variant = 'icon' }) {
  const { member } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState('');
  const hideTimer = useRef();

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  function showProblem(text) {
    setProblem(text);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setProblem(''), 3500);
  }

  async function handleClick(event) {
    event.preventDefault(); // the toggle can sit inside a link
    event.stopPropagation();
    if (!member) {
      navigate('/sign-in', { state: { returnTo: location.pathname + location.search } });
      return;
    }
    setPending(true);
    try {
      const url = api.savedListing(listingId);
      const result = saved ? await http.remove(url) : await http.put(url);
      onSavedChange(result.saved);
    } catch (err) {
      showProblem(err.message);
    } finally {
      setPending(false);
    }
  }

  const label = saved ? 'Remove from saved' : 'Save this listing';

  return (
    <span className={`save-wrap save-wrap--${variant}`}>
      <button
        type="button"
        className={`save-toggle save-toggle--${variant}${saved ? ' is-saved' : ''}`}
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={label}
        title={label}
      >
        <span aria-hidden="true">{saved ? '★' : '☆'}</span>
        {variant === 'wide' && <span>{saved ? 'Saved' : 'Save'}</span>}
      </button>
      {problem && (
        <span className="save-problem" role="alert">
          {problem}
        </span>
      )}
    </span>
  );
}
