export interface ReservationModel {
  id: string;
  createdAt: string;

  clubName: string;
  courtName: string;
  time: string;
  total: number;

  status: 'CONFIRMED' | 'CANCELED';
}
