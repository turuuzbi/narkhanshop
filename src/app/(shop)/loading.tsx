export default function Loading() {
  return (
    <div className="container-shop pt-8" aria-busy="true" aria-label="Ачаалж байна">
      <div className="skeleton h-10 w-48" />
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[3/4]" />
            <div className="skeleton mt-3 h-4 w-3/4 rounded-full" />
            <div className="skeleton mt-2 h-4 w-1/3 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
