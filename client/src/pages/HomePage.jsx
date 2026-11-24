// Search page: filter by category and by a word / phrase.
// The filters are kept in the address (?category=2&q=bike), and results load without reloading the page.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../api.js';
import AdCard from '../components/AdCard.jsx';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState(q); // what is typed in the search box

  useEffect(() => {
    api.get('/api/categories').then(setCategories).catch(() => setCategories([]));
  }, []);

  // Load ads every time the filters in the address change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    api
      .get(`/api/ads?${params}`)
      .then((data) => !cancelled && setAds(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, q]);

  // Keep the search box in sync when the user goes back / forward in the browser
  useEffect(() => setText(q), [q]);

  // Search while typing (waits 300 ms after the last key)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim() !== q) updateFilters({ q: text.trim() });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function updateFilters(changes) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }

  function handleSubmit(event) {
    event.preventDefault();
    updateFilters({ q: text.trim() });
  }

  function handleFavoriteChange(adId, isFavorite) {
    setAds((list) => list.map((ad) => (ad.id === adId ? { ...ad, is_favorite: isFavorite } : ad)));
  }

  const selectedCategory = categories.find((c) => String(c.id) === category);

  return (
    <>
      <form className="card card-body shadow-sm mb-4" onSubmit={handleSubmit} role="search">
        <div className="row g-2">
          <div className="col-md-4">
            <label className="form-label small text-muted mb-1" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="form-select"
              value={category}
              onChange={(e) => updateFilters({ category: e.target.value })}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.ad_count})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-8">
            <label className="form-label small text-muted mb-1" htmlFor="q">
              Word or phrase
            </label>
            <div className="input-group">
              <input
                id="q"
                type="search"
                className="form-control"
                placeholder="e.g. bike, laptop, for beginners…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                Search
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h5 m-0">
          {selectedCategory ? selectedCategory.name : 'All ads'}
          {q && <span className="text-muted fw-normal"> · “{q}”</span>}
        </h1>
        {!loading && <span className="text-muted small">{ads.length} found</span>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : ads.length === 0 ? (
        <div className="alert alert-info">
          No ads found.{' '}
          {(q || category) && (
            <button className="btn btn-link p-0 align-baseline" onClick={() => setSearchParams({})}>
              Clear the filters
            </button>
          )}
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
