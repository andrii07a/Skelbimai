// Categories: a vertical list on wide screens, scrollable chips on phones.
export default function CategoryPicker({ categories, selected, onSelect }) {
  const total = categories.reduce((sum, c) => sum + c.ad_count, 0);
  const options = [{ id: '', name: 'Everything', ad_count: total }, ...categories];

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
                <span>{c.name}</span>
                <span className="category-count">{c.ad_count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
