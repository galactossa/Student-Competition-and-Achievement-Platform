import { ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../ui/Button';
import { APP_NAME, APP_NAME_SHORT } from '../../utils/constants';

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Explore Competitions', to: '/competitions' },
  { label: 'Achievements', to: '/#achievements' }
];

function dashboardPath(role) {
  return role === 'mahasiswa' ? '/student/dashboard' : '/admin/dashboard';
}

export default function PublicLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!location.hash) return;
    window.requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label={APP_NAME} className="shrink-0 text-xl font-extrabold tracking-tight text-indigo-700">
            <span className="hidden 2xl:inline">{APP_NAME}</span>
            <span className="2xl:hidden">{APP_NAME_SHORT}</span>
          </Link>
          <nav aria-label="Navigasi publik" className="hidden items-center gap-4 md:flex lg:gap-6">
            {publicLinks.map(({ label, to }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `text-sm font-medium transition hover:text-indigo-700 ${isActive && to !== '/#achievements' ? 'text-indigo-700' : 'text-slate-600'}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {loading ? null : user ? (
              <Link to={dashboardPath(user.role)}>
                <Button size="sm">Ke Dashboard <ArrowRight size={16} /></Button>
              </Link>
            ) : (
              <>
                <Link to="/login"><Button size="sm" variant="secondary">Masuk</Button></Link>
                <Link to="/register"><Button size="sm">Daftar</Button></Link>
              </>
            )}
          </div>
          <button type="button" aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
            <nav aria-label="Navigasi publik mobile" className="mx-auto flex max-w-7xl flex-col gap-3">
              {publicLinks.map(({ label, to }) => (
                <Link key={label} to={to} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{label}</Link>
              ))}
              {!loading && (user
                ? <Link to={dashboardPath(user.role)} onClick={() => setMenuOpen(false)}><Button className="w-full" size="sm">Ke Dashboard</Button></Link>
                : <div className="grid grid-cols-2 gap-2"><Link to="/login" onClick={() => setMenuOpen(false)}><Button className="w-full" size="sm" variant="secondary">Masuk</Button></Link><Link to="/register" onClick={() => setMenuOpen(false)}><Button className="w-full" size="sm">Daftar</Button></Link></div>)}
            </nav>
          </div>
        )}
      </header>

      <main className="min-h-[calc(100vh-9rem)]">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex gap-5"><a href="#about" className="hover:text-indigo-700">Tentang</a><a href="mailto:info@scap.test" className="hover:text-indigo-700">Kontak</a></div>
        </div>
      </footer>
    </div>
  );
}
