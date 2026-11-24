// Browse / search page. Filters live in the address (?category=2&q=bike&sort=price_asc),
// so results change without reloading the page and the browser Back button works.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api, http } from '../lib/http.js';
import { useListings } from '../hooks/useListings.js';
import { useStoredState } from '../hooks/useStoredState.js';
import SearchHero from '../components/browse/SearchHero.jsx';
import CategoryPicker from '../components/browse/CategoryPicker.jsx';
import ResultsToolbar from '../components/browse/ResultsToolbar.jsx';
import ListingCollection from '../components/listing/ListingCollection.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Loader from '../components/ui/Loader.jsx';

const SEARCH_DELAY_MS = 350;

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'newest';

  const [categories, setCategories] = useState([]);
  const [typed, setTyped] = useState(q);
  const searchTimer = useRef();
  const [view, setView] = useStoredState('turgus.view', 'grid');
  const { listings, setListings, status, error } = useListings({ category, q, sort });

  useEffect(() => {
    http.get(api.categories).then(setCategories).catch(() => setCategories([]));
  }, []);

  // Changes the filters in the address. The function form always works with the newest address.
  const applyFilters = useCallback(
    (changes) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
          if (next.get('sort') === 'newest') next.delete('sort');
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Search while typing: wait until the visitor stops typing for a moment
  function handleTyping(value) {
    setTyped(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilters({ q: value.trim() }), SEARCH_DELAY_MS);
  }

  function searchNow() {
    clearTimeout(searchTimer.current);
    applyFilters({ q: typed.trim() });
  }

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  // Back / forward in the browser changes the address: show that text in the field
  // (but do not touch what is being typed, e.g. a space at the end)
  useEffect(() => setTyped((current) => (current.trim() === q ? current : q)), [q]);

  function updateSaved(listingId, saved) {
    setListings((list) => list.map((item) => (item.id === listingId ? { ...item, saved } : item)));
  }

  const categoryName = categories.find((c) => String(c.id) === category)?.title;
  let heading = categoryName || 'Fresh ads';
  if (q) heading = categoryName ? `${categoryName}: “${q}”` : `Results for “${q}”`;

  return (
    <>
      <SearchHero value={typed} onChange={handleTyping} onSubmit={searchNow} />

      <div className="container py-4">
        <div className="browse-layout">
          <aside className="browse-sidebar">
            <CategoryPicker categories={categories} selected={category} onSelect={(id) => applyFilters({ category: id })} />
          </aside>

          <section>
            <ResultsToolbar
              count={listings.length}
              loading={status === 'loading'}
              heading={heading}
              sort={sort}
              onSortChange={(value) => applyFilters({ sort: value })}
              view={view}
              onViewChange={setView}
            />

            {status === 'loading' && <Loader />}
            {status === 'error' && <div className="alert alert-danger">{error}</div>}
            {status === 'ready' && listings.length === 0 && (
              <EmptyState title="Nothing found">
                Try another word or category.{' '}
                <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => setParams({})}>
                  Show all ads
                </button>
              </EmptyState>
            )}
            {status === 'ready' && listings.length > 0 && (
              <ListingCollection listings={listings} view={view} onSavedChange={updateSaved} />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
