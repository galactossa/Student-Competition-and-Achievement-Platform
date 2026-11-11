import { useState } from 'react';
import { Award, CalendarDays, ClipboardList, Compass, LayoutDashboard, Send, Users } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const items = [
  { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Jelajahi Kompetisi', to: '/competitions', icon: Compass },
  { label: 'Pendaftaran Saya', to: '/student/registrations', icon: ClipboardList },
  { label: 'Tim Saya', icon: Users, disabled: true },
  { label: 'Pengumpulan Saya', icon: Send, disabled: true },
  { label: 'Prestasi Saya', icon: Award, disabled: true },
  { label: 'Portofolio Saya', icon: Award, disabled: true },
  { label: 'Kalender', icon: CalendarDays, disabled: true }
];

export default function StudentLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar items={items} open={menuOpen} onClose={() => setMenuOpen(false)} title="Mahasiswa" />
      <div className="md:pl-64">
        <Navbar onMenuClick={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-7xl p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
