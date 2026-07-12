export default function Loading() {
  return (
    <div className="page-container page-loading" aria-live="polite" aria-busy="true">
      <span className="loading-bean" aria-hidden="true" />
      <p>กำลังเตรียมเส้นทางกาแฟ…</p>
    </div>
  );
}
