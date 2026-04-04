import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),
      openSidebar: () => set({ sidebarOpen: true }),

      // Theme
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),

      // Modals
      modals: {},
      openModal: (modalId, data = null) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: { open: true, data } }
        })),
      closeModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: { open: false, data: null } }
        })),
      isModalOpen: (modalId) => {
        const { modals } = useUIStore.getState();
        return modals[modalId]?.open || false;
      },
      getModalData: (modalId) => {
        const { modals } = useUIStore.getState();
        return modals[modalId]?.data || null;
      },

      // Toast Notifications
      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id: Date.now() + Math.random(), type: 'info', duration: 5000, ...toast }
          ]
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        })),
      clearToasts: () => set({ toasts: [] }),

      // Notifications (deprecated, use toasts instead)
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { id: Date.now(), ...notification }
          ]
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        })),
      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'ui-store',
      partialPersist: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme
      })
    }
  )
);
