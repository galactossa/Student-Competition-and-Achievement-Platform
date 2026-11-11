import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import useAuth from '../../hooks/useAuth';
import useRegister from '../../hooks/useRegister';
import { dashboardForRole, safeRedirectPath } from './LoginPage';
import { APP_NAME } from '../../utils/constants';

const schema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter.'),
  email: z.string().trim().email('Masukkan alamat email yang valid.'),
  password: z.string()
    .min(8, 'Password minimal 8 karakter.')
    .regex(/[A-Za-z]/, 'Password harus memiliki huruf.')
    .regex(/[0-9]/, 'Password harus memiliki angka.'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  nim: z.string().optional().refine((value) => !value || /^\d{8,20}$/.test(value), 'NIM harus berisi 8 sampai 20 digit.'),
  program_studi: z.string().optional(),
  angkatan: z.string().optional()
    .refine((value) => !value || /^\d{4}$/.test(value), 'Angkatan harus berupa tahun.')
    .refine((value) => !value || (Number(value) >= 1900 && Number(value) <= 2100), 'Angkatan harus antara 1900 sampai 2100.')
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Konfirmasi password tidak sama.'
}).refine((data) => Boolean(data.nim) === Boolean(data.program_studi), {
  path: ['nim'],
  message: 'NIM dan program studi harus diisi bersamaan.'
});

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = safeRedirectPath(new URLSearchParams(location.search).get('redirect'));
  const mutation = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', confirmPassword: '', nim: '', program_studi: '', angkatan: '' } });

  if (loading) return <Spinner fullScreen />;
  if (user) return <Navigate to={redirect || dashboardForRole(user.role)} replace />;

  async function onSubmit(values) {
    const payload = {
      name: values.name,
      email: values.email,
      password: values.password
    };
    if (values.nim && values.program_studi) {
      payload.nim = values.nim;
      payload.program_studi = values.program_studi;
      if (values.angkatan) payload.angkatan = Number(values.angkatan);
    }

    try {
      const newUser = await mutation.mutateAsync(payload);
      toast.success('Registrasi berhasil.');
      navigate(redirect || dashboardForRole(newUser.role), { replace: true });
    } catch (error) {
      const response = error.response?.data;
      const fieldErrors = response?.errors || [];
      fieldErrors.forEach(({ field, message }) => {
        const key = field === 'program_studi' ? 'program_studi' : field;
        if (['name', 'email', 'password', 'nim', 'program_studi', 'angkatan'].includes(key)) {
          setError(key, { type: 'server', message });
        }
      });
      toast.error(response?.message || 'Registrasi gagal. Periksa kembali data Anda.');
      if (!fieldErrors.length) setError('root', { type: 'server', message: response?.message || 'Registrasi gagal.' });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl bg-white p-7 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 sm:p-9">
        <p className="text-sm font-bold text-indigo-600">{APP_NAME}</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Buat akun mahasiswa</h1>
        <p className="mt-2 text-sm text-slate-600">Buat akun {APP_NAME} untuk mulai mengelola prestasi dan kompetisi Anda.</p>
        <form className="mt-7 grid gap-5 sm:grid-cols-2" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="sm:col-span-2"><Input label="Nama lengkap" autoComplete="name" placeholder="Nama Anda" icon={<UserRound />} error={errors.name?.message} {...register('name')} /></div>
          <div className="sm:col-span-2"><Input label="Email" type="email" autoComplete="email" placeholder="nama@email.com" icon={<Mail />} error={errors.email?.message} {...register('email')} /></div>
          <Input label="Password" type="password" autoComplete="new-password" icon={<LockKeyhole />} error={errors.password?.message} {...register('password')} />
          <Input label="Konfirmasi password" type="password" autoComplete="new-password" icon={<LockKeyhole />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <div>
            <Input label="NIM (opsional)" inputMode="numeric" placeholder="8–20 digit" error={errors.nim?.message} {...register('nim')} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="program_studi">Program studi (opsional)</label>
            <select id="program_studi" className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${errors.program_studi ? 'border-rose-400' : 'border-slate-300'}`} {...register('program_studi')}>
              <option value="">Pilih program studi</option>
              {['Informatika', 'Sistem Informasi', 'Elektro', 'Mesin', 'Sipil', 'Arsitektur'].map((program) => <option key={program}>{program}</option>)}
            </select>
            {errors.program_studi && <p className="mt-1.5 text-sm text-rose-600">{errors.program_studi.message}</p>}
          </div>
          <div className="sm:col-span-2"><Input label="Angkatan (opsional)" type="number" min="1900" max="2100" placeholder="2024" error={errors.angkatan?.message} {...register('angkatan')} /></div>
          {errors.root && <p className="sm:col-span-2 text-sm text-rose-600" role="alert">{errors.root.message}</p>}
          <Button className="sm:col-span-2" size="lg" type="submit" loading={isSubmitting || mutation.isPending}>Daftar</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Sudah memiliki akun? <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/login">Masuk</Link>
        </p>
      </section>
    </main>
  );
}
