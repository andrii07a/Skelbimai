import { pluralize } from '../../lib/format.js';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Cheapest first' },
  { value: 'price_desc', label: 'Most expensive first' },
];

export default function ResultsToolbar({ count, loading, heading, sort, onSortChange, view, onViewChange }) {
  return (
    <div className="results-toolbar">
      <div>
        <h2 className="h5 mb-0">{heading}</h2>
        <span className="text-muted small">{loading ? 'Searching…' : pluralize(count, 'ad')}</span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <label htmlFor="sort" className="visually-hidden">
          Sort
        </label>
        <select id="sort" className="form-select form-select-sm" value={sort} onChange={(e) => onSortChange(e.target.value)}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="view-switch" role="group" aria-label="View">
          <button
            type="button"
            className={view === 'grid' ? 'is-active' : ''}
            aria-pressed={view === 'grid'}
            onClick={() => onViewChange('grid')}
            title="Grid"
          >
            ▦
          </button>
          <button
            type="button"
            className={view === 'list' ? 'is-active' : ''}
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
            title="List"
          >
            ☰
          </button>
        </div>
      </div>
    </div>
  );
}
