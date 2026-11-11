import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDeleteCompetition, useCompetitions } from '../../hooks/useCompetitions';
import useCompetitionCategories from '../../hooks/useCompetitionCategories';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import CompetitionFilter from '../../components/competition/CompetitionFilter';
import CompetitionTable from '../../components/competition/CompetitionTable';

const defaultFilters = { q: '', category_id: '', level: '', mode: '', status: '' };

export default function CompetitionListPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const categories = useCompetitionCategories();
  const deletion = useDeleteCompetition();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(filters.q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const params = useMemo(() => ({
    page,
    limit: 10,
    sort: 'newest',
    ...(search && { q: search }),
    ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => key !== 'q' && value))
  }), [filters, page, search]);
  const query = useCompetitions(params);
  const isReadOnly = user?.role === 'pimpinan' || user?.role === 'prodi';

  async function confirmDelete() {
    try {
      await deletion.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      if (!error.response) toast.error('Kompetisi gagal dihapus.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Administrasi</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Manajemen Kompetisi</h1>
          <p className="mt-2 text-sm text-slate-600">Kelola kompetisi dan informasi pendaftarannya.</p>
        </div>
        {!isReadOnly && <Link to="/admin/competitions/create"><Button>+ Tambah Kompetisi</Button></Link>}
      </header>
      <CompetitionFilter
        filters={filters}
        categories={categories.data || []}
        onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
        onReset={() => { setFilters(defaultFilters); setSearch(''); setPage(1); }}
      />
      {categories.isError && <p role="alert" className="text-sm text-rose-600">Kategori filter tidak dapat dimuat.</p>}
      {query.isPending
        ? <div className="space-y-3">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-200" />)}</div>
        : query.isError
          ? <div role="alert" className="rounded-xl bg-rose-50 p-5 text-sm text-rose-700">Kompetisi tidak dapat dimuat. Muat ulang halaman untuk mencoba kembali.</div>
          : <div className="space-y-4">
            <CompetitionTable competitions={query.data.data} onDelete={setDeleteTarget} deleting={deletion.isPending} readOnly={isReadOnly} />
            <Pagination
              page={query.data.meta.page}
              totalPages={query.data.meta.totalPages}
              total={query.data.meta.total}
              limit={query.data.meta.limit}
              onChange={setPage}
              disabled={query.isPlaceholderData}
            />
          </div>}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Konfirmasi Hapus">
        <p className="text-sm leading-6 text-slate-600">Hapus kompetisi <strong>{deleteTarget?.name}</strong>? File poster dan guidebook ikut terhapus.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
          <Button type="button" variant="danger" loading={deletion.isPending} onClick={confirmDelete}>Hapus Kompetisi</Button>
        </div>
      </Modal>
    </div>
  );
}
