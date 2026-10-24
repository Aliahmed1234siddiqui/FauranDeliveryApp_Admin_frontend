export function PageHeader({ title, description, actions, breadcrumb, meta }) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        {breadcrumb}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {meta && <div className="page-header-meta">{meta}</div>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
