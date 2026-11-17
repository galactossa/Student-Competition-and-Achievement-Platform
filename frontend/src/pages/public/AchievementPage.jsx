import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecentAchievements } from '../../hooks/usePublicLandingData';
// Komponen kartu yang SAMA dengan yang dipakai LandingPage.
// Kalau path-nya beda, sesuaikan (lihat langkah 1 di penjelasan).
import AchievementCard from '../../components/ui/AchievementCard';

const getLevel = (a) => a.level ?? a.competition?.level ?? '';

export default function AchievementPage() {
  // Hook yang sama dengan landing page, jadi datanya pasti sama.
  const { data, isPending, isError, refetch } = useRecentAchievements(10);
  const achievements = data ?? [];

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');

  const levels = useMemo(
    () => [...new Set(achievements.map(getLevel).filter(Boolean))],
    [achievements],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return achievements.filter((a) => {
      const matchLevel = level === 'all' || getLevel(a) === level;
      // Cari di seluruh isi data, jadi nggak perlu tahu nama fieldnya.
      const matchQuery = !q || JSON.stringify(a).toLowerCase().includes(q);
      return matchLevel && matchQuery;
    });
  }, [achievements, query, level]);

  return (
    <div className="bg-white">
      <section id="achievements" className="py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 sm:text-sm">
              Inspirasi mahasiswa
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl">
              Prestasi yang membanggakan
            </h1>
            <p className="mt-3 text-sm text-slate-600 md:text-base">
              Apresiasi untuk kerja keras dan pencapaian mahasiswa.
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, program studi, atau kompetisi..."
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 sm:w-48"
            >
              <option value="all">Semua level</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {isPending && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          )}

          {!isPending && isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">Gagal memuat data prestasi.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!isPending && !isError && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              {achievements.length === 0
                ? 'Prestasi terverifikasi akan ditampilkan di sini.'
                : 'Tidak ada prestasi yang cocok dengan pencarianmu.'}
            </div>
          )}

          {!isPending && !isError && filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-indigo-700 py-14 text-center text-white">
        <h2 className="text-2xl font-bold">Siap Berkompetisi?</h2>
        <p className="mt-2 text-sm text-indigo-100">
          Daftar akun sekarang dan mulai temukan kesempatan untuk meraih
          prestasi.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          Daftar Akun →
        </Link>
      </section>
    </div>
  );
}