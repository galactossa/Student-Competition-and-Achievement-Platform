import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import useAuth from '../../hooks/useAuth';
import useLogin from '../../hooks/useLogin';
import { APP_NAME } from '../../utils/constants';

const schema = z.object({
  email: z.string().trim().email('Masukkan alamat email yang valid.'),
  password: z.string().min(8, 'Password minimal 8 karakter.')
});

export function dashboardForRole(role) {
  return role === 'mahasiswa' ? '/student/dashboard' : '/admin/dashboard';
}

export function safeRedirectPath(candidate) {
  return candidate?.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\\')
    ? candidate
    : null;
}

function showApiErrors(error, setError) {
  const response = error.response?.data;
  const fieldErrors = response?.errors || [];
  fieldErrors.forEach(({ field, message }) => {
    if (['email', 'password'].includes(field)) setError(field, { type: 'server', message });
  });
  const message = response?.message || 'Login gagal. Periksa kembali data Anda.';
  toast.error(message);
  if (!fieldErrors.length) setError('root', { type: 'server', message });
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = safeRedirectPath(new URLSearchParams(location.search).get('redirect'));
  const mutation = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  if (loading) return <Spinner fullScreen />;
  if (user) return <Navigate to={redirect || dashboardForRole(user.role)} replace />;

  async function onSubmit(values) {
    try {
      const loggedInUser = await mutation.mutateAsync(values);
      toast.success('Berhasil masuk.');
      const stateDestination = safeRedirectPath(location.state?.from?.pathname);
      navigate(redirect || stateDestination || dashboardForRole(loggedInUser.role), { replace: true });
    } catch (error) {
      showApiErrors(error, setError);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 sm:p-9">
        <p className="text-sm font-bold text-indigo-600">{APP_NAME}</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Masuk ke akun</h1>
        <p className="mt-2 text-sm text-slate-600">Masuk ke {APP_NAME} untuk melanjutkan.</p>
        <form className="mt-7 space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          <Input label="Email" type="email" autoComplete="email" placeholder="nama@email.com" icon={<Mail />} error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" autoComplete="current-password" placeholder="Minimal 8 karakter" icon={<LockKeyhole />} error={errors.password?.message} {...register('password')} />
          {errors.root && <p role="alert" className="text-sm text-rose-600">{errors.root.message}</p>}
          <Button className="w-full" size="lg" type="submit" loading={isSubmitting || mutation.isPending}>Masuk</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Belum memiliki akun? <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/register">Daftar sekarang</Link>
        </p>
      </section>
    </main>
  );
}
