export type MatchVisibility = 'PUBLIC' | 'PRIVATE';
export type ReservationStatus = 'CONFIRMED' | 'CANCELED';

export interface MatchPlayer {
  matricule: string;
  paid: boolean;
  joinedAt: string;
}

export interface ReservationModel {
  id: string;
  createdAt: string;

  organizerMatricule: string;

  clubName: string;
  courtName: string;
  siteName?: string;

  date: string;
  time: string;

  total: number;

  visibility: MatchVisibility;
  status: ReservationStatus;

  players: MatchPlayer[];

  invitedEmails?: string[];
  acceptedEmails?: string[];
}
