import { useMutation } from '@tanstack/react-query';
import useAuth from './useAuth';

export default function useRegister() {
  const { register } = useAuth();
  return useMutation({ mutationFn: register });
}
