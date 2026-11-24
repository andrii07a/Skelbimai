export default function EmptyState({ icon = '🔍', title, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h2 className="h5">{title}</h2>
      {children && <div className="text-muted">{children}</div>}
    </div>
  );
}
