import PageHeader from "../components/PageHeader.jsx";
export default function GenericPage({ title, subtitle }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card placeholder">
        <b>MONE AI</b>
        <h3>{title} module</h3>
        <p>
          The UI route is ready. Connect this module to its backend endpoints
          next.
        </p>
      </div>
    </>
  );
}
