// Ad in the grid view: photo with price on it, title below.
import { Link } from 'react-router';
import { money, timeAgo } from '../../lib/format.js';
import SaveToggle from './SaveToggle.jsx';

export default function ListingTile({ listing, onSavedChange }) {
  return (
    <article className="tile">
      <Link to={`/item/${listing.id}`} className="tile-photo">
        <img src={listing.photoUrl} alt={listing.title} loading="lazy" />
        <span className="price-tag">{money(listing.price)}</span>
      </Link>
      <div className="tile-save">
        <SaveToggle listingId={listing.id} saved={listing.saved} onSavedChange={onSavedChange} />
      </div>
      <div className="tile-body">
        <Link to={`/item/${listing.id}`} className="tile-title">
          {listing.title}
        </Link>
        <div className="tile-meta">
          <span>{listing.category.title}</span>
          <span>·</span>
          <span>{timeAgo(listing.postedAt)}</span>
          {listing.commentsTotal > 0 && <span className="ms-auto">💬 {listing.commentsTotal}</span>}
        </div>
      </div>
    </article>
  );
}
