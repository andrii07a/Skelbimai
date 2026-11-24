// ⭐ button: saves or removes an ad from the user's saved list (stored in the database).
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function FavoriteButton({ adId, isFavorite, onChange, className = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  async function toggle(event) {
    event.preventDefault(); // the button can be inside a link (ad card)
    event.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setBusy(true);
    try {
      const data = isFavorite
        ? await api.delete(`/api/favorites/${adId}`)
        : await api.post(`/api/favorites/${adId}`);
      onChange?.(data.is_favorite);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  const label = isFavorite ? 'Remove from saved' : 'Save';
  return (
    <button
      type="button"
      className={`btn btn-light fav-btn shadow-sm${isFavorite ? ' is-favorite' : ''} ${className}`}
      onClick={toggle}
      disabled={busy}
      title={label}
      aria-label={label}
      aria-pressed={isFavorite}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
}
