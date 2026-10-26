import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const getPlatformBaseURL = () => {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  return `${base}/platform`;
};

export const usePlatformAuthStore = create(
  persist(
    (set, get) => ({
      platformUser: null,
      platformToken: null,
      platformRefreshToken: null,
      isPlatformAuthenticated: false,
      role: null,
      loading: false,
      error: null,

      setAuth: ({ user, token, refreshToken }) => {
        set({
          platformUser: user,
          platformToken: token,
          platformRefreshToken: refreshToken,
          role: user?.role || null,
          isPlatformAuthenticated: true,
          error: null
        });
      },

      setTokens: ({ token, refreshToken, user }) => {
        set((state) => ({
          platformToken: token,
          platformRefreshToken: refreshToken !== undefined ? refreshToken : state.platformRefreshToken,
          platformUser: user ? { ...state.platformUser, ...user } : state.platformUser,
          role: user?.role || state.role,
          isPlatformAuthenticated: true
        }));
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${getPlatformBaseURL()}/auth/login`, {
            email,
            password
          });
          const { user, staffUser, token, refreshToken } = response.data;
          const activeUser = staffUser || user;
          get().setAuth({ user: activeUser, token, refreshToken });
          set({ loading: false });
          return response.data;
        } catch (err) {
          const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Platform login failed';
          set({ error: message, loading: false });
          throw err;
        }
      },

      refreshAuth: async () => {
        const { platformRefreshToken, setTokens, logout } = get();
        if (!platformRefreshToken) {
          logout();
          throw new Error('No platform refresh token available');
        }
        try {
          const response = await axios.post(`${getPlatformBaseURL()}/auth/refresh`, {
            refreshToken: platformRefreshToken
          });
          const { token: newToken, refreshToken: newRefreshToken, user, staffUser } = response.data;
          const activeUser = staffUser || user;
          setTokens({ token: newToken, refreshToken: newRefreshToken, user: activeUser });
          return response.data;
        } catch (error) {
          logout();
          throw error;
        }
      },

      logout: async () => {
        const { platformToken } = get();
        try {
          if (platformToken) {
            await axios.post(
              `${getPlatformBaseURL()}/auth/logout`,
              {},
              { headers: { Authorization: `Bearer ${platformToken}` } }
            );
          }
        } catch (err) {
          // Best-effort logout; ignore network/auth errors during clearing
        } finally {
          set({
            platformUser: null,
            platformToken: null,
            platformRefreshToken: null,
            isPlatformAuthenticated: false,
            role: null,
            error: null,
            loading: false
          });
        }
      },

      updateUser: (userData) => {
        set({
          platformUser: { ...get().platformUser, ...userData },
          role: userData?.role || get().role
        });
      },

      hasRole: (...roles) => {
        const { role } = get();
        if (!role) return false;
        if (role === 'owner') return true; // Owner has all permissions
        return roles.includes(role);
      }
    }),
    {
      name: 'platform-auth-storage',
      partialize: (state) => ({
        platformUser: state.platformUser,
        platformToken: state.platformToken,
        platformRefreshToken: state.platformRefreshToken,
        isPlatformAuthenticated: state.isPlatformAuthenticated,
        role: state.role
      })
    }
  )
);

export default usePlatformAuthStore;
