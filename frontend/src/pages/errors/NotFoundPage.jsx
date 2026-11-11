import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-slate-600">Halaman yang Anda cari tidak tersedia.</p>
        <Link className="mt-6 inline-flex" to="/"><Button>Kembali ke beranda</Button></Link>
      </section>
    </main>
  );
}
