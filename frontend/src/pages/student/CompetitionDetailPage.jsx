import { useState } from 'react';
import { ArrowLeft, CalendarDays, Download, MapPin, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import useAuth from '../../hooks/useAuth';
import { usePublicCompetitionDetail } from '../../hooks/usePublicCompetitions';
import { formatDate } from '../../utils/formatDate';
import { getMediaUrl } from '../../utils/mediaUrl';

function priceText(price) {
  return Number(price || 0) === 0 ? 'Gratis' : `Rp ${Number(price).toLocaleString('id-ID')}`;
}

export default function CompetitionDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const query = usePublicCompetitionDetail(slug);
  const [posterFailed, setPosterFailed] = useState(false);

  if (query.isPending) return <Spinner fullScreen label="Memuat detail kompetisi..." />;
  if (query.isError) {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <h1 className="text-xl font-bold text-slate-900">Kompetisi tidak ditemukan</h1>
        <p role="alert" className="mt-2 text-slate-600">Detail kompetisi gagal dimuat atau kompetisi tidak lagi tersedia.</p>
        <Link to="/competitions" className="mt-4 inline-block font-semibold text-indigo-600 hover:underline">Kembali ke Explore</Link>
      </Card>
    );
  }

  const competition = query.data;
  const posterUrl = getMediaUrl(competition.poster_url);
  const isStudent = user?.role === 'mahasiswa';
  const isAdmin = Boolean(user) && !isStudent;

  function handleRegister() {
    if (!user) {
      toast('Silakan login untuk mendaftar');
      navigate(`/login?redirect=${encodeURIComponent(`/competitions/${slug}`)}`);
      return;
    }
    if (isStudent) toast('Fitur pendaftaran segera hadir');
  }

  return (
    <div className="space-y-5">
      <Link to="/competitions" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700"><ArrowLeft size={17} /> Kembali ke Explore</Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-5">
          <Card className="space-y-5">
            {posterUrl && !posterFailed
              ? <img onError={() => setPosterFailed(true)} src={posterUrl} alt={`Poster ${competition.name}`} className="max-h-[34rem] w-full rounded-xl bg-slate-50 object-contain" />
              : <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">Poster tidak tersedia</div>}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{competition.level}</Badge>
                <span className="text-sm text-slate-500">{competition.category?.name || 'Tanpa kategori'}</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">{competition.name}</h1>
              <p className="mt-2 text-slate-600">Diselenggarakan oleh <span className="font-semibold text-slate-800">{competition.organizer}</span></p>
            </div>
          </Card>

          <Card className="space-y-6">
            <section>
              <h2 className="text-lg font-bold text-slate-900">Deskripsi</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{competition.description || 'Deskripsi kompetisi belum tersedia.'}</p>
            </section>
            <section className="border-t border-slate-100 pt-5">
              <h2 className="text-lg font-bold text-slate-900">Persyaratan</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{competition.requirements || 'Persyaratan belum tersedia.'}</p>
            </section>
            <section className="border-t border-slate-100 pt-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Trophy size={19} className="text-amber-500" /> Hadiah</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{competition.prize || 'Informasi hadiah belum tersedia.'}</p>
            </section>
          </Card>
        </main>

        <aside className="lg:sticky lg:top-6">
          <Card>
            <h2 className="text-lg font-bold text-slate-900">Informasi Pendaftaran</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="flex items-center gap-2 text-slate-500"><CalendarDays size={16} /> Deadline pendaftaran</dt>
                <dd className="mt-1 font-semibold text-slate-900">{formatDate(competition.registration_deadline, { dateStyle: 'long' })}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Tanggal mulai</dt>
                <dd className="mt-1 font-semibold text-slate-900">{formatDate(competition.start_date, { dateStyle: 'long' })}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Tanggal akhir</dt>
                <dd className="mt-1 font-semibold text-slate-900">{formatDate(competition.end_date, { dateStyle: 'long' })}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Mode</dt>
                <dd className="mt-1 font-semibold capitalize text-slate-900">{competition.mode || '—'}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-slate-500"><MapPin size={16} /> Lokasi</dt>
                <dd className="mt-1 font-semibold text-slate-900">{competition.location || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Biaya pendaftaran</dt>
                <dd className="mt-1 font-semibold text-indigo-700">{priceText(competition.price)}</dd>
              </div>
            </dl>
            <Button type="button" className="mt-6 w-full" disabled={authLoading || isAdmin} onClick={handleRegister}>
              {authLoading ? 'Memuat...' : isAdmin ? 'Hanya untuk Mahasiswa' : 'Daftar Kompetisi'}
            </Button>
            {competition.guidebook_url && (
              <a href={getMediaUrl(competition.guidebook_url)} target="_blank" rel="noreferrer" className="mt-3 block">
                <Button type="button" variant="secondary" className="w-full"><Download size={17} /> Download Guidebook</Button>
              </a>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
