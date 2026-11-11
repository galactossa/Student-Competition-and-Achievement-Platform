import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { competitionApi, getApiErrorMessage } from '../api/competitionApi';

export default function useCompetitionCategories() {
  return useQuery({
    queryKey: ['competitionCategories'],
    queryFn: async () => (await competitionApi.listCategories()).data.data
  });
}

function useCategoryMutation(mutationFn, successMessage) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitionCategories'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success(successMessage);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Kategori gagal disimpan.'))
  });
}

export function useCreateCategory() {
  return useCategoryMutation(competitionApi.createCategory, 'Kategori berhasil dibuat.');
}

export function useUpdateCategory() {
  return useCategoryMutation(({ id, data }) => competitionApi.updateCategory(id, data), 'Kategori berhasil diperbarui.');
}

export function useDeleteCategory() {
  return useCategoryMutation(competitionApi.deleteCategory, 'Kategori berhasil dihapus.');
}
