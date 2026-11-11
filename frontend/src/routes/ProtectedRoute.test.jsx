import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects guests to login', async () => {
    render(
      <MemoryRouter initialEntries={['/student/dashboard']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthContext.Provider value={{ user: null, loading: false }}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/student/dashboard" element={<p>Dashboard rahasia</p>} />
            </Route>
            <Route path="/login" element={<p>Halaman login</p>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(await screen.findByText('Halaman login')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard rahasia')).not.toBeInTheDocument();
  });
});
