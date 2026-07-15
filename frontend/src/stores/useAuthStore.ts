import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  roleId: number;
  roleName: string;
}

interface AuthState {
  user: User | null;
  permissions: string[];
  setUser: (user: User, permissions: string[]) => void;
  logout: () => void;
  hasPermission: (code: string) => boolean;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      setUser: (user, permissions) => set({ user, permissions }),
      logout: () => set({ user: null, permissions: [] }),
      hasPermission: (code) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (user.roleId === 1) return true;
        return permissions.includes(code);
      },
    }),
    { name: 'xhagentos_auth' },
  ),
);

export default useAuthStore;
