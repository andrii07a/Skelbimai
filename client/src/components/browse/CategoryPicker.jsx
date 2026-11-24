// Categories: a vertical list on wide screens, scrollable chips on phones.
export default function CategoryPicker({ categories, selected, onSelect }) {
  const total = categories.reduce((sum, c) => sum + c.listingsTotal, 0);
  const options = [{ id: '', title: 'Everything', listingsTotal: total }, ...categories];

  return (
    <nav aria-label="Categories">
      <h2 className="panel-heading d-none d-lg-block">Categories</h2>
      <ul className="category-list">
        {options.map((c) => {
          const active = String(c.id) === String(selected);
          return (
            <li key={c.id || 'all'}>
              <button
                type="button"
                className={`category-option${active ? ' is-active' : ''}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(String(c.id))}
              >
                <span>{c.title}</span>
                <span className="category-count">{c.listingsTotal}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
