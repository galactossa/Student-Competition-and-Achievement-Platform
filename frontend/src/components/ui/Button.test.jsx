import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders and responds to clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Simpan</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
