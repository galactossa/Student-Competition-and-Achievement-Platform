import { useEffect, useState } from 'react';
import { Award, CalendarClock, ClipboardList, Compass, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useAuth from '../../hooks/useAuth';
import { APP_NAME } from '../../utils/constants';

const stats = [
  { label: 'Kompetisi Mendatang', value: '0', icon: CalendarClock },
  { label: 'Pendaftaran Saya', value: '0', icon: ClipboardList },
  { label: 'Tim Aktif', value: '0', icon: Users },
  { label: 'Pengumpulan Tertunda', value: '0', icon: Send },
  { label: 'Prestasi Terverifikasi', value: '0', icon: Award },
  { label: 'Skor Prestasi', value: '0', icon: Award }
];

export default function StudentDashboardPage() {
  const { user, student } = useAuth();
  const [pingMessage, setPingMessage] = useState('Memeriksa akses mahasiswa...');

  useEffect(() => {
    let active = true;
    authApi.pingMahasiswa()
      .then(({ data }) => {
        if (active) setPingMessage(data.message || 'Akses mahasiswa: OK');
      })
      .catch(() => {
        if (active) setPingMessage('Akses mahasiswa gagal diperiksa.');
        toast.error('Tidak dapat memverifikasi akses mahasiswa.');
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Ringkasan mahasiswa</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Selamat datang, {user?.name}</h1>
        <p className="mt-2 text-slate-600">Pantau kompetisi, tim, dan pencapaian Anda di {APP_NAME}.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Statistik mahasiswa">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={21} /></span>
            <div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>
          </Card>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3"><span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Compass size={20} /></span><h2 className="text-lg font-bold">Segera Hadir</h2></div>
          <p className="mt-3 text-sm text-slate-600">Jelajahi kompetisi yang sesuai dengan minat dan program studi Anda.</p>
          <Button className="mt-5" variant="secondary" disabled>Jelajahi Kompetisi</Button>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Akun Anda</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">NIM</dt><dd className="mt-1 font-medium">{student?.nim || 'Belum diisi'}</dd></div>
            <div><dt className="text-slate-500">Program studi</dt><dd className="mt-1 font-medium">{student?.program_studi || 'Belum diisi'}</dd></div>
            <div><dt className="text-slate-500">Angkatan</dt><dd className="mt-1 font-medium">{student?.angkatan || 'Belum diisi'}</dd></div>
            <div><dt className="text-slate-500">Peran</dt><dd className="mt-1"><Badge role={user?.role} /></dd></div>
          </dl>
        </Card>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold">Status Akses</h2><p className="mt-1 text-sm text-slate-600">Endpoint khusus mahasiswa untuk demonstrasi RBAC.</p></div>
          <Badge variant={pingMessage.includes('gagal') ? 'warning' : 'success'}>{pingMessage}</Badge>
        </div>
        <p className="mt-3 text-xs text-slate-500">GET /api/auth/ping/mahasiswa</p>
      </Card>
    </div>
  );
}
