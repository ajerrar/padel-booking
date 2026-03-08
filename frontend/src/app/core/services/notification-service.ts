import { Injectable, signal } from '@angular/core';

export type NotificationType =
  | 'INVITE_PRIVATE'
  | 'MATCH_JOINED'
  | 'MATCH_PAID'
  | 'MATCH_COMPLETE'
  | 'INFO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  matchId?: string;
  clubName?: string;
  date?: string;
  time?: string;
  email?: string;
  userMatricule?: string;
  createdAt: string;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'pb_notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastTimeout: any = null;

  notifications = signal<AppNotification[]>(this.readNotifications());
  toast = signal<AppNotification | null>(null);

  list(): AppNotification[] {
    return this.notifications();
  }

  add(data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): void {
    const notification: AppNotification = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    const updatedNotifications = [notification, ...this.notifications()];
    this.notifications.set(updatedNotifications);
    this.writeNotifications(updatedNotifications);

    this.showToast(notification);
  }

  unreadCountForUser(email?: string, matricule?: string): number {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedMatricule = this.normalizeMatricule(matricule);

    return this.notifications().filter(notification => {
      if (notification.read) return false;

      const matchesEmail =
        !!normalizedEmail &&
        this.normalizeEmail(notification.email) === normalizedEmail;

      const matchesMatricule =
        !!normalizedMatricule &&
        this.normalizeMatricule(notification.userMatricule) === normalizedMatricule;

      return matchesEmail || matchesMatricule;
    }).length;
  }

  listForUser(email?: string, matricule?: string): AppNotification[] {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedMatricule = this.normalizeMatricule(matricule);

    return this.notifications().filter(notification => {
      const matchesEmail =
        !!normalizedEmail &&
        this.normalizeEmail(notification.email) === normalizedEmail;

      const matchesMatricule =
        !!normalizedMatricule &&
        this.normalizeMatricule(notification.userMatricule) === normalizedMatricule;

      return matchesEmail || matchesMatricule;
    });
  }

  markAllAsReadForUser(email?: string, matricule?: string): void {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedMatricule = this.normalizeMatricule(matricule);

    const updatedNotifications = this.notifications().map(notification => {
      const matchesEmail =
        !!normalizedEmail &&
        this.normalizeEmail(notification.email) === normalizedEmail;

      const matchesMatricule =
        !!normalizedMatricule &&
        this.normalizeMatricule(notification.userMatricule) === normalizedMatricule;

      if (matchesEmail || matchesMatricule) {
        return { ...notification, read: true };
      }

      return notification;
    });

    this.notifications.set(updatedNotifications);
    this.writeNotifications(updatedNotifications);
  }

  remove(id: string): void {
    const updatedNotifications = this.notifications().filter(
      notification => notification.id !== id
    );

    this.notifications.set(updatedNotifications);
    this.writeNotifications(updatedNotifications);
  }

  clearToast(): void {
    this.toast.set(null);
  }

  private showToast(notification: AppNotification): void {
    this.toast.set(notification);

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toast.set(null);
    }, 4000);
  }

  private readNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: any) => ({
        id: String(item?.id ?? ''),
        type: String(item?.type ?? 'INFO') as NotificationType,
        title: String(item?.title ?? ''),
        message: String(item?.message ?? ''),
        matchId: item?.matchId ? String(item.matchId) : undefined,
        clubName: item?.clubName ? String(item.clubName) : undefined,
        date: item?.date ? String(item.date) : undefined,
        time: item?.time ? String(item.time) : undefined,
        email: item?.email ? this.normalizeEmail(item.email) : undefined,
        userMatricule: item?.userMatricule ? String(item.userMatricule) : undefined,
        createdAt: String(item?.createdAt ?? new Date().toISOString()),
        read: !!item?.read,
      }));
    } catch {
      return [];
    }
  }

  private writeNotifications(notifications: AppNotification[]): void {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }

  private normalizeEmail(value?: string): string {
    return String(value || '').trim().toLowerCase();
  }

  private normalizeMatricule(value?: string): string {
    return String(value || '').trim();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}
