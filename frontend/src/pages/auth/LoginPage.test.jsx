import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LoginPage from './LoginPage.jsx';

describe('LoginPage', () => {
  it('renders the login placeholder', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Masuk ke akun' })).toBeInTheDocument();
    expect(screen.getByText('Halaman login akan segera tersedia.')).toBeInTheDocument();
  });
});
