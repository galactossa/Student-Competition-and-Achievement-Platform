import { useState } from 'react';
import { BarChart3, ClipboardCheck, FileCheck2, FolderKanban, LayoutDashboard, ScrollText, Tags, Users, UserRoundCog } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const fullItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Kompetisi', to: '/admin/competitions', icon: FolderKanban },
  { label: 'Kategori', to: '/admin/categories', icon: Tags },
  { label: 'Persetujuan Tim', icon: Users, disabled: true },
  { label: 'Mentor', icon: UserRoundCog, disabled: true },
  { label: 'Pengumpulan', icon: ClipboardCheck, disabled: true },
  { label: 'Verifikasi Prestasi', icon: FileCheck2, disabled: true },
  { label: 'Analitik', icon: BarChart3, disabled: true },
  { label: 'Log Audit', icon: ScrollText, disabled: true }
];
const readOnlyItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Analitik', icon: BarChart3, disabled: true }
];

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const isReadOnly = !['admin_pka', 'super_admin'].includes(user?.role);
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar items={isReadOnly ? readOnlyItems : fullItems} open={menuOpen} onClose={() => setMenuOpen(false)} title="Administrasi" />
      <div className="md:pl-64">
        <Navbar onMenuClick={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-7xl p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
