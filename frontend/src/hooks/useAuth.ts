import { useAuthContext } from "../providers/auth-provider";

export const useAuth = () => {
  return useAuthContext();
};
