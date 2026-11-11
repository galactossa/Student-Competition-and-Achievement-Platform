import { Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import PublicLayout from '../components/layout/PublicLayout';
import StudentLayout from '../components/layout/StudentLayout';
import AdminDashboardPage from '../pages/admin/DashboardPage';
import CompetitionListPage from '../pages/admin/CompetitionListPage';
import CompetitionCreatePage from '../pages/admin/CompetitionCreatePage';
import CompetitionEditPage from '../pages/admin/CompetitionEditPage';
import AdminCompetitionDetailPage from '../pages/admin/CompetitionDetailPage';
import CategoryListPage from '../pages/admin/CategoryListPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import StudentDashboardPage from '../pages/student/DashboardPage';
import ExploreCompetitionPage from '../pages/student/ExploreCompetitionPage';
import StudentCompetitionDetailPage from '../pages/student/CompetitionDetailPage';
import LandingPage from '../pages/public/LandingPage';
import PublicPortfolioPage from '../pages/public/PublicPortfolioPage';
import StudentRegistrationsPage from '../pages/student/RegistrationsPage';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/competitions" element={<ExploreCompetitionPage />} />
        <Route path="/competitions/:slug" element={<StudentCompetitionDetailPage />} />
        <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['mahasiswa']} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="registrations" element={<StudentRegistrationsPage />} />
          </Route>
        </Route>
        <Route element={<RoleRoute allowedRoles={['admin_pka', 'super_admin', 'verifier', 'pimpinan', 'prodi']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route element={<RoleRoute allowedRoles={['admin_pka', 'super_admin']} />}>
              <Route path="competitions" element={<CompetitionListPage />} />
              <Route path="competitions/create" element={<CompetitionCreatePage />} />
              <Route path="competitions/:id" element={<AdminCompetitionDetailPage />} />
              <Route path="competitions/:id/edit" element={<CompetitionEditPage />} />
              <Route path="categories" element={<CategoryListPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
