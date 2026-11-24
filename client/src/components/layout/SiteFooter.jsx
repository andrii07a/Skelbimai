import { Link } from 'react-router';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container d-flex flex-column flex-md-row justify-content-between gap-2">
        <div>
          <strong>Turgus</strong> · a marketplace for things and services near you
        </div>
        <div className="d-flex gap-3">
          <Link to="/">Browse</Link>
          <Link to="/saved">Saved</Link>
          <a href="/admin">My account</a>
        </div>
      </div>
    </footer>
  );
}
