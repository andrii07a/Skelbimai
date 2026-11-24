// Browse / search page. Filters live in the address (?category=2&q=bike&sort=price_asc),
// so results change without reloading the page and the browser Back button works.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { endpoints, http } from '../lib/http.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useListings } from '../hooks/useListings.js';
import { useStoredState } from '../hooks/useStoredState.js';
import SearchHero from '../components/browse/SearchHero.jsx';
import CategoryPicker from '../components/browse/CategoryPicker.jsx';
import ResultsToolbar from '../components/browse/ResultsToolbar.jsx';
import ListingCollection from '../components/listing/ListingCollection.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Loader from '../components/ui/Loader.jsx';

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'newest';

  const [categories, setCategories] = useState([]);
  const [typed, setTyped] = useState(q);
  const debouncedTyped = useDebouncedValue(typed);
  const [view, setView] = useStoredState('turgus.view', 'grid');
  const { listings, setListings, status, error } = useListings({ category, q, sort });

  useEffect(() => {
    http.get(endpoints.categories).then(setCategories).catch(() => setCategories([]));
  }, []);

  function applyFilters(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (next.get('sort') === 'newest') next.delete('sort');
    setParams(next, { replace: true });
  }

  // Search while typing
  useEffect(() => {
    if (debouncedTyped.trim() !== q) applyFilters({ q: debouncedTyped.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTyped]);

  // Back / forward in the browser changes the address: show the same text in the field
  useEffect(() => setTyped(q), [q]);

  function updateSaved(listingId, saved) {
    setListings((list) => list.map((item) => (item.id === listingId ? { ...item, is_favorite: saved } : item)));
  }

  const categoryName = categories.find((c) => String(c.id) === category)?.name;
  let heading = categoryName || 'Fresh ads';
  if (q) heading = categoryName ? `${categoryName}: “${q}”` : `Results for “${q}”`;

  return (
    <>
      <SearchHero value={typed} onChange={setTyped} onSubmit={() => applyFilters({ q: typed.trim() })} />

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
