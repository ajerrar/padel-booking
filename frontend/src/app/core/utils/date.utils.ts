// Methode getTodayIso: recupere les donnees necessaires a cette fonctionnalite.
export function getTodayIso(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Methode formatDisplayDate: construit la valeur attendue a partir des donnees disponibles.
export function formatDisplayDate(date: string | undefined | null): string {
  if (!date) return '—';

  const [year, month, day] = String(date).split('-');
  if (!year || !month || !day) return String(date);

  return `${day}/${month}/${year}`;
}
