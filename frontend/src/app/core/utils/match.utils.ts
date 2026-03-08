export function getAmountPerPlayer(total: number): number {
  return Number(((Number(total) || 0) / 4).toFixed(2));
}

export function getRemainingPlaces(playersCount: number): number {
  return Math.max(0, 4 - (playersCount || 0));
}

export function getPlayersLabel(playersCount: number): string {
  return `${playersCount || 0}/4 joueurs`;
}

export function getMatchStartTimestamp(date: string, time: string): number {
  const safeDate = String(date || '').trim();
  const timeMatch = String(time || '').match(/(\d{2}:\d{2})/);
  const hhmm = timeMatch ? timeMatch[1] : '';
  const value = new Date(`${safeDate}T${hhmm}:00`);
  return isNaN(value.getTime()) ? Number.MAX_SAFE_INTEGER : value.getTime();
}

export function isMatchPast(date: string, time: string): boolean {
  return getMatchStartTimestamp(date, time) < Date.now();
}
