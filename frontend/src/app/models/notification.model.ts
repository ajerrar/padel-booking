export type NotificationType =
  | 'INVITE_PRIVATE'
  | 'MATCH_JOINED'
  | 'MATCH_PAID'
  | 'MATCH_COMPLETE';

export interface NotificationModel {
  id: string;
  createdAt: string;
  read: boolean;

  type: NotificationType;

  title: string;
  message: string;

  matchId?: string;
  clubName?: string;
  date?: string;
  time?: string;

  userMatricule?: string;
  email?: string;
}
