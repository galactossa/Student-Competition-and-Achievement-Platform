import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/publicApi';

export function usePublicStats() {
  return useQuery({
    queryKey: ['publicStats'],
    queryFn: async () => (await publicApi.getPublicStats()).data.data
  });
}

export function useRecentAchievements(limit = 3) {
  return useQuery({
    queryKey: ['publicAchievements', limit],
    queryFn: async () => (await publicApi.listPublicAchievements({ limit })).data.data
  });
}
