import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../contexts/AuthContext';
import LoginPage from './LoginPage';

function renderLogin({ initialEntries = ['/login'], login = vi.fn() } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthContext.Provider value={{ user: null, student: null, accessToken: null, loading: false, login, register: vi.fn(), logout: vi.fn(), refresh: vi.fn() }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/competitions/:slug" element={<p>Detail kompetisi</p>} />
            <Route path="/student/dashboard" element={<p>Dashboard mahasiswa</p>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('LoginPage', () => {
  it('renders email and password form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: 'Masuk ke akun' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows validation errors when submitted empty', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    await waitFor(() => {
      expect(screen.getByText('Masukkan alamat email yang valid.')).toBeInTheDocument();
      expect(screen.getByText('Password minimal 8 karakter.')).toBeInTheDocument();
    });
  });

  it('returns to the requested public competition after login', async () => {
    const login = vi.fn().mockResolvedValue({ role: 'mahasiswa' });
    renderLogin({ initialEntries: ['/login?redirect=%2Fcompetitions%2Fhackathon'], login });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'student@scap.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => expect(screen.getByText('Detail kompetisi')).toBeInTheDocument());
    expect(login).toHaveBeenCalledWith('student@scap.test', 'Password123!');
  });
});
