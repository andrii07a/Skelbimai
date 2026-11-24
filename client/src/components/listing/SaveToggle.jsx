// The ★ / ☆ toggle that adds an ad to the saved list (stored in the database).
// variant="icon" is the small round button on photos, variant="wide" is the big button on the ad page.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { endpoints, http } from '../../lib/http.js';
import { useSession } from '../../context/SessionContext.jsx';

export default function SaveToggle({ listingId, saved, onSavedChange, variant = 'icon' }) {
  const { member } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);

  async function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!member) {
      navigate('/sign-in', { state: { returnTo: location.pathname + location.search } });
      return;
    }
    setPending(true);
    try {
      const url = endpoints.savedItem(listingId);
      const result = saved ? await http.remove(url) : await http.post(url);
      onSavedChange(result.is_favorite);
    } catch (err) {
      alert(err.message);
    } finally {
      setPending(false);
    }
  }

  const label = saved ? 'Remove from saved' : 'Save this ad';
  const star = saved ? '★' : '☆';

  return (
    <button
      type="button"
      className={`save-toggle save-toggle--${variant}${saved ? ' is-saved' : ''}`}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={label}
      title={label}
    >
      <span className="save-toggle-star">{star}</span>
      {variant === 'wide' && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
