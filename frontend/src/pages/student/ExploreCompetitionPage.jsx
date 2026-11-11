import { useEffect, useMemo, useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import CompetitionCard from '../../components/competition/CompetitionCard';
import PublicFilter from '../../components/competition/PublicFilter';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { usePublicCategories, usePublicCompetitions } from '../../hooks/usePublicCompetitions';

function dateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="aspect-video bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-4/5 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        <div className="h-10 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function ExploreCompetitionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const filters = useMemo(() => ({
    q: searchParams.get('q') || '',
    category_id: searchParams.get('category_id') || '',
    level: searchParams.get('level') || '',
    mode: searchParams.get('mode') || '',
    is_free: searchParams.get('is_free') || '',
    deadline: searchParams.get('deadline') || '',
    sort: searchParams.get('sort') || 'newest',
    page: Math.max(1, Number(searchParams.get('page')) || 1)
  }), [searchParams]);

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = searchInput.trim();
      if (value !== filters.q) {
        const next = new URLSearchParams(searchParams);
        if (value) next.set('q', value);
        else next.delete('q');
        next.delete('page');
        setSearchParams(next, { replace: true });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, filters.q, searchParams, setSearchParams]);

  const queryParams = useMemo(() => {
    const params = {
      page: filters.page,
      limit: 9,
      sort: filters.sort
    };
    if (filters.q) params.q = filters.q;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.level) params.level = filters.level;
    if (filters.mode) params.mode = filters.mode;
    if (filters.is_free) params.is_free = filters.is_free;
    if (filters.deadline) params.deadline_before = dateAfterDays(Number(filters.deadline));
    return params;
  }, [filters]);

  const competitionsQuery = usePublicCompetitions(queryParams);
  const categoriesQuery = usePublicCategories();
  const competitions = competitionsQuery.data?.data || [];
  const meta = competitionsQuery.data?.meta || { page: filters.page, total: 0, totalPages: 0 };

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }

  function goToPage(page) {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set('page', String(page));
    else next.delete('page');
    setSearchParams(next);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('q', searchInput.trim());
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Explore Competitions</h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">Temukan kompetisi yang sesuai dengan minat dan rencana prestasimu.</p>
      </header>

      <label className="relative block">
        <Search aria-hidden="true" size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Cari nama atau penyelenggara kompetisi..."
          aria-label="Cari kompetisi"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />
      </label>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4 lg:gap-8">
        <aside aria-label="Filter kompetisi" className="lg:col-span-1">
          {categoriesQuery.isError
            ? <Card><p role="alert" className="text-sm text-rose-700">Kategori gagal dimuat. <button type="button" onClick={() => categoriesQuery.refetch()} className="font-semibold underline">Coba lagi</button></p></Card>
            : <PublicFilter filters={filters} categories={categoriesQuery.data || []} onChange={updateFilter} onReset={resetFilters} />}
        </aside>

        <section aria-label="Hasil kompetisi" className="min-w-0 lg:col-span-3">
          {competitionsQuery.isError ? (
            <Card className="text-center">
              <p role="alert" className="text-rose-700">Kompetisi gagal dimuat. Periksa koneksi lalu coba lagi.</p>
              <button type="button" onClick={() => competitionsQuery.refetch()} className="mt-3 font-semibold text-indigo-600 hover:underline">Coba lagi</button>
            </Card>
          ) : competitionsQuery.isPending ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}</div>
          ) : competitions.length === 0 ? (
            <Card className="flex min-h-64 flex-col items-center justify-center text-center">
              <SearchX size={38} className="text-slate-400" aria-hidden="true" />
              <h2 className="mt-3 font-bold text-slate-800">Tidak ada kompetisi yang cocok dengan filter.</h2>
              <p className="mt-1 text-sm text-slate-500">Coba ubah kata pencarian atau reset filter.</p>
              <button type="button" onClick={resetFilters} className="mt-3 text-sm font-semibold text-indigo-600 hover:underline">Reset filter</button>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">{meta.total} kompetisi ditemukan</p>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  Urutkan
                  <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    <option value="newest">Terbaru</option>
                    <option value="deadline_asc">Deadline terdekat</option>
                    <option value="name_asc">Nama A–Z</option>
                  </select>
                </label>
              </div>
              <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${competitionsQuery.isFetching ? 'opacity-60' : ''}`}>
                {competitions.map((competition) => <CompetitionCard key={competition.id} competition={competition} />)}
              </div>
              {meta.totalPages > 1 && (
                <nav aria-label="Pagination kompetisi" className="mt-6 flex items-center justify-center gap-4">
                  <button type="button" disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">Sebelumnya</button>
                  <span className="text-sm text-slate-600">Halaman {meta.page} dari {meta.totalPages}</span>
                  <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => goToPage(meta.page + 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">Berikutnya</button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
