import { useNavigate, useParams } from 'react-router-dom';
import CompetitionForm from '../../components/competition/CompetitionForm';
import Spinner from '../../components/ui/Spinner';
import { useCompetition, useUpdateCompetition } from '../../hooks/useCompetitions';

export default function CompetitionEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useCompetition(id);
  const update = useUpdateCompetition(id);

  if (query.isPending) return <Spinner fullScreen label="Memuat kompetisi..." />;
  if (query.isError) return <p role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-700">Kompetisi tidak ditemukan atau gagal dimuat.</p>;

  async function submit(formData) {
    await update.mutateAsync(formData);
    navigate(`/admin/competitions/${id}`, { replace: true });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Kompetisi</p>
        <h1 className="mt-1 text-2xl font-bold">Edit Kompetisi</h1>
      </header>
      <CompetitionForm competition={query.data} onSubmit={submit} submitting={update.isPending} onCancel={() => navigate(`/admin/competitions/${id}`)} />
    </div>
  );
}
