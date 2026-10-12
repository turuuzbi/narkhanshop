export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Ачаалж байна">
      <div className="skeleton h-9 w-56" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
      </div>
      <div className="skeleton mt-6 h-72" />
    </div>
  );
}
