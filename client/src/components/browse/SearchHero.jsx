// The coloured band at the top of the browse page with the big search field.
export default function SearchHero({ value, onChange, onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="hero">
      <div className="container">
        <h1 className="hero-title">Find it. Sell it. Nearby.</h1>
        <p className="hero-subtitle">Second-hand things and local services from people around you.</p>
        <form className="hero-search" role="search" onSubmit={handleSubmit}>
          <span className="hero-search-icon" aria-hidden="true">
            ⌕
          </span>
          <label htmlFor="search" className="visually-hidden">
            Search by word or phrase
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by word or phrase, e.g. “camping tent”"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="btn btn-accent rounded-pill px-4">
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
