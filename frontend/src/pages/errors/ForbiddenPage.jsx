import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">403</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Akses tidak diizinkan</h1>
        <p className="mt-3 text-slate-600">Peran akun Anda tidak memiliki izin untuk membuka halaman ini.</p>
        <Link className="mt-6 inline-flex" to="/"><Button>Kembali ke dashboard</Button></Link>
      </section>
    </main>
  );
}
