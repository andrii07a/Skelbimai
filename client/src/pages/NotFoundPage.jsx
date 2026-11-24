import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <h1 className="h3">Page not found</h1>
      <p className="text-muted">This address does not exist.</p>
      <Link className="btn btn-primary" to="/">
        Back to all ads
      </Link>
    </div>
  );
}
