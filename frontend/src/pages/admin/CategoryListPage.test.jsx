import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CategoryListPage from './CategoryListPage';

const mutations = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  deletion: vi.fn()
}));

vi.mock('../../hooks/useAuth', () => ({
  default: () => ({ user: { role: 'admin_pka' } })
}));

vi.mock('../../hooks/useCompetitionCategories', () => ({
  default: () => ({
    data: [{ id: 7, name: 'Teknologi', description: 'Teknologi', competition_count: 0 }],
    isPending: false,
    isError: false
  }),
  useCreateCategory: () => ({ mutateAsync: mutations.create, isPending: false }),
  useUpdateCategory: () => ({ mutateAsync: mutations.update, isPending: false }),
  useDeleteCategory: () => ({ mutateAsync: mutations.deletion, isPending: false })
}));

describe('CategoryListPage save actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutations.create.mockResolvedValue({});
    mutations.update.mockResolvedValue({});
  });

  it('creates a category without sending an ID to the update mutation', async () => {
    render(<CategoryListPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Kategori' }));
    fireEvent.change(screen.getByLabelText('Nama kategori *'), { target: { value: 'GAMERS' } });
    fireEvent.change(screen.getByLabelText('Deskripsi'), { target: { value: 'Gaming' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => {
      expect(mutations.create).toHaveBeenCalledWith({ name: 'GAMERS', description: 'Gaming' });
    });
    expect(mutations.update).not.toHaveBeenCalled();
  });

  it('updates an existing category using its ID', async () => {
    render(<CategoryListPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Teknologi' }));
    fireEvent.change(screen.getByLabelText('Nama kategori *'), { target: { value: 'Komputasi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => {
      expect(mutations.update).toHaveBeenCalledWith({
        id: 7,
        data: { name: 'Komputasi', description: 'Teknologi' }
      });
    });
    expect(mutations.create).not.toHaveBeenCalled();
  });
});
