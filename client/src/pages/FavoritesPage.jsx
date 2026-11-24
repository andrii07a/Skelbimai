// ⭐ Saved ads of the logged-in user.
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AdCard from '../components/AdCard.jsx';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api
      .get('/api/favorites')
      .then(setAds)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" state={{ from: '/favorites' }} replace />;

  function handleFavoriteChange(adId, isFavorite) {
    if (!isFavorite) setAds((list) => list.filter((ad) => ad.id !== adId));
  }

  return (
    <>
      <h1 className="h4 mb-3">⭐ Saved ads</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : ads.length === 0 ? (
        <div className="alert alert-info">
          You have no saved ads yet. Click ☆ on any ad to save it. <Link to="/">Browse ads</Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} onFavoriteChange={handleFavoriteChange} />
          ))}
        </div>
      )}
    </>
  );
}
