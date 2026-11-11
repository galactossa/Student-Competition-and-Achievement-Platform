import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { APP_NAME_SHORT } from '../../utils/constants';

export default function Sidebar({ items, open, onClose, title }) {
  return (
    <>
      {open && <button aria-label="Tutup menu" className="fixed inset-0 z-30 bg-slate-950/40 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="font-bold tracking-wide text-indigo-700">{APP_NAME_SHORT} <span className="font-normal text-slate-500">{title}</span></div>
          <button className="rounded p-1 text-slate-500 md:hidden" aria-label="Tutup menu" onClick={onClose}><X size={20} /></button>
        </div>
        <nav className="space-y-1 p-3" aria-label="Navigasi utama">
          {items.map(({ label, to, icon: Icon, disabled }) => (
            disabled
              ? <div key={label} aria-disabled="true" title="Segera hadir" className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400"><Icon size={18} /><span>{label}</span><span className="ml-auto text-[10px]">Segera</span></div>
              : <NavLink key={label} to={to} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={18} /><span>{label}</span></NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
