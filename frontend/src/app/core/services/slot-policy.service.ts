import { Injectable, signal } from '@angular/core';

export interface SitePolicy {
  siteName: string;
  opening: string;
  closing: string;
  slotMinutes: number;
  breakMinutes: number;
  closedWeekdays: number[];
  closedDates?: string[];
}

const CUSTOM_SITE_CLOSURES_KEY = 'pb_custom_site_closures';

@Injectable({ providedIn: 'root' })
export class SlotPolicyService {
  private refreshTick = signal(0);

  private policies: Record<string, SitePolicy> = {
    'Court 24 Arena': {
      siteName: 'Court 24 Arena',
      opening: '08:00',
      closing: '23:00',
      slotMinutes: 90,
      breakMinutes: 15,
      closedWeekdays: [1, 2],
      closedDates: ['2026-02-10', '2026-05-12'],
    },
    'Padel Factory': {
      siteName: 'Padel Factory',
      opening: '09:00',
      closing: '22:00',
      slotMinutes: 90,
      breakMinutes: 15,
      closedWeekdays: [3, 4],
      closedDates: ['2026-03-17', '2026-06-09'],
    },
    'PlayZone Padely': {
      siteName: 'PlayZone Padely',
      opening: '10:00',
      closing: '21:30',
      slotMinutes: 90,
      breakMinutes: 15,
      closedWeekdays: [4, 5],
      closedDates: ['2026-04-21', '2026-09-15'],
    },
  };

  private globalClosedDates: string[] = [
    '2026-01-01',
    '2026-04-06',
    '2026-05-01',
    '2026-05-14',
    '2026-05-25',
    '2026-07-21',
    '2026-08-15',
    '2026-11-01',
    '2026-11-11',
    '2026-12-25',
  ];

  private winterBreakRanges: Array<{ start: string; end: string }> = [
    { start: '2026-12-21', end: '2027-01-03' },
  ];

  // Methode getAllSites: recupere les donnees necessaires a cette fonctionnalite.
  getAllSites(): string[] {
    this.refreshTick();
    return Object.keys(this.policies).sort((a, b) => a.localeCompare(b));
  }

  // Methode getPolicy: recupere les donnees necessaires a cette fonctionnalite.
  getPolicy(siteName: string): SitePolicy | null {
    this.refreshTick();
    const key = (siteName || '').trim();
    return this.policies[key] ?? null;
  }

  // Methode getClosedWeekdays: recupere les donnees necessaires a cette fonctionnalite.
  getClosedWeekdays(siteName: string): number[] {
    this.refreshTick();
    const policy = this.getPolicy(siteName);
    return policy ? [...policy.closedWeekdays] : [];
  }

  // Methode updateClosedWeekdays: met a jour les donnees et maintient la coherence de l etat.
  updateClosedWeekdays(siteName: string, weekdays: number[]): void {
    const policy = this.getPolicy(siteName);
    if (!policy) return;

    const normalized = Array.from(new Set((weekdays || []).filter(x => x >= 0 && x <= 6))).sort((a, b) => a - b);

    this.policies[siteName] = {
      ...policy,
      closedWeekdays: normalized,
    };

    this.touch();
  }

  // Methode getCustomClosedDates: recupere les donnees necessaires a cette fonctionnalite.
  getCustomClosedDates(siteName: string): string[] {
    this.refreshTick();
    const map = this.readCustomClosures();
    return Array.isArray(map[siteName]) ? [...map[siteName]] : [];
  }

