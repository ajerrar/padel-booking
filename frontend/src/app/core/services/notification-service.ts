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

  // Methode list: recupere les donnees necessaires a cette fonctionnalite.
  list(): AppNotification[] {
    return this.notifications();
  }

  // Methode add: cree ou ajoute un element selon les regles metier.
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

  // Methode unreadCountForUser: gere unread count for user de ce bloc.
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

  // Methode listForUser: recupere les donnees necessaires a cette fonctionnalite.
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

  // Methode markAllAsReadForUser: gere mark all as read for user de ce bloc.
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

  // Methode remove: supprime ou reinitialise les donnees concernees.
  remove(id: string): void {
    const updatedNotifications = this.notifications().filter(
      notification => notification.id !== id
    );

    this.notifications.set(updatedNotifications);
    this.writeNotifications(updatedNotifications);
  }

  // Methode clearToast: supprime ou reinitialise les donnees concernees.
  clearToast(): void {
    this.toast.set(null);
  }

  // Methode showToast: gere show toast de ce bloc.
  private showToast(notification: AppNotification): void {
    this.toast.set(notification);

    if (this.toastTimeout) {
      // Methode clearTimeout: supprime ou reinitialise les donnees concernees.
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toast.set(null);
    }, 4000);
  }

  // Methode readNotifications: recupere les donnees necessaires a cette fonctionnalite.
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

  // Methode writeNotifications: met a jour les donnees et maintient la coherence de l etat.
  private writeNotifications(notifications: AppNotification[]): void {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }

  // Methode normalizeEmail: normalise l email (trim + minuscule) pour des comparaisons fiables.
  private normalizeEmail(value?: string): string {
    return String(value || '').trim().toLowerCase();
  }

  // Methode normalizeMatricule: normalise le matricule (trim) pour eviter les ecarts de saisie.
  private normalizeMatricule(value?: string): string {
    return String(value || '').trim();
  }

  // Methode generateId: construit la valeur attendue a partir des donnees disponibles.
  private generateId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}
