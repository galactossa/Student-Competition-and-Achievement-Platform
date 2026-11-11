function daysUntil(value) {
  if (!value) return null;
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return null;
  if (String(value).includes('T') && deadline.getTime() < Date.now()) return -1;

  const deadlineDay = Date.UTC(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  const today = new Date();
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((deadlineDay - todayDay) / 86400000);
}

export default function CountdownBadge({ deadline }) {
  const days = daysUntil(deadline);
  if (days === null) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Deadline belum tersedia</span>;
  }
  if (days < 0) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Pendaftaran ditutup</span>;
  }

  const color = days < 3
    ? 'bg-rose-100 text-rose-800'
    : days < 7
      ? 'bg-amber-100 text-amber-800'
      : 'bg-emerald-100 text-emerald-800';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>Sisa {days} hari lagi</span>;
}
