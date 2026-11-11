const statusNames = {
  draft: 'Draft',
  published: 'Published',
  registration_open: 'Pendaftaran Dibuka',
  registration_closed: 'Pendaftaran Ditutup',
  submission: 'Pengumpulan',
  competition: 'Berlangsung',
  result_announced: 'Hasil Diumumkan',
  completed: 'Selesai'
};

const colors = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-blue-100 text-blue-800',
  registration_open: 'bg-green-100 text-green-800',
  registration_closed: 'bg-yellow-100 text-yellow-800',
  submission: 'bg-orange-100 text-orange-800',
  competition: 'bg-purple-100 text-purple-800',
  result_announced: 'bg-teal-100 text-teal-800',
  completed: 'bg-emerald-100 text-emerald-800'
};

export default function StatusBadge({ status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] || colors.draft}`}>{statusNames[status] || status || '—'}</span>;
}
