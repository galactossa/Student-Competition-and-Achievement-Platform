import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../contexts/AuthContext';
import RoleRoute from './RoleRoute';

describe('RoleRoute', () => {
  it('redirects a user without an allowed role to 403', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthContext.Provider value={{ user: { role: 'mahasiswa' } }}>
          <Routes>
            <Route element={<RoleRoute allowedRoles={['admin_pka', 'super_admin']} />}>
              <Route path="/admin/dashboard" element={<p>Dashboard admin</p>} />
            </Route>
            <Route path="/403" element={<p>Akses ditolak</p>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(await screen.findByText('Akses ditolak')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard admin')).not.toBeInTheDocument();
  });
});
