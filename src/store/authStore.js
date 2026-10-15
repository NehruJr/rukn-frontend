import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      organization: null,
      isAuthenticated: false,

      setAuth: ({ user, token, refreshToken, organization }) => {
        set({
          user,
          token,
          refreshToken,
          organization: organization || user?.organization || null,
          isAuthenticated: true
        });
      },

      setTokens: ({ token, refreshToken, user }) => {
        set((state) => ({
          token,
          refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
          user: user ? { ...state.user, ...user } : state.user,
          organization: (user?.organization || state.organization),
          isAuthenticated: true
        }));
      },

      setOrganization: (organization) => {
        set({ organization });
      },

      refreshAuth: async () => {
        const { refreshToken, setTokens, logout } = get();
        if (!refreshToken) {
          logout();
          throw new Error('No refresh token available');
        }
        try {
          const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
          const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          const { token: newToken, refreshToken: newRefreshToken, user } = response.data;
          setTokens({ token: newToken, refreshToken: newRefreshToken, user });
          return response.data;
        } catch (error) {
          logout();
          throw error;
        }
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          organization: null,
          isAuthenticated: false
        });
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.permissions?.includes(permission) || false;
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
