import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CompetitionForm from './CompetitionForm';

vi.mock('../../hooks/useCompetitionCategories', () => ({
  default: () => ({
    data: [{ id: 1, name: 'Teknologi' }],
    isPending: false,
    isError: false
  })
}));

describe('CompetitionForm', () => {
  it('shows required field errors when submitted empty', async () => {
    render(<CompetitionForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai Draft' }));
    await waitFor(() => {
      expect(screen.getByText('Nama minimal 3 karakter.')).toBeInTheDocument();
      expect(screen.getByText('Penyelenggara minimal 3 karakter.')).toBeInTheDocument();
      expect(screen.getByText('Pilih kategori kompetisi.')).toBeInTheDocument();
    });
  });

  it('calls submit with multipart data for valid required values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CompetitionForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nama kompetisi *'), { target: { value: 'Hackathon SCAP' } });
    fireEvent.change(screen.getByLabelText('Penyelenggara *'), { target: { value: 'SCAP Indonesia' } });
    fireEvent.change(screen.getByLabelText('Kategori *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Level *'), { target: { value: 'Nasional' } });
    fireEvent.change(screen.getByLabelText('Mode *'), { target: { value: 'online' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan sebagai Draft' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const data = onSubmit.mock.calls[0][0];
    expect(data).toBeInstanceOf(FormData);
    expect(data.get('name')).toBe('Hackathon SCAP');
    expect(data.get('category_id')).toBe('1');
  });
});
