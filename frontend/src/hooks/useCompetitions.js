import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { competitionApi, getApiErrorMessage } from '../api/competitionApi';

export function useCompetitions(params = {}) {
  return useQuery({
    queryKey: ['competitions', params],
    queryFn: async () => (await competitionApi.list(params)).data,
    placeholderData: keepPreviousData
  });
}

export function useCompetitionStats() {
  return useQuery({
    queryKey: ['competitionStats'],
    queryFn: async () => (await competitionApi.stats()).data.data
  });
}

export function useCompetition(id) {
  return useQuery({
    queryKey: ['competition', id],
    queryFn: async () => (await competitionApi.getById(id)).data.data,
    enabled: Boolean(id)
  });
}

export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: competitionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competitionStats'] });
      toast.success('Kompetisi berhasil dibuat.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Kompetisi gagal dibuat.'))
  });
}

export function useUpdateCompetition(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => competitionApi.update(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competition', id] });
      queryClient.invalidateQueries({ queryKey: ['competitionStats'] });
      toast.success('Kompetisi berhasil diperbarui.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Kompetisi gagal diperbarui.'))
  });
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: competitionApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competitionStats'] });
      toast.success('Kompetisi berhasil dihapus.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Kompetisi gagal dihapus.'))
  });
}

export function useChangeCompetitionStatus(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status) => competitionApi.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', id] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competitionStats'] });
      toast.success('Status kompetisi berhasil diperbarui.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Status kompetisi gagal diperbarui.'))
  });
}
