// Shows ads either as a grid of tiles or as a list of rows.
import ListingRow from './ListingRow.jsx';
import ListingTile from './ListingTile.jsx';

export default function ListingCollection({ listings, view = 'grid', onSavedChange }) {
  if (view === 'list') {
    return (
      <div className="row-list">
        {listings.map((listing) => (
          <ListingRow
            key={listing.id}
            listing={listing}
            onSavedChange={(saved) => onSavedChange(listing.id, saved)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="tile-grid">
      {listings.map((listing) => (
        <ListingTile
          key={listing.id}
          listing={listing}
          onSavedChange={(saved) => onSavedChange(listing.id, saved)}
        />
      ))}
    </div>
  );
}
