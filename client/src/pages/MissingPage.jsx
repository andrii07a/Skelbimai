import { Link } from 'react-router';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function MissingPage() {
  return (
    <div className="container py-5">
      <EmptyState icon="🧭" title="This page does not exist">
        <Link to="/">Go to the marketplace</Link>
      </EmptyState>
    </div>
  );
}
