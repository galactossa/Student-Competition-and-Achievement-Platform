import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../contexts/AuthContext';
import RegisterPage from './RegisterPage';

function renderRegister(register) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/register?redirect=%2Fcompetitions%2Fhackathon']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthContext.Provider value={{ user: null, student: null, accessToken: null, loading: false, login: vi.fn(), register, logout: vi.fn(), refresh: vi.fn() }}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/competitions/:slug" element={<p>Detail kompetisi</p>} />
            <Route path="/student/dashboard" element={<p>Dashboard mahasiswa</p>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RegisterPage redirect', () => {
  it('returns to the requested public competition after registration', async () => {
    const register = vi.fn().mockResolvedValue({ role: 'mahasiswa' });
    renderRegister(register);
    fireEvent.change(screen.getByLabelText('Nama lengkap'), { target: { value: 'Mahasiswa SCAP' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'student@scap.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Konfirmasi password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Daftar' }));

    await waitFor(() => expect(screen.getByText('Detail kompetisi')).toBeInTheDocument());
    expect(register).toHaveBeenCalledWith(
      {
        name: 'Mahasiswa SCAP',
        email: 'student@scap.test',
        password: 'Password123!'
      },
      expect.any(Object)
    );
  });
});
