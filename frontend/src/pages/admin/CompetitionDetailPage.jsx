import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Download, Pencil, MapPin } from 'lucide-react';
import { useState } from 'react';
import { getMediaUrl } from '../../utils/mediaUrl';
import { formatDate } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';
import { useChangeCompetitionStatus, useCompetition } from '../../hooks/useCompetitions';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/competition/StatusBadge';

const nextStatus = {
  draft: 'published',
  published: 'registration_open',
  registration_open: 'registration_closed',
  registration_closed: 'submission',
  submission: 'competition',
  competition: 'result_announced',
  result_announced: 'completed'
};
const labels = {
  name: 'Nama',
  organizer: 'Penyelenggara',
  category: 'Kategori',
  level: 'Level',
  mode: 'Mode',
  location: 'Lokasi',
  contact_person: 'Kontak Person',
  description: 'Deskripsi',
  requirements: 'Persyaratan',
  prize: 'Hadiah'
};

export default function CompetitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const query = useCompetition(id);
  const statusMutation = useChangeCompetitionStatus(id);
  const [selectedStatus, setSelectedStatus] = useState('');
  const canManage = ['admin_pka', 'super_admin'].includes(user?.role);

  if (query.isPending) return <Spinner fullScreen label="Memuat detail kompetisi..." />;
  if (query.isError) return <p role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-700">Kompetisi tidak ditemukan atau gagal dimuat.</p>;
  const competition = query.data;
  const allowedNext = nextStatus[competition.status];

  async function changeStatus(event) {
    const status = event.target.value;
    setSelectedStatus(status);
    if (!status) return;
    try {
      await statusMutation.mutateAsync(status);
      setSelectedStatus('');
    } catch {
      setSelectedStatus('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600" to="/admin/competitions"><ArrowLeft size={16} /> Kembali ke daftar</Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{competition.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={competition.status} /><span className="text-sm text-slate-500">{competition.slug}</span></div>
        </div>
        {canManage && <div className="flex gap-2">
          <Link to={`/admin/competitions/${id}/edit`}><Button variant="secondary"><Pencil size={16} /> Edit</Button></Link>
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/competitions')}>Kembali</Button>
        </div>}
      </div>
      {canManage && <Card className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="font-bold">Ubah Status</h2><p className="mt-1 text-sm text-slate-500">Hanya transisi berikutnya yang diizinkan.</p></div>
        <div className="flex gap-2">
          <Select aria-label="Status berikutnya" value={selectedStatus} onChange={changeStatus} disabled={!allowedNext || statusMutation.isPending} className="min-w-60">
            <option value="">{allowedNext ? 'Pilih status berikutnya' : 'Status sudah final'}</option>
            {allowedNext && <option value={allowedNext}>{allowedNext.replaceAll('_', ' ')}</option>}
          </Select>
          {statusMutation.isPending && <Spinner label="Menyimpan..." />}
        </div>
      </Card>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-5">
          {competition.poster_url
            ? <img src={getMediaUrl(competition.poster_url)} alt={`Poster ${competition.name}`} className="max-h-[28rem] w-full rounded-xl bg-slate-50 object-contain" />
            : <div className="flex h-56 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">Poster belum tersedia</div>}
          {competition.guidebook_url && <a className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:underline" href={getMediaUrl(competition.guidebook_url)} target="_blank" rel="noreferrer"><Download size={17} /> Unduh guidebook</a>}
        </Card>
        <div className="space-y-5">
          <Card>
            <h2 className="text-lg font-bold">Informasi Kompetisi</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              {Object.entries(labels).map(([field, label]) => {
                const value = field === 'category' ? competition.category?.name : competition[field];
                if (!value) return null;
                return <div key={field} className="min-w-0"><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>;
              })}
              <div><dt className="text-slate-500">Biaya</dt><dd className="mt-1 font-medium">Rp {Number(competition.price || 0).toLocaleString('id-ID')}</dd></div>
              {competition.registration_url && <div className="col-span-2"><dt className="text-slate-500">Pendaftaran</dt><dd className="mt-1 break-all"><a className="text-indigo-600 hover:underline" href={competition.registration_url} target="_blank" rel="noreferrer">{competition.registration_url}</a></dd></div>}
            </dl>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarDays size={19} /> Jadwal</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-indigo-100 pl-5 text-sm">
              {[['Pendaftaran', competition.registration_deadline], ['Pengumpulan', competition.submission_deadline], ['Tanggal mulai', competition.start_date], ['Tanggal akhir', competition.end_date], ['Pengumuman hasil', competition.result_date]].filter(([, date]) => date).map(([label, date]) => (
                <li key={label} className="relative"><span className="absolute -left-[1.65rem] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500" /><p className="font-semibold">{label}</p><p className="mt-1 text-slate-500">{formatDate(date, { dateStyle: 'medium', ...(String(date).includes('T') ? { timeStyle: 'short' } : {}) })}</p></li>
              ))}
            </ol>
            {competition.location && <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><MapPin size={16} /> {competition.location}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
