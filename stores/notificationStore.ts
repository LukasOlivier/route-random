import { create } from "zustand";

export type NotificationVariant = "info" | "success" | "error";

export interface AppNotification {
  id: string;
  message: string;
  variant: NotificationVariant;
  durationMs: number;
}

interface NotificationStore {
  notifications: AppNotification[];
  showNotification: (
    message: string,
    options?: { variant?: NotificationVariant; durationMs?: number },
  ) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const DEFAULT_DURATION_MS = 4500;

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  showNotification: (message, options) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const notification: AppNotification = {
      id,
      message,
      variant: options?.variant ?? "info",
      durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
    };

    set((state) => ({ notifications: [...state.notifications, notification] }));
  },
  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id,
      ),
    }));
  },
  clearNotifications: () => set({ notifications: [] }),
}));
