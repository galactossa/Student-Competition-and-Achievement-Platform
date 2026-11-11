import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders status text and its matching style', () => {
    render(<StatusBadge status="registration_open" />);
    const badge = screen.getByText('Pendaftaran Dibuka');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });
});
