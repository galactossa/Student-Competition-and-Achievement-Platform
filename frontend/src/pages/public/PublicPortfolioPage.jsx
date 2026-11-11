import { Link, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function PublicPortfolioPage() {
  const { slug } = useParams();
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <Card className="text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Portofolio mahasiswa</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Segera Hadir</h1>
        <p className="mt-3 text-slate-600">Portofolio publik untuk <span className="font-semibold">{slug}</span> sedang disiapkan.</p>
        <Link to="/"><Button className="mt-6">Kembali ke Beranda</Button></Link>
      </Card>
    </div>
  );
}
