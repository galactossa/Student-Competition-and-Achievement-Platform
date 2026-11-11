import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Input from './Input';

describe('Input', () => {
  it('renders an inline error message', () => {
    render(<Input label="Email" name="email" error="Email tidak valid." />);
    expect(screen.getByText('Email tidak valid.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});
