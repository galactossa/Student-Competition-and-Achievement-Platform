import Button from './Button';

export default function Pagination({ page, totalPages, total, limit, onChange, disabled = false }) {
  const first = total ? (page - 1) * limit + 1 : 0;
  const last = Math.min(page * limit, total);
  return (
    <nav aria-label="Navigasi halaman" className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
      <p className="text-sm text-slate-500">Menampilkan {first}–{last} dari {total}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>Sebelumnya</Button>
        <span className="px-2 py-2 text-sm text-slate-600">Halaman {page} dari {Math.max(totalPages, 1)}</span>
        <Button size="sm" variant="secondary" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>Berikutnya</Button>
      </div>
    </nav>
  );
}
