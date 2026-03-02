export interface CourtListModel {
  id: number;
  name: string;
  status: 'libre' | 'complet';
  type: 'indoor' | 'outdoor';
  availableTimes: boolean;
}

export  interface CourtDetailsModel {
  id: number;
  name: string;
  status: 'libre' | 'complet';
  type: 'indoor' | 'outdoor';
  availableTimes: string[];
}
