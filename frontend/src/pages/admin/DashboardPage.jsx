import { Link } from 'react-router-dom';
import { BarChart3, CheckCircle2, FileCheck2, FolderKanban, Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/competition/StatusBadge';
import { useCompetitions, useCompetitionStats } from '../../hooks/useCompetitions';
import useAuth from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatDate';
import { getApiErrorMessage } from '../../api/competitionApi';
import { useState } from 'react';
import { APP_NAME } from '../../utils/constants';

const statCards = [
  ['Total Kompetisi', 'total', FolderKanban],
  ['Published', 'published', CheckCircle2],
  ['Pendaftaran Dibuka', 'registration_open', BarChart3],
  ['Draft', 'draft', FileCheck2]
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [pingState, setPingState] = useState('idle');
  const [pingMessage, setPingMessage] = useState('');
  const stats = useCompetitionStats();
  const latest = useCompetitions({ page: 1, limit: 5, sort: 'newest' });
  const canManage = ['admin_pka', 'super_admin'].includes(user?.role);

  async function checkAdminAccess() {
    setPingState('loading');
    setPingMessage('');
    try {
      const { data } = await authApi.pingAdmin();
      setPingState('success');
      setPingMessage(data.message || 'Akses admin berhasil (200 OK).');
      toast.success('Akses admin terverifikasi.');
    } catch (error) {
      setPingState('error');
      setPingMessage(getApiErrorMessage(error, error.response?.status === 403
        ? 'Akses ditolak (403 Forbidden).'
        : 'Tidak dapat terhubung ke server.'));
      toast.error('Pemeriksaan akses admin gagal.');
    }
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Ringkasan administrasi</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Selamat datang Admin, {user?.name}</h1>
          <p className="mt-2 text-slate-600">Pantau dan kelola kompetisi di {APP_NAME}.</p>
        </div>
        {canManage && <div className="flex gap-2">
          <Link to="/admin/competitions"><Button variant="secondary"><FolderKanban size={16} /> Kelola Kompetisi</Button></Link>
          <Link to="/admin/competitions/create"><Button><Plus size={16} /> Tambah</Button></Link>
        </div>}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistik kompetisi">
        {statCards.map(([label, key, Icon]) => (
          <Card key={key} className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={21} /></span>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              {stats.isPending ? <div className="mt-2 h-7 w-12 animate-pulse rounded bg-slate-200" /> : <p className="mt-1 text-2xl font-bold text-slate-900">{stats.data?.[key] ?? '—'}</p>}
            </div>
          </Card>
        ))}
      </section>
      {stats.isError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Statistik kompetisi gagal dimuat. {getApiErrorMessage(stats.error)}</p>}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-bold">5 Kompetisi Terbaru</h2><p className="mt-1 text-sm text-slate-500">Kompetisi yang terakhir ditambahkan.</p></div>
            {canManage && <Link className="text-sm font-semibold text-indigo-600 hover:underline" to="/admin/competitions">Lihat semua</Link>}
          </div>
          {latest.isPending ? <div className="mt-5 space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />)}</div>
            : latest.isError ? <p className="mt-5 text-sm text-rose-600">Daftar kompetisi gagal dimuat.</p>
              : latest.data.data.length ? <ul className="mt-5 divide-y divide-slate-100">
                {latest.data.data.map((competition) => <li key={competition.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0"><Link className="truncate font-semibold text-slate-800 hover:text-indigo-600" to={`/admin/competitions/${competition.id}`}>{competition.name}</Link><p className="mt-1 text-xs text-slate-500">Deadline: {formatDate(competition.registration_deadline)}</p></div>
                  <StatusBadge status={competition.status} />
                </li>)}
              </ul>
              : <p className="mt-5 rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">Belum ada kompetisi.</p>}
        </Card>
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3"><span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><CheckCircle2 size={20} /></span><h2 className="text-lg font-bold">Test RBAC</h2></div>
            <p className="mt-3 text-sm text-slate-600">Periksa akses endpoint admin sesuai role akun.</p>
            <Button className="mt-4" loading={pingState === 'loading'} onClick={checkAdminAccess}>Cek Akses Admin</Button>
            {pingMessage && <p className={`mt-3 rounded-lg p-3 text-sm font-medium ${pingState === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`} role="status">{pingMessage}</p>}
            <p className="mt-3 text-xs text-slate-500">GET /api/auth/ping/admin · <Badge role={user?.role} /></p>
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-bold"><Users size={18} /> Modul lainnya</h2>
            <p className="mt-2 text-sm text-slate-600">Pengelolaan tim, submissions, dan prestasi akan tersedia pada tahap berikutnya.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
