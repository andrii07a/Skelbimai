export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status">
      <span className="loader-dot" />
      <span className="loader-dot" />
      <span className="loader-dot" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
