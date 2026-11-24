import { Link } from 'react-router';
import { formatPrice } from '../api.js';
import FavoriteButton from './FavoriteButton.jsx';

export default function AdCard({ ad, onFavoriteChange }) {
  return (
    <div className="col">
      <div className="card h-100 shadow-sm ad-card position-relative">
        <FavoriteButton
          adId={ad.id}
          isFavorite={ad.is_favorite}
          onChange={(value) => onFavoriteChange(ad.id, value)}
          className="fav-on-image"
        />
        <Link to={`/ads/${ad.id}`} className="text-decoration-none text-reset">
          <img src={`/uploads/${ad.image}`} className="card-img-top ad-img" alt={ad.title} loading="lazy" />
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <h2 className="h6 card-title mb-1">{ad.title}</h2>
              <span className="fw-bold text-primary text-nowrap">{formatPrice(ad.price)}</span>
            </div>
            <p className="card-text small text-muted line-clamp-2 mb-2">{ad.description}</p>
            <div className="d-flex justify-content-between small text-muted">
              <span className="badge text-bg-light border">{ad.category_name}</span>
              <span>💬 {ad.comment_count}</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
