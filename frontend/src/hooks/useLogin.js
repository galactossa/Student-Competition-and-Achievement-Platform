import { useMutation } from '@tanstack/react-query';
import useAuth from './useAuth';

export default function useLogin() {
  const { login } = useAuth();
  return useMutation({ mutationFn: ({ email, password }) => login(email, password) });
}