  // Methode addCustomClosedDate: cree ou ajoute un element selon les regles metier.
  addCustomClosedDate(siteName: string, dateISO: string): void {
    const site = (siteName || '').trim();
    const date = (dateISO || '').trim();
    if (!site || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

    const map = this.readCustomClosures();
    const current = Array.isArray(map[site]) ? [...map[site]] : [];

    if (!current.includes(date)) {
      current.push(date);
      current.sort();
      map[site] = current;
      this.writeCustomClosures(map);
      this.touch();
    }
  }

  // Methode removeCustomClosedDate: supprime ou reinitialise les donnees concernees.
  removeCustomClosedDate(siteName: string, dateISO: string): void {
    const site = (siteName || '').trim();
    const date = (dateISO || '').trim();
    if (!site || !date) return;

    const map = this.readCustomClosures();
    const current = Array.isArray(map[site]) ? [...map[site]] : [];
    map[site] = current.filter(x => x !== date);
    this.writeCustomClosures(map);
    this.touch();
  }

  // Methode isGloballyClosed: verifie une condition metier et renvoie le resultat attendu.
  isGloballyClosed(dateISO: string): boolean {
    this.refreshTick();
    const d = (dateISO || '').trim();
    if (!d) return false;

    if (this.globalClosedDates.includes(d)) return true;
    return this.isInWinterBreak(d);
  }

  // Methode isSiteClosed: verifie une condition metier et renvoie le resultat attendu.
  isSiteClosed(siteName: string, dateISO: string): boolean {
    this.refreshTick();
    const policy = this.getPolicy(siteName);
    if (!policy) return false;

    const d = (dateISO || '').trim();
    if (!d) return false;

    if ((policy.closedDates || []).includes(d)) return true;
    if (this.getCustomClosedDates(siteName).includes(d)) return true;

    const weekday = this.getWeekday(d);
    return policy.closedWeekdays.includes(weekday);
  }

  // Methode isClosed: verifie une condition metier et renvoie le resultat attendu.
  isClosed(siteName: string, dateISO: string): boolean {
    this.refreshTick();
    return this.isGloballyClosed(dateISO) || this.isSiteClosed(siteName, dateISO);
  }

  // Methode getSlotsForSite: recupere les donnees necessaires a cette fonctionnalite.
  getSlotsForSite(siteName: string, dateISO: string): string[] {
    this.refreshTick();
    const policy = this.getPolicy(siteName);
    if (!policy) return [];

    if (this.isClosed(siteName, dateISO)) return [];

    const start = this.toMinutes(policy.opening);
    const end = this.toMinutes(policy.closing);
    const step = policy.slotMinutes + policy.breakMinutes;

    const slots: string[] = [];
    let current = start;

    while (current + policy.slotMinutes <= end) {
      slots.push(this.toHHmm(current));
      current += step;
    }

    return slots;
  }

  // Methode getEndTime: recupere les donnees necessaires a cette fonctionnalite.
  getEndTime(siteName: string, startHHmm: string): string {
    this.refreshTick();
    const policy = this.getPolicy(siteName);
    if (!policy) return startHHmm;
    const start = this.toMinutes(startHHmm);
    return this.toHHmm(start + policy.slotMinutes);
  }

  // Methode getClosureReason: recupere les donnees necessaires a cette fonctionnalite.
  getClosureReason(siteName: string, dateISO: string): string | null {
    this.refreshTick();
    const d = (dateISO || '').trim();
    if (!d) return null;

    if (this.globalClosedDates.includes(d)) return 'Jour férié';
    if (this.isInWinterBreak(d)) return 'Fermeture hivernale';

    const policy = this.getPolicy(siteName);
    if (!policy) return null;

    if ((policy.closedDates || []).includes(d)) return 'Fermeture exceptionnelle du site';
    if (this.getCustomClosedDates(siteName).includes(d)) return 'Fermeture ajoutée par l’administrateur';

    const weekday = this.getWeekday(d);
    if (policy.closedWeekdays.includes(weekday)) return 'Jour de fermeture hebdomadaire';

    return null;
  }

  // Methode touch: gere touch de ce bloc.
  private touch(): void {
    this.refreshTick.update(v => v + 1);
  }

  // Methode readCustomClosures: recupere les donnees necessaires a cette fonctionnalite.
  private readCustomClosures(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(CUSTOM_SITE_CLOSURES_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  // Methode writeCustomClosures: met a jour les donnees et maintient la coherence de l etat.
  private writeCustomClosures(data: Record<string, string[]>): void {
    localStorage.setItem(CUSTOM_SITE_CLOSURES_KEY, JSON.stringify(data));
  }

  // Methode isInWinterBreak: verifie une condition metier et renvoie le resultat attendu.
  private isInWinterBreak(dateISO: string): boolean {
    const current = new Date(`${dateISO}T00:00:00`);
    if (isNaN(current.getTime())) return false;

    return this.winterBreakRanges.some(range => {
      const start = new Date(`${range.start}T00:00:00`);
      const end = new Date(`${range.end}T23:59:59`);
      return current >= start && current <= end;
    });
  }

  // Methode getWeekday: recupere les donnees necessaires a cette fonctionnalite.
  private getWeekday(dateISO: string): number {
    const d = new Date(`${dateISO}T00:00:00`);
    return isNaN(d.getTime()) ? -1 : d.getDay();
  }

  // Methode toMinutes: gere to minutes de ce bloc.
  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  // Methode toHHmm: gere to hhmm de ce bloc.
  private toHHmm(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
