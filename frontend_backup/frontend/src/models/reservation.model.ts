export interface ReservationModel {
  id: number;
  clubId: number;
  courtId: number;
  date: Date;
  time: string;
  duration: number;
  userId: number;
  price: number;
}
