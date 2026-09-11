import "./PageHeader.css";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="admin-page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
