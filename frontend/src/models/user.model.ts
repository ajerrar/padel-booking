export type UserRole = 'Joueur' | 'AdminClub' | 'AdminGlobal';
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city: string;
  level: string;
  matricule: string;
  role: UserRole;
  createdAt: string;
}
export type UserModel = User;
