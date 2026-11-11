import { useNavigate } from 'react-router-dom';
import CompetitionForm from '../../components/competition/CompetitionForm';
import { useCreateCompetition } from '../../hooks/useCompetitions';

export default function CompetitionCreatePage() {
  const navigate = useNavigate();
  const create = useCreateCompetition();

  async function submit(formData) {
    await create.mutateAsync(formData);
    navigate('/admin/competitions', { replace: true });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-indigo-600">Kompetisi</p>
        <h1 className="mt-1 text-2xl font-bold">Tambah Kompetisi</h1>
        <p className="mt-2 text-sm text-slate-600">Kompetisi baru akan tersimpan dengan status draft.</p>
      </header>
      <CompetitionForm onSubmit={submit} submitting={create.isPending} onCancel={() => navigate('/admin/competitions')} />
    </div>
  );
}
