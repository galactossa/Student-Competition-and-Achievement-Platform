import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Download, ImageOff } from 'lucide-react';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { usePublicAchievement } from '../../hooks/UsePublicAchievement';
import { getMediaUrl } from '../../utils/mediaUrl';
import { formatDate } from '../../utils/formatDate';

function InfoItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export default function AchievementDetailPage() {
  const { id } = useParams();
  const { data: a, isPending, isError } = usePublicAchievement(id);
  const [posterFailed, setPosterFailed] = useState(false);

  if (isPending) {
    return <div className="py-24"><Spinner label="Memuat detail prestasi..." /></div>;
  }

  if (isError || !a) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Link to="/achievements" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline">
          <ArrowLeft size={16} /> Kembali ke prestasi
        </Link>
        <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          Prestasi tidak ditemukan atau gagal dimuat.
        </p>
      </div>
    );
  }

  const title = [a.result_title, a.competition_name].filter(Boolean).join(' ') || 'Prestasi terverifikasi';
  const posterSrc = a.poster_url && !posterFailed ? getMediaUrl(a.poster_url) : null;

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <section className="bg-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-indigo-100">
            <Link to="/achievements" className="hover:underline">Prestasi</Link>
            <ChevronRight size={15} aria-hidden="true" />
            <span className="text-white">{a.student_name || 'Mahasiswa'}</span>
          </nav>
          <h1 className="mt-8 max-w-4xl text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-3 text-indigo-100">
            {a.student_name || 'Mahasiswa'}{a.program_studi ? ` · ${a.program_studi}` : ''}
          </p>
        </div>
      </section>

      {/* Konten */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8 lg:py-14">
        <Card className="min-w-0 p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-900">Deskripsi</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 md:text-base">
            {a.description || 'Belum ada deskripsi untuk prestasi ini.'}
          </p>

          <div className="mt-8 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <InfoItem label="Mahasiswa" value={a.student_name} />
            <InfoItem label="Program studi" value={a.program_studi} />
            <InfoItem label="Kompetisi" value={a.competition_name} />
            <InfoItem label="Level" value={a.level} />
            <InfoItem label="Penyelenggara" value={a.organizer} />
            <InfoItem label="Tanggal" value={a.date ? formatDate(a.date) : ''} />
          </div>
        </Card>

        <aside className="lg:self-start">
          <Card className="p-4">
            {posterSrc ? (
              <img
                src={posterSrc}
                onError={() => setPosterFailed(true)}
                alt={`Poster prestasi ${a.student_name || ''}`}
                className="aspect-[3/4] w-full rounded-xl bg-slate-100 object-cover"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-400">
                <ImageOff size={36} />
                <span className="text-sm font-medium">Poster belum tersedia</span>
              </div>
            )}

            <p className="mt-4 text-sm font-semibold text-slate-700">Sertifikat</p>
            {a.certificate_url ? (
              <a
                href={getMediaUrl(a.certificate_url)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-200"
              >
                Link Sertifikat <Download size={16} />
              </a>
            ) : (
              <span className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm text-slate-400">
                Sertifikat belum tersedia
              </span>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}