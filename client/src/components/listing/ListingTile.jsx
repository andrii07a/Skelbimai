// Ad in the grid view: photo with price on it, title below.
import { Link } from 'react-router';
import { money, timeAgo } from '../../lib/format.js';
import { photoUrl } from '../../lib/http.js';
import SaveToggle from './SaveToggle.jsx';

export default function ListingTile({ listing, onSavedChange }) {
  return (
    <article className="tile">
      <Link to={`/item/${listing.id}`} className="tile-photo">
        <img src={photoUrl(listing.image)} alt={listing.title} loading="lazy" />
        <span className="price-tag">{money(listing.price)}</span>
      </Link>
      <div className="tile-save">
        <SaveToggle listingId={listing.id} saved={listing.is_favorite} onSavedChange={onSavedChange} />
      </div>
      <div className="tile-body">
        <Link to={`/item/${listing.id}`} className="tile-title">
          {listing.title}
        </Link>
        <div className="tile-meta">
          <span>{listing.category_name}</span>
          <span>·</span>
          <span>{timeAgo(listing.created_at)}</span>
          {listing.comment_count > 0 && <span className="ms-auto">💬 {listing.comment_count}</span>}
        </div>
      </div>
    </article>
  );
}
