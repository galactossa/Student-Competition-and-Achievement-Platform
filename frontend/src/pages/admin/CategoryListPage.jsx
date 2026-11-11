import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import useCompetitionCategories, {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory
} from '../../hooks/useCompetitionCategories';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Textarea from '../../components/ui/Textarea';

const schema = z.object({
  name: z.string().trim().min(3, 'Nama kategori minimal 3 karakter.').max(80, 'Nama maksimal 80 karakter.'),
  description: z.string().optional()
});

export default function CategoryListPage() {
  const { user } = useAuth();
  const query = useCompetitionCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const deletion = useDeleteCategory();
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const isReadOnly = !['admin_pka', 'super_admin'].includes(user?.role);

  async function saveCategory(values) {
    try {
      if (editing) await update.mutateAsync({ id: editing.id, data: values });
      else await create.mutateAsync(values);
      setEditing(null);
    } catch (error) {
      const fieldErrors = error.response?.data?.errors || [];
      fieldErrors.forEach((item) => {
        const name = Array.isArray(item.path) ? item.path[0] : item.field || item.path;
        if (name === 'name' || name === 'description') form.setError(name, { type: 'server', message: item.message });
      });
      if (!fieldErrors.length && !error.response?.data?.message) toast.error('Kategori gagal disimpan.');
    }
  }

  async function removeCategory() {
    try {
      await deletion.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      if (!error.response) toast.error('Kategori gagal dihapus.');
    }
  }

  const form = useForm({
    resolver: zodResolver(schema),
    values: editing ? { name: editing.name, description: editing.description || '' } : { name: '', description: '' }
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-indigo-600">Administrasi</p><h1 className="mt-1 text-2xl font-bold">Kategori Kompetisi</h1><p className="mt-2 text-sm text-slate-600">Atur kategori yang digunakan pada kompetisi.</p></div>
        {!isReadOnly && <Button onClick={() => { form.reset({ name: '', description: '' }); setEditing({ id: null, name: '', description: '' }); }}><Plus size={17} /> Tambah Kategori</Button>}
      </header>
      {query.isPending ? <Spinner label="Memuat kategori..." /> : query.isError
        ? <p role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-700">Kategori tidak dapat dimuat.</p>
        : <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Nama', 'Deskripsi', 'Jumlah Kompetisi', 'Aksi'].map((head) => <th key={head} className="px-5 py-3">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {query.data.map((category) => <tr key={category.id}>
                <td className="px-5 py-4 font-semibold">{category.name}</td>
                <td className="max-w-md px-5 py-4 text-slate-600">{category.description || '—'}</td>
                <td className="px-5 py-4">{category.competition_count}</td>
                <td className="px-5 py-4">{!isReadOnly && <div className="flex gap-1">
                  <Button variant="ghost" size="sm" aria-label={`Edit ${category.name}`} onClick={() => { form.reset({ name: category.name, description: category.description || '' }); setEditing(category); }}><Pencil size={16} /></Button>
                  <Button variant="ghost" size="sm" aria-label={`Hapus ${category.name}`} onClick={() => setDeleteTarget(category)}><Trash2 className="text-rose-600" size={16} /></Button>
                </div>}</td>
              </tr>)}
              {!query.data.length && <tr><td className="px-5 py-10 text-center text-slate-500" colSpan="4">Belum ada kategori.</td></tr>}
            </tbody>
          </table>
        </Card>}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form className="space-y-4" noValidate onSubmit={form.handleSubmit(saveCategory)}>
          <Input label="Nama kategori *" {...form.register('name')} error={form.formState.errors.name?.message} />
          <Textarea label="Deskripsi" rows={4} {...form.register('description')} error={form.formState.errors.description?.message} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Batal</Button>
            <Button type="submit" loading={create.isPending || update.isPending}>Simpan</Button>
          </div>
        </form>
      </Modal>
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Hapus Kategori">
        <p className="text-sm text-slate-600">Hapus kategori <strong>{deleteTarget?.name}</strong>? Kategori yang digunakan kompetisi tidak dapat dihapus.</p>
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button><Button variant="danger" loading={deletion.isPending} onClick={removeCategory}>Hapus</Button></div>
      </Modal>
    </div>
  );
}
