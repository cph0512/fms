import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth.api';

interface User {
  user_id: string;
  username: string;
  email: string;
  display_name: string;
  status: string;
}

interface Company {
  company_id: string;
  company_name: string;
  short_name: string | null;
  tax_id: string | null;
  default_currency: string;
  tax_rate: number;
  status: string;
  is_default?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  currentCompany: Company | null;
  companies: Company[];
  permissions: string[];
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setCompanyData: (company: Company, accessToken: string, permissions: string[]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      currentCompany: null,
      companies: [],
      permissions: [],
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const res = await authApi.login({ username, password });
        const { user, accessToken, refreshToken, company, companies, permissions } = res.data.data;
        set({
          user,
          accessToken,
          refreshToken,
          currentCompany: company,
          companies,
          permissions,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          if (get().accessToken) {
            await authApi.logout();
          }
        } catch { /* ignore */ }
        get().clearAuth();
      },

      setCompanyData: (company, accessToken, permissions) => {
        set({ currentCompany: company, accessToken, permissions });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          currentCompany: null,
          companies: [],
          permissions: [],
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'fms-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        currentCompany: state.currentCompany,
        companies: state.companies,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
