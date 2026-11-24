// ★ Saved ads of the signed-in user (stored in the database).
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { endpoints, http } from '../lib/http.js';
import { pluralize } from '../lib/format.js';
import { useSession } from '../context/SessionContext.jsx';
import ListingCollection from '../components/listing/ListingCollection.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Loader from '../components/ui/Loader.jsx';

export default function SavedPage() {
  const { member, ready } = useSession();
  const [listings, setListings] = useState(null);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    if (!member) return;
    http
      .get(endpoints.saved)
      .then(setListings)
      .catch((err) => setProblem(err.message));
  }, [member]);

  if (!ready) return <Loader />;
  if (!member) return <Navigate to="/sign-in" replace state={{ returnTo: '/saved' }} />;

  // Unstarred ads disappear from this page straight away
  function updateSaved(listingId, saved) {
    if (!saved) setListings((list) => list.filter((item) => item.id !== listingId));
  }

  return (
    <div className="container py-4">
      <div className="page-heading">
        <h1 className="h3 mb-0">★ Saved ads</h1>
        {listings && <span className="text-muted">{pluralize(listings.length, 'ad')}</span>}
      </div>

      {problem && <div className="alert alert-danger">{problem}</div>}
      {!listings && !problem && <Loader />}
      {listings?.length === 0 && (
        <EmptyState icon="☆" title="Nothing saved yet">
          Tap the star on any ad to keep it here. <Link to="/">Start browsing</Link>
        </EmptyState>
      )}
      {listings?.length > 0 && <ListingCollection listings={listings} view="grid" onSavedChange={updateSaved} />}
    </div>
  );
}
