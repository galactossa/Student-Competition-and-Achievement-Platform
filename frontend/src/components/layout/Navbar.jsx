import { useState } from 'react';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { APP_NAME_SHORT } from '../../utils/constants';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      toast.error('Sesi lokal diakhiri, tetapi server tidak mengonfirmasi logout.');
    } finally {
      setConfirmLogout(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Buka menu" onClick={onMenuClick}><Menu size={20} /></button>
          <span className="font-bold text-indigo-700 md:hidden">{APP_NAME_SHORT}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              aria-expanded={profileMenuOpen}
              aria-label="Menu akun"
              className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-slate-50"
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{user?.name?.slice(0, 1).toUpperCase()}</span>
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-semibold text-slate-800">{user?.name}</span>
                <Badge role={user?.role} />
              </span>
              <ChevronDown className="hidden text-slate-500 sm:block" size={16} />
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <button disabled className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-400 disabled:cursor-not-allowed"><UserRound size={16} /> Profil (segera hadir)</button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50" onClick={() => { setProfileMenuOpen(false); setConfirmLogout(true); }}><LogOut size={16} /> Keluar</button>
              </div>
            )}
          </div>
        </div>
      </header>
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
          <section aria-labelledby="logout-title" aria-modal="true" className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" role="dialog">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600"><UserRound size={20} /></div>
            <h2 id="logout-title" className="text-lg font-bold">Keluar dari {APP_NAME_SHORT}?</h2>
            <p className="mt-2 text-sm text-slate-600">Sesi Anda akan diakhiri.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmLogout(false)}>Batal</Button>
              <Button variant="danger" onClick={handleLogout}>Ya, keluar</Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
