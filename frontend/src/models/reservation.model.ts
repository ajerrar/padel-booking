export interface ReservationModel {
  id: string;
  createdAt: string;

  userMatricule: string;

  clubName: string;
  courtName: string;

  // ex: "19:00 → 20:00"
  time: string;

  // ex: "2026-03-04"
  date?: string;

  // ex: "Waterloo"
  siteName?: string;

  total: number;

  status: 'CONFIRMED' | 'CANCELED';
}
