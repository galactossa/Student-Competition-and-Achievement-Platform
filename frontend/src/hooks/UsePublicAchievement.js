import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/publicApi';

export function usePublicAchievement(id) {
  return useQuery({
    queryKey: ['publicAchievement', id],
    queryFn: async () => (await publicApi.getPublicAchievement(id)).data.data,
    enabled: Boolean(id),
    retry: false,
  });
}