// Ad in the list view: small photo on the left, more text on the right.
import { Link } from 'react-router';
import { money, timeAgo } from '../../lib/format.js';
import SaveToggle from './SaveToggle.jsx';

export default function ListingRow({ listing, onSavedChange }) {
  return (
    <article className="row-item">
      <Link to={`/item/${listing.id}`} className="row-item-photo">
        <img src={listing.photoUrl} alt={listing.title} loading="lazy" />
      </Link>
      <div className="row-item-body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <Link to={`/item/${listing.id}`} className="row-item-title">
            {listing.title}
          </Link>
          <SaveToggle listingId={listing.id} saved={listing.saved} onSavedChange={onSavedChange} />
        </div>
        <p className="row-item-text">{listing.details}</p>
        <div className="row-item-footer">
          <strong className="row-item-price">{money(listing.price)}</strong>
          <span className="text-muted small">
            {listing.category.title} · {listing.seller} · {timeAgo(listing.postedAt)}
            {listing.commentsTotal > 0 && ` · 💬 ${listing.commentsTotal}`}
          </span>
        </div>
      </div>
    </article>
  );
}
