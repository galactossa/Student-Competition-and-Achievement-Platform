import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CountdownBadge from './CountdownBadge';
import { getMediaUrl } from '../../utils/mediaUrl';

function formatPrice(price) {
  return Number(price || 0) === 0
    ? 'Gratis'
    : `Rp ${Number(price).toLocaleString('id-ID')}`;
}

export default function CompetitionCard({ competition }) {
  const [posterFailed, setPosterFailed] = useState(false);
  const posterUrl = getMediaUrl(competition.poster_url);

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden p-0 transition-shadow hover:shadow-md">
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {posterUrl && !posterFailed
          ? <img
            src={posterUrl}
            alt={`Poster ${competition.name}`}
            onError={() => setPosterFailed(true)}
            className="h-full w-full object-cover"
          />
          : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-100 via-slate-100 to-violet-100 text-indigo-400" role="img" aria-label="Poster tidak tersedia">
            <ImageOff aria-hidden="true" size={30} />
            <span className="text-xs font-medium">Poster kompetisi</span>
          </div>}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-indigo-800 shadow-sm">{competition.level}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-slate-500">{competition.category?.name || competition.category_name || 'Tanpa kategori'}</p>
        <h2 className="mt-1 line-clamp-2 min-h-12 text-base font-bold text-slate-900 md:text-lg">{competition.name}</h2>
        <p className="mt-1 line-clamp-1 text-sm text-slate-600">{competition.organizer}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{formatPrice(competition.price)}</span>
          <CountdownBadge deadline={competition.registration_deadline} />
        </div>
        <Link className="mt-4 block" to={`/competitions/${encodeURIComponent(competition.slug)}`}>
          <Button className="w-full py-2 text-sm" size="sm" variant="secondary">Lihat Detail</Button>
        </Link>
      </div>
    </Card>
  );
}
