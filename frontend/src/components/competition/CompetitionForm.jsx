import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { mapApiFieldErrors } from '../../api/competitionApi';
import useCompetitionCategories from '../../hooks/useCompetitionCategories';
import Button from '../ui/Button';
import Card from '../ui/Card';
import FileUpload from './FileUpload';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Spinner from '../ui/Spinner';
import Textarea from '../ui/Textarea';
import { toDateTimeLocal } from '../../utils/formatDate';
import { getMediaUrl } from '../../utils/mediaUrl';

const schema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter.').max(200, 'Nama maksimal 200 karakter.'),
  organizer: z.string().trim().min(3, 'Penyelenggara minimal 3 karakter.'),
  category_id: z.string().min(1, 'Pilih kategori kompetisi.'),
  level: z.enum(['Internal Kampus', 'Regional', 'Nasional', 'Internasional'], { error: 'Pilih level kompetisi.' }),
  mode: z.enum(['online', 'offline', 'hybrid'], { error: 'Pilih mode kompetisi.' }),
  description: z.string().optional(),
  requirements: z.string().optional(),
  prize: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  registration_deadline: z.string().optional(),
  submission_deadline: z.string().optional(),
  result_date: z.string().optional(),
  location: z.string().optional(),
  registration_url: z.union([z.literal(''), z.string().url('URL pendaftaran tidak valid.')]),
  contact_person: z.string().optional(),
  price: z.string().optional()
}).superRefine((values, context) => {
  const schedule = [
    ['registration_deadline', values.registration_deadline],
    ['submission_deadline', values.submission_deadline],
    ['end_date', values.end_date]
  ].filter(([, value]) => value);
  for (let index = 1; index < schedule.length; index += 1) {
    if (new Date(schedule[index - 1][1]) >= new Date(schedule[index][1])) {
      context.addIssue({
        code: 'custom',
        path: [schedule[index][0]],
        message: 'Tanggal harus berurutan: pendaftaran, pengumpulan, lalu akhir kompetisi.'
      });
    }
  }
  if (values.price && (!Number.isFinite(Number(values.price)) || Number(values.price) < 0)) {
    context.addIssue({ code: 'custom', path: ['price'], message: 'Harga harus berupa angka nol atau lebih.' });
  }
});

function formValues(competition) {
  return {
    name: competition?.name || '',
    organizer: competition?.organizer || '',
    category_id: competition?.category_id ? String(competition.category_id) : '',
    level: competition?.level || '',
    mode: competition?.mode || '',
    description: competition?.description || '',
    requirements: competition?.requirements || '',
    prize: competition?.prize || '',
    start_date: competition?.start_date?.slice(0, 10) || '',
    end_date: competition?.end_date?.slice(0, 10) || '',
    registration_deadline: toDateTimeLocal(competition?.registration_deadline),
    submission_deadline: toDateTimeLocal(competition?.submission_deadline),
    result_date: competition?.result_date?.slice(0, 10) || '',
    location: competition?.location || '',
    registration_url: competition?.registration_url || '',
    contact_person: competition?.contact_person || '',
    price: competition?.price == null ? '' : String(competition.price)
  };
}

function toApiDate(value) {
  return value ? new Date(value).toISOString() : '';
}

export default function CompetitionForm({ competition, onSubmit, submitting = false, onCancel }) {
  const categories = useCompetitionCategories();
  const [poster, setPoster] = useState(null);
  const [guidebook, setGuidebook] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema), defaultValues: formValues(competition) });

  async function submit(values) {
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== '' && value !== undefined) {
        body.append(key, ['registration_deadline', 'submission_deadline'].includes(key) ? toApiDate(value) : value);
      }
    });
    if (poster) body.append('poster', poster);
    if (guidebook) body.append('guidebook', guidebook);
    try {
      await onSubmit(body);
    } catch (error) {
      if (!mapApiFieldErrors(error, setError) && !error.response?.data?.message) {
        toast.error('Kompetisi gagal disimpan.');
      }
    }
  }

  if (categories.isPending) return <Spinner label="Memuat kategori..." />;
  if (categories.isError) return <p role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">Kategori tidak dapat dimuat. Silakan coba lagi.</p>;

  return (
    <form className="space-y-6" noValidate onSubmit={handleSubmit(submit)}>
      <Card>
        <h2 className="mb-5 text-lg font-bold">1. Informasi Dasar</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nama kompetisi *" {...register('name')} error={errors.name?.message} />
          <Input label="Penyelenggara *" {...register('organizer')} error={errors.organizer?.message} />
          <Select label="Kategori *" {...register('category_id')} error={errors.category_id?.message}>
            <option value="">Pilih kategori</option>
            {categories.data.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </Select>
          <Select label="Level *" {...register('level')} error={errors.level?.message}>
            <option value="">Pilih level</option>
            {['Internal Kampus', 'Regional', 'Nasional', 'Internasional'].map((level) => <option key={level}>{level}</option>)}
          </Select>
          <Select label="Mode *" {...register('mode')} error={errors.mode?.message}>
            <option value="">Pilih mode</option>
            {['online', 'offline', 'hybrid'].map((mode) => <option key={mode} value={mode}>{mode === 'hybrid' ? 'Hybrid' : mode[0].toUpperCase() + mode.slice(1)}</option>)}
          </Select>
        </div>
      </Card>
      <Card>
        <h2 className="mb-5 text-lg font-bold">2. Deskripsi</h2>
        <div className="space-y-4">
          <Textarea label="Deskripsi" rows={4} {...register('description')} />
          <Textarea label="Persyaratan" rows={3} {...register('requirements')} />
          <Textarea label="Hadiah" rows={2} {...register('prize')} />
        </div>
      </Card>
      <Card>
        <h2 className="mb-5 text-lg font-bold">3. Jadwal</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Tanggal mulai" type="date" {...register('start_date')} />
          <Input label="Tanggal akhir" type="date" {...register('end_date')} error={errors.end_date?.message} />
          <Input label="Batas pendaftaran" type="datetime-local" {...register('registration_deadline')} error={errors.registration_deadline?.message} />
          <Input label="Batas pengumpulan" type="datetime-local" {...register('submission_deadline')} error={errors.submission_deadline?.message} />
          <Input label="Tanggal pengumuman hasil" type="date" {...register('result_date')} />
        </div>
      </Card>
      <Card>
        <h2 className="mb-5 text-lg font-bold">4. Detail Tambahan</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Lokasi" {...register('location')} />
          <Input label="URL pendaftaran" type="url" {...register('registration_url')} error={errors.registration_url?.message} />
          <Input label="Kontak person" {...register('contact_person')} />
          <Input label="Biaya (Rp)" type="number" min="0" step="0.01" {...register('price')} error={errors.price?.message} />
        </div>
      </Card>
      <Card>
        <h2 className="mb-5 text-lg font-bold">5. File Pendukung</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <FileUpload name="poster" label="Poster" file={poster} onChange={setPoster} existingUrl={getMediaUrl(competition?.poster_url)} />
          <FileUpload name="guidebook" label="Panduan (PDF)" file={guidebook} onChange={setGuidebook} existingUrl={getMediaUrl(competition?.guidebook_url)} />
        </div>
      </Card>
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onCancel}>Batal</Button>
        <Button type="submit" loading={submitting}>{competition ? 'Simpan Perubahan' : 'Simpan sebagai Draft'}</Button>
      </div>
    </form>
  );
}
