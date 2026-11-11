import { useState } from 'react';
import { ArrowRight, Award, GraduationCap, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CompetitionCard from '../../components/competition/CompetitionCard';
import Spinner from '../../components/ui/Spinner';
import { usePublicCompetitions } from '../../hooks/usePublicCompetitions';
import { usePublicStats, useRecentAchievements } from '../../hooks/usePublicLandingData';
import { getMediaUrl } from '../../utils/mediaUrl';
import { formatDate } from '../../utils/formatDate';
import { APP_NAME } from '../../utils/constants';

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <Card className="flex min-w-0 items-center gap-4 p-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Icon size={23} /></span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        {loading ? <div className="mt-1 h-7 w-20 animate-pulse rounded bg-slate-200" /> : <p className="text-2xl font-extrabold text-slate-900">{Number(value || 0).toLocaleString('id-ID')}</p>}
      </div>
    </Card>
  );
}

function AchievementCard({ achievement }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  return (
    <Card className="flex h-full min-w-0 flex-col items-center text-center">
      {achievement.photo_url && !photoFailed
        ? <img onError={() => setPhotoFailed(true)} src={getMediaUrl(achievement.photo_url)} alt="" className="h-20 w-20 rounded-full bg-slate-100 object-cover" />
        : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><GraduationCap size={30} /></div>}
      <h3 className="mt-4 font-bold text-slate-900">{achievement.student_name || 'Mahasiswa'}</h3>
      <p className="mt-1 text-sm text-slate-500">{achievement.program_studi || 'Mahasiswa'}</p>
      <p className="mt-4 line-clamp-2 text-sm font-medium text-slate-700">{achievement.result_title || 'Prestasi terverifikasi'}</p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{achievement.competition_name || 'Kompetisi'}{achievement.level ? ` · ${achievement.level}` : ''}</p>
      <span className="mt-auto pt-4 text-xs text-slate-400">{formatDate(achievement.date)}</span>
    </Card>
  );
}

function SectionError({ message }) {
  return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</p>;
}

export default function LandingPage() {
  const statsQuery = usePublicStats();
  const competitionsQuery = usePublicCompetitions({ limit: 3, sort: 'newest', page: 1 });
  const achievementsQuery = useRecentAchievements(3);

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 text-white">
        <div aria-hidden="true" className="absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-48 left-1/3 -z-10 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-indigo-100"><Trophy size={15} /> Platform kompetisi dan prestasi mahasiswa</span>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">Temukan Kompetisi, Raih Prestasi, Bangun Portofolio.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-indigo-100 md:text-lg md:leading-8">Jelajahi kesempatan kompetisi, rayakan pencapaian, dan bangun rekam jejak prestasimu bersama {APP_NAME}.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/competitions"><Button size="lg">Cari Kompetisi <ArrowRight size={18} /></Button></Link>
              <a href="#achievements"><Button size="lg" variant="secondary">Lihat Prestasi</Button></a>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative mx-auto flex aspect-square max-w-md items-center justify-center rounded-[2.5rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur">
              <div className="absolute inset-8 rounded-[2rem] border border-dashed border-white/30" />
              <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 shadow-[0_0_80px_rgba(251,191,36,0.35)]"><Trophy size={82} className="text-white drop-shadow-lg" /></div>
              <div className="absolute left-7 top-12 rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur"><Award className="text-amber-300" size={27} /><p className="mt-2 text-xs font-semibold">Prestasi</p></div>
              <div className="absolute bottom-12 right-7 rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur"><GraduationCap className="text-cyan-200" size={27} /><p className="mt-2 text-xs font-semibold">Potensi</p></div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={`Statistik ${APP_NAME}`} className="relative z-10 mx-auto -mt-8 grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-3 sm:px-6 lg:px-8">
        {statsQuery.isError
          ? <div className="sm:col-span-3"><SectionError message="Statistik belum dapat dimuat." /></div>
          : <>
            <StatCard icon={Trophy} label="Total Kompetisi" value={statsQuery.data?.total_competitions} loading={statsQuery.isPending} />
            <StatCard icon={Award} label="Total Prestasi" value={statsQuery.data?.total_achievements} loading={statsQuery.isPending} />
            <StatCard icon={GraduationCap} label="Mahasiswa Berprestasi" value={statsQuery.data?.total_students} loading={statsQuery.isPending} />
          </>}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600 sm:text-sm">Kesempatan terbaru</p><h2 className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl">Kompetisi pilihan</h2></div>
          <Link to="/competitions" className="text-sm font-semibold text-indigo-700 hover:underline">Lihat semua kompetisi <span aria-hidden="true">→</span></Link>
        </div>
        {competitionsQuery.isError
          ? <SectionError message="Kompetisi terbaru gagal dimuat. Silakan coba beberapa saat lagi." />
          : competitionsQuery.isPending
            ? <Spinner label="Memuat kompetisi terbaru..." />
            : competitionsQuery.data.data.length
              ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{competitionsQuery.data.data.slice(0, 3).map((competition) => <CompetitionCard key={competition.id} competition={competition} />)}</div>
              : <Card className="text-center text-slate-600">Belum ada kompetisi yang dipublikasikan.</Card>}
        <div className="mt-7 text-center"><Link to="/competitions"><Button variant="secondary">Lihat Semua Kompetisi <ArrowRight size={16} /></Button></Link></div>
      </section>

      <section id="achievements" className="scroll-mt-24 bg-white py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 max-w-2xl"><p className="text-xs font-bold uppercase tracking-wider text-indigo-600 sm:text-sm">Inspirasi mahasiswa</p><h2 className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl">Prestasi yang membanggakan</h2><p className="mt-3 text-sm text-slate-600 md:text-base">Apresiasi untuk kerja keras dan pencapaian mahasiswa.</p></div>
          {achievementsQuery.isError
            ? <SectionError message="Prestasi terbaru gagal dimuat. Silakan coba beberapa saat lagi." />
            : achievementsQuery.isPending
              ? <Spinner label="Memuat prestasi terbaru..." />
              : achievementsQuery.data.length
                ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{achievementsQuery.data.slice(0, 3).map((achievement) => <AchievementCard key={achievement.id} achievement={achievement} />)}</div>
                : <Card className="text-center text-slate-600">Prestasi terverifikasi akan ditampilkan di sini.</Card>}
        </div>
      </section>

      <section className="bg-indigo-700 px-4 py-14 text-center text-white">
        <h2 className="text-3xl font-extrabold">Siap Berkompetisi?</h2>
        <p className="mx-auto mt-3 max-w-xl text-indigo-100">Daftar akun sekarang dan mulai temukan kesempatan untuk meraih prestasi.</p>
        <Link to="/register" className="mt-6 inline-block"><Button size="lg" variant="secondary">Daftar Akun <ArrowRight size={17} /></Button></Link>
      </section>
    </div>
  );
}
