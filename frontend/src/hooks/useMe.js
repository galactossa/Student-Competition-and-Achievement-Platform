import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';

export default function useMe() {
  const { user, accessToken, refresh } = useAuth();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: refresh,
    enabled: Boolean(accessToken),
    initialData: user ? { user } : undefined,
    retry: false
  });
}
