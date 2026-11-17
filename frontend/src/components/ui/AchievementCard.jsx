import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import Card from './Card';
import { getMediaUrl } from '../../utils/mediaUrl';
import { formatDate } from '../../utils/formatDate';

export default function AchievementCard({ achievement }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  return (
    <Link
      to={`/achievements/${achievement.id}`}
      className="block h-full rounded-2xl transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <Card className="flex h-full min-w-0 flex-col items-center text-center">
        {achievement.photo_url && !photoFailed
          ? <img onError={() => setPhotoFailed(true)} src={getMediaUrl(achievement.photo_url)} alt="" className="h-20 w-20 rounded-full bg-slate-100 object-cover" />
          : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><GraduationCap size={30} /></div>}
        <h3 className="mt-4 font-bold text-slate-900">{achievement.student_name || 'Mahasiswa'}</h3>
        <p className="mt-1 text-sm text-slate-500">{achievement.program_studi || 'Mahasiswa'}</p>
        <p className="mt-4 line-clamp-2 text-sm font-medium text-slate-700">{achievement.result_title || 'Prestasi terverifikasi'}</p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{achievement.competition_name || 'Kompetisi'}{achievement.level ? ` · ${achievement.level}` : ''}</p>
        <span className="mt-auto pt-4 text-xs text-slate-400">{formatDate(achievement.date)}</span>
      </Card>
    </Link>
  );
}