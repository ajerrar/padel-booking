export interface Club {
  id: number;
  name: string;
  location: string;
  type: 'indoor' | 'outdoor';
  priceMin?: number;
  priceMax?: number;
  courts: number;
}

