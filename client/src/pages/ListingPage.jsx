// One ad: big photo, description, seller card with the ★ button, and the questions thread.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { endpoints, http, photoUrl } from '../lib/http.js';
import { fullDate, money, timeAgo } from '../lib/format.js';
import { useSession } from '../context/SessionContext.jsx';
import SaveToggle from '../components/listing/SaveToggle.jsx';
import CommentThread from '../components/listing/CommentThread.jsx';
import CommentComposer from '../components/listing/CommentComposer.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Loader from '../components/ui/Loader.jsx';

export default function ListingPage() {
  const { id } = useParams();
  const { member } = useSession();
  const [listing, setListing] = useState(null);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setListing(null);
    setProblem('');
    http
      .get(endpoints.listing(id), controller.signal)
      .then(setListing)
      .catch((err) => err.name !== 'AbortError' && setProblem(err.message));
    return () => controller.abort();
    // reload when someone signs in or out, because the ★ state belongs to the user
  }, [id, member?.id]);

  if (problem) {
    return (
      <div className="container py-5">
        <EmptyState icon="🗂️" title={problem}>
          It may have been sold, removed or hidden by a moderator. <Link to="/">Browse other ads</Link>
        </EmptyState>
      </div>
    );
  }
  if (!listing) return <Loader />;

  const isMine = member?.username === listing.owner;

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link to="/">Browse</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/?category=${listing.category_id}`}>{listing.category_name}</Link>
          </li>
          <li className="breadcrumb-item active text-truncate" aria-current="page">
            {listing.title}
          </li>
        </ol>
      </nav>

      <div className="listing-layout">
        <img className="listing-photo" src={photoUrl(listing.image)} alt={listing.title} />

        <div className="listing-details">
          <section className="panel">
            <h2 className="panel-heading">Description</h2>
            <p className="pre-wrap mb-0">{listing.description}</p>
          </section>

          <section className="panel mt-3">
            <h2 className="panel-heading">Questions ({listing.comments.length})</h2>
            <CommentThread comments={listing.comments} sellerName={listing.owner} />
            <CommentComposer
              listingId={listing.id}
              onPosted={(comment) => setListing({ ...listing, comments: [...listing.comments, comment] })}
            />
          </section>
        </div>

        <aside className="listing-aside">
          <div className="panel">
            <h1 className="listing-title">{listing.title}</h1>
            <div className="listing-price">{money(listing.price)}</div>
            <div className="text-muted small mb-3" title={fullDate(listing.created_at)}>
              Posted {timeAgo(listing.created_at)} in {listing.category_name}
            </div>
            <SaveToggle
              variant="wide"
              listingId={listing.id}
              saved={listing.is_favorite}
              onSavedChange={(saved) => setListing({ ...listing, is_favorite: saved })}
            />
          </div>

          <div className="panel mt-3 d-flex align-items-center gap-3">
            <Avatar name={listing.owner} size={48} />
            <div>
              <div className="small text-muted">Seller</div>
              <div className="fw-semibold">{listing.owner}</div>
            </div>
          </div>

          {isMine && (
            <a href={`/admin/ads/${listing.id}/edit`} className="btn btn-outline-brand w-100 mt-3 rounded-pill">
              ✎ Edit my ad
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
