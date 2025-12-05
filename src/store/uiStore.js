import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  openSidebar: () => set({ sidebarOpen: true }),

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

  // Notifications
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
}));
