export type UserRole = 'Joueur' | 'AdminClub' | 'AdminGlobal';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city: string;
  level: string;
  matricule: string;  // ex: G1234, S12345, L12345
  role: UserRole;

  // ✅ AJOUTS MINIMAUX (optionnels, donc pas de casse)
  siteName?: string;              // obligatoire si matricule commence par "S"
  bookingBlockedUntil?: string;   // ISO date, ex: "2026-03-12T00:00:00.000Z"

  createdAt: string;
}

