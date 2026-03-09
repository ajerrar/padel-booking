export function getRoleLabel(role: string | undefined | null): string {
  const value = String(role || '').trim();

  if (value === 'AdminGlobal') return 'Administrateur global';
  if (value === 'AdminClub') return 'Administrateur du site';

  return 'Membre';
}
