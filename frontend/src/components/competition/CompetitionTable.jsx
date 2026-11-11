import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatDate';
import { getMediaUrl } from '../../utils/mediaUrl';
import Button from '../ui/Button';
import Card from '../ui/Card';
import StatusBadge from './StatusBadge';

export default function CompetitionTable({ competitions, onDelete, deleting = false, readOnly = false }) {
  if (!competitions.length) {
    return (
      <Card className="py-12 text-center">
        <p className="text-lg font-semibold text-slate-800">Belum ada kompetisi</p>
        <p className="mt-2 text-sm text-slate-500">Tambah kompetisi pertama untuk memulai.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{['Poster', 'Nama', 'Kategori', 'Level', 'Status', 'Deadline Registrasi', 'Aksi'].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {competitions.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">{item.poster_url ? <img src={getMediaUrl(item.poster_url)} alt={`Poster ${item.name}`} className="h-12 w-16 rounded object-cover" /> : <div className="h-12 w-16 rounded bg-slate-100" />}</td>
                <td className="max-w-56 px-4 py-3 font-semibold text-slate-800">{item.name}<span className="mt-1 block truncate text-xs font-normal text-slate-500">{item.organizer}</span></td>
                <td className="px-4 py-3">{item.category?.name || '—'}</td>
                <td className="px-4 py-3">{item.level}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(item.registration_deadline, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td className="px-4 py-3"><Actions item={item} onDelete={onDelete} deleting={deleting} readOnly={readOnly} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {competitions.map((item) => (
          <Card key={item.id} className="flex gap-3">
            {item.poster_url ? <img src={getMediaUrl(item.poster_url)} alt={`Poster ${item.name}`} className="h-20 w-20 shrink-0 rounded-lg object-cover" /> : <div className="h-20 w-20 shrink-0 rounded-lg bg-slate-100" />}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{item.name}</h3>
              <p className="text-xs text-slate-500">{item.category?.name || '—'} · {item.level}</p>
              <div className="mt-2"><StatusBadge status={item.status} /></div>
              <p className="mt-2 text-xs text-slate-500">Pendaftaran: {formatDate(item.registration_deadline)}</p>
              <div className="mt-3"><Actions item={item} onDelete={onDelete} deleting={deleting} readOnly={readOnly} /></div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function Actions({ item, onDelete, deleting, readOnly }) {
  return (
    <div className="flex items-center gap-1">
      <Link aria-label={`Lihat ${item.name}`} title="Lihat" to={`/admin/competitions/${item.id}`}><Button type="button" variant="ghost" size="sm"><Eye size={16} /></Button></Link>
      {!readOnly && <>
        <Link aria-label={`Edit ${item.name}`} title="Edit" to={`/admin/competitions/${item.id}/edit`}><Button type="button" variant="ghost" size="sm"><Pencil size={16} /></Button></Link>
        <Button type="button" aria-label={`Hapus ${item.name}`} title="Hapus" variant="ghost" size="sm" disabled={deleting} onClick={() => onDelete(item)}><Trash2 className="text-rose-600" size={16} /></Button>
      </>}
    </div>
  );
}
