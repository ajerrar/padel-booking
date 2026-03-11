import { Injectable, inject, signal } from '@angular/core';
import { ReservationModel, MatchPlayer, MatchVisibility } from '../../models/reservation.model';
import { UserService } from './user-service';
import { NotificationService } from './notification-service';

const KEY = 'pb_reservations';

// Methode toVisibility: gere to visibility de ce bloc.
function toVisibility(v: any): MatchVisibility {
  const s = String(v ?? '').toUpperCase();
  return s === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  private reservations = signal<ReservationModel[]>(this.read());

  // =========================
  // Lecture principale
  // =========================

  list(): ReservationModel[] {
    const all = this.reservations();
    const normalized = this.normalize(all);

    if (normalized.changed) {
      this.write(normalized.data);
      this.reservations.set(normalized.data);
      return normalized.data;
    }

    return normalized.data;
  }

  // Methode listByUser: recupere les donnees necessaires a cette fonctionnalite.
  listByUser(matricule: string): ReservationModel[] {
    const m = (matricule || '').trim();
    return this.list().filter(r =>
      (r.organizerMatricule || '').trim() === m ||
      (r.players || []).some(p => (p.matricule || '').trim() === m)
    );
  }

  // Methode listInvitationsByEmail: recupere les donnees necessaires a cette fonctionnalite.
  listInvitationsByEmail(email: string): ReservationModel[] {
    const e = (email || '').trim().toLowerCase();
    if (!e) return [];

    return this.list().filter(r =>
      r.status === 'CONFIRMED' &&
      r.visibility === 'PRIVATE' &&
      Array.isArray(r.invitedEmails) &&
      r.invitedEmails.some(x => String(x || '').trim().toLowerCase() === e)
    );
  }

  // Methode listInvitationsForUser: recupere les donnees necessaires a cette fonctionnalite.
  listInvitationsForUser(email: string, matricule: string): ReservationModel[] {
    const e = (email || '').trim().toLowerCase();
    const m = (matricule || '').trim();

    if (!e && !m) return [];

    return this.list().filter(r => {
      if (r.status !== 'CONFIRMED') return false;
      if (r.visibility !== 'PRIVATE') return false;

      const invitedByEmail =
        Array.isArray(r.invitedEmails) &&
        r.invitedEmails.some(x => String(x || '').trim().toLowerCase() === e);

      const alreadyInPlayers =
        Array.isArray(r.players) &&
        r.players.some(p =>
          (p.matricule || '').trim() === m &&
          (p.matricule || '').trim() !== (r.organizerMatricule || '').trim()
        );

      const alreadyAccepted =
        Array.isArray(r.acceptedEmails) &&
        r.acceptedEmails.some(x => String(x || '').trim().toLowerCase() === e);

      return invitedByEmail || alreadyInPlayers || alreadyAccepted;
    });
  }

  // Methode getInvitationStatus: recupere les donnees necessaires a cette fonctionnalite.
  getInvitationStatus(match: ReservationModel, email: string, matricule: string): 'PENDING' | 'ACCEPTED' {
    const e = (email || '').trim().toLowerCase();
    const m = (matricule || '').trim();

    const player = (match.players || []).find(p => (p.matricule || '').trim() === m);
    if (player?.paid) return 'ACCEPTED';

    const accepted =
      Array.isArray(match.acceptedEmails) &&
      match.acceptedEmails.some(x => String(x || '').trim().toLowerCase() === e);

    if (accepted) return 'ACCEPTED';

    const invited =
      Array.isArray(match.invitedEmails) &&
      match.invitedEmails.some(x => String(x || '').trim().toLowerCase() === e);

    return invited ? 'PENDING' : 'ACCEPTED';
  }

  // =========================
  // Disponibilité / validation
  // =========================

  isSlotAvailable(clubName: string, courtName: string, date: string, time: string): boolean {
    const c = (clubName || '').trim().toLowerCase();
    const t = (courtName || '').trim().toLowerCase();
    const d = (date || '').trim();
    const ti = (time || '').trim();

    return !this.list().some(r =>
      r.status === 'CONFIRMED' &&
      (r.clubName || '').trim().toLowerCase() === c &&
      (r.courtName || '').trim().toLowerCase() === t &&
      (r.date || '').trim() === d &&
      (r.time || '').trim() === ti
    );
  }

  // Methode canUserReserveClub: verifie une condition metier et renvoie le resultat attendu.
  canUserReserveClub(params: {
    matricule: string;
    userSiteName?: string;
    clubName: string;
    reservationDate: string;
  }): { allowed: boolean; message: string } {
    const matricule = String(params.matricule || '').trim();
    const clubName = String(params.clubName || '').trim();
    const reservationDate = String(params.reservationDate || '').trim();
    const userSiteName = String(params.userSiteName || '').trim();

    if (!matricule) {
      return { allowed: false, message: 'Utilisateur introuvable.' };
    }

    if (!clubName) {
      return { allowed: false, message: 'Club introuvable.' };
    }

    if (!reservationDate) {
      return { allowed: false, message: 'Date de réservation manquante.' };
    }

    if (this.userService.isBookingBlocked(matricule)) {
      return {
        allowed: false,
        message: 'Tu ne peux pas réserver pendant 7 jours suite à une annulation ou un match non complété.',
      };
    }

    const memberType = this.userService.getMemberTypeFromMatricule(matricule);

    if (memberType === 'SITE') {
      const normalizedUserSite = userSiteName.toLowerCase();
      const normalizedClub = clubName.toLowerCase();

      if (!normalizedUserSite) {
        return {
          allowed: false,
          message: 'Ton compte SITE n’est lié à aucun club.',
        };
      }

      if (normalizedUserSite !== normalizedClub) {
        return {
          allowed: false,
          message: 'Un membre SITE peut réserver uniquement dans son propre site.',
        };
      }
    }

    const maxDays =
      memberType === 'GLOBAL' ? 21 :
        memberType === 'SITE' ? 14 :
          5;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(`${reservationDate}T00:00:00`);
    if (isNaN(target.getTime())) {
      return { allowed: false, message: 'Date invalide.' };
    }

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        allowed: false,
        message: 'Impossible de réserver dans le passé.',
      };
    }

    if (diffDays > maxDays) {
      return {
        allowed: false,
        message:
          memberType === 'GLOBAL'
            ? 'Un membre GLOBAL peut réserver maximum 3 semaines à l’avance.'
            : memberType === 'SITE'
              ? 'Un membre SITE peut réserver maximum 2 semaines à l’avance.'
              : 'Un membre FREE peut réserver maximum 5 jours à l’avance.',
      };
    }

    return { allowed: true, message: '' };
  }

  // =========================
  // Création / modification réservation
  // =========================

  add(data: {
    organizerMatricule: string;
    clubName: string;
    courtName: string;
    time: string;
    date: string;
    total: number;
    siteName?: string;
    visibility: MatchVisibility;
    invitedMatricules?: string[];
    invitedEmails?: string[];
  }): ReservationModel {
    const clubName = (data.clubName || '').trim();
    const courtName = (data.courtName || '').trim();
    const time = (data.time || '').trim();
    const date = (data.date || '').trim();

    if (!clubName || !courtName || !time || !date) {
      throw new Error('Données de réservation invalides.');
    }

    const organizer = (data.organizerMatricule || '').trim();
    if (!organizer) throw new Error('Organisateur manquant.');

    const user = this.userService.getUserByMatricule(organizer);
    const ruleCheck = this.canUserReserveClub({
      matricule: organizer,
      userSiteName: user?.siteName,
      clubName,
      reservationDate: date,
    });

    if (!ruleCheck.allowed) {
      throw new Error(ruleCheck.message);
    }

    const conflict = this.list().some(r =>
      r.status === 'CONFIRMED' &&
      (r.clubName || '').trim().toLowerCase() === clubName.toLowerCase() &&
      (r.courtName || '').trim().toLowerCase() === courtName.toLowerCase() &&
      (r.time || '').trim() === time &&
      (r.date || '').trim() === date
    );

    if (conflict) {
      throw new Error('Ce créneau est déjà réservé.');
    }

    const nowIso = new Date().toISOString();
    const visibility = toVisibility(data.visibility);

    const players: MatchPlayer[] = [
      { matricule: organizer, paid: true, joinedAt: nowIso }
    ];

    if (visibility === 'PRIVATE') {
      const invitedMatricules = (data.invitedMatricules || [])
        .map(x => (x || '').trim())
        .filter(Boolean)
        .filter(x => x !== organizer);

      for (const m of invitedMatricules.slice(0, 3)) {
        players.push({
          matricule: m,
          paid: false,
          joinedAt: nowIso
        });
      }
    }

    const invitedEmails = visibility === 'PRIVATE'
      ? Array.from(
        new Set(
          (data.invitedEmails || [])
            .map(e => (e || '').trim().toLowerCase())
            .filter(Boolean)
        )
      ).slice(0, 3)
      : [];

    const item: ReservationModel = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
      createdAt: nowIso,
      organizerMatricule: organizer,
      clubName,
      courtName,
      time,
      date,
      siteName: (data.siteName || clubName || '').trim() || undefined,
      total: Number(data.total) || 60,
      visibility,
      players: Array.isArray(players) ? players : [],
      invitedEmails,
      acceptedEmails: [],
      status: 'CONFIRMED',
      organizerDebtApplied: false,
      organizerDebtAmount: 0,
    };

    const all = [...this.reservations()];
    all.unshift(item);
    this.write(all);

    return item;
  }

  // Methode cancel: verifie une condition metier et renvoie le resultat attendu.
  cancel(id: string): void {
    const all = [...this.reservations()];
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return;

    const item = all[idx];
    all[idx] = { ...item, status: 'CANCELED' };
    this.write(all);

    if (item.organizerMatricule) {
      this.userService.blockBookingForDays(item.organizerMatricule, 7);
    }
  }

  // Methode adminCancelReservation: gere admin cancel reservation de ce bloc.
  adminCancelReservation(id: string): void {
    const all = [...this.reservations()];
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return;

    all[idx] = {
      ...all[idx],
      status: 'CANCELED',
    };

    this.write(all);
  }

  // =========================
  // Invitations privées
  // =========================

  inviteByEmails(matchId: string, emails: string[]): void {
    const all = [...this.reservations()];
    const idx = all.findIndex(r => r.id === matchId);

    if (idx === -1) throw new Error('Match introuvable.');

    const match = all[idx];
    if (match.status !== 'CONFIRMED') throw new Error('Match non disponible.');
    if (match.visibility !== 'PRIVATE') throw new Error('Invitation possible uniquement pour un match privé.');

    const users = this.userService.listUsers();
    const organizer = (match.organizerMatricule || '').trim();

    const normalizedEmails = Array.from(
      new Set(
        (emails || [])
          .map(e => (e || '').trim().toLowerCase())
          .filter(Boolean)
      )
    ).slice(0, 3);

    const existingPlayers = Array.isArray(match.players) ? [...match.players] : [];
    const existingInvitedEmails = Array.isArray(match.invitedEmails) ? [...match.invitedEmails] : [];
    const acceptedEmails = Array.isArray(match.acceptedEmails) ? [...match.acceptedEmails] : [];

    for (const email of normalizedEmails) {
      const user = users.find(u => String(u.email || '').trim().toLowerCase() === email);

      if (user) {
        const matricule = String(user.matricule || '').trim();
        if (
          matricule &&
          matricule !== organizer &&
          !existingPlayers.some(p => (p.matricule || '').trim() === matricule) &&
          existingPlayers.length < 4
        ) {
          existingPlayers.push({
            matricule,
            paid: false,
            joinedAt: new Date().toISOString(),
          });
        }
      }

      if (!existingInvitedEmails.includes(email)) {
        existingInvitedEmails.push(email);

        this.notificationService.add({
          type: 'INVITE_PRIVATE',
          title: 'Invitation reçue',
          message: `Tu as été invité à un match privé chez ${match.clubName}.`,
          matchId: match.id,
          clubName: match.clubName,
          date: match.date,
          time: match.time,
          email,
        });
      }
    }

    all[idx] = {
      ...match,
      players: existingPlayers.slice(0, 4),
      invitedEmails: existingInvitedEmails.slice(0, 3),
      acceptedEmails,
    };

    this.write(all);
  }

  // Methode acceptPrivateInvitationAndMarkPaid: traite l action utilisateur avec les validations necessaires.
  acceptPrivateInvitationAndMarkPaid(matchId: string, email: string, matricule: string): void {
    const e = (email || '').trim().toLowerCase();
    const m = (matricule || '').trim();

    if (!e) throw new Error('Email manquant.');
    if (!m) throw new Error('Matricule manquant.');

    const user = this.userService.getUserByMatricule(m);
    const all = [...this.reservations()];
    const idx = all.findIndex(x => x.id === matchId);

    if (idx === -1) throw new Error('Match introuvable.');

    const match = all[idx];

    const ruleCheck = this.canUserReserveClub({
      matricule: m,
      userSiteName: user?.siteName,
      clubName: match.clubName,
      reservationDate: match.date,
    });

    if (!ruleCheck.allowed) {
      throw new Error(ruleCheck.message);
    }

    if (match.status !== 'CONFIRMED') throw new Error('Match non disponible.');
    if (match.visibility !== 'PRIVATE') throw new Error('Ce match n’est pas privé.');

    const invitedEmails = Array.isArray(match.invitedEmails) ? [...match.invitedEmails] : [];
    const players = Array.isArray(match.players) ? [...match.players] : [];
    const acceptedEmails = Array.isArray(match.acceptedEmails) ? [...match.acceptedEmails] : [];

    const playerIdx = players.findIndex(p => (p.matricule || '').trim() === m);

    if (playerIdx !== -1) {
      players[playerIdx] = {
        ...players[playerIdx],
        paid: true,
      };

      all[idx] = {
        ...match,
        players,
        invitedEmails: invitedEmails.filter(x => String(x || '').trim().toLowerCase() !== e),
        acceptedEmails: Array.from(new Set([...acceptedEmails, e])),
      };

      this.write(all);
    } else {
      const isInvited = invitedEmails.some(x => String(x || '').trim().toLowerCase() === e);
      if (!isInvited) throw new Error('Tu n’es pas invité à ce match.');

      if (players.length >= 4) {
        throw new Error('Match complet.');
      }

      players.push({
        matricule: m,
        paid: true,
        joinedAt: new Date().toISOString(),
      });

      all[idx] = {
        ...match,
        players,
        invitedEmails: invitedEmails.filter(x => String(x || '').trim().toLowerCase() !== e),
        acceptedEmails: Array.from(new Set([...acceptedEmails, e])),
      };

      this.write(all);
    }

    this.notificationService.add({
      type: 'MATCH_PAID',
      title: 'Invitation acceptée',
      message: `Un joueur invité a payé sa place pour ton match sur ${match.courtName}.`,
      matchId: match.id,
      clubName: match.clubName,
      date: match.date,
      time: match.time,
      userMatricule: match.organizerMatricule,
    });
  }

  // =========================
  // Matches publics / participation
  // =========================

  join(matchId: string, matricule: string): void {
    const m = (matricule || '').trim();
    if (!m) throw new Error('Matricule manquant.');

    const user = this.userService.getUserByMatricule(m);
    const all = [...this.reservations()];
    const idx = all.findIndex(x => x.id === matchId);

    if (idx === -1) throw new Error('Match introuvable.');

    const r = all[idx];

    const ruleCheck = this.canUserReserveClub({
      matricule: m,
      userSiteName: user?.siteName,
      clubName: r.clubName,
      reservationDate: r.date,
    });

    if (!ruleCheck.allowed) {
      throw new Error(ruleCheck.message);
    }

    if (r.status !== 'CONFIRMED') throw new Error('Match non disponible.');
    if (r.visibility !== 'PUBLIC') throw new Error('Impossible de rejoindre un match privé.');
    if ((r.players || []).some(p => (p.matricule || '').trim() === m)) {
      throw new Error('Tu participes déjà à ce match.');
    }
    if ((r.players || []).length >= 4) throw new Error('Match complet.');

    all[idx] = {
      ...r,
      players: [
        ...(r.players || []),
        {
          matricule: m,
          paid: false,
          joinedAt: new Date().toISOString()
        }
      ]
    };

    this.write(all);
  }

  // Methode markPaid: gere mark paid de ce bloc.
  markPaid(matchId: string, matricule: string): void {
    const m = (matricule || '').trim();
    if (!m) throw new Error('Matricule manquant.');

    const all = [...this.reservations()];
    const idx = all.findIndex(x => x.id === matchId);

    if (idx === -1) throw new Error('Match introuvable.');

    const r = all[idx];

    all[idx] = {
      ...r,
      players: (r.players || []).map(p =>
        (p.matricule || '').trim() === m ? { ...p, paid: true } : p
      )
    };

    this.write(all);
  }

  // Methode joinAndMarkPaid: traite l action utilisateur avec les validations necessaires.
  joinAndMarkPaid(matchId: string, matricule: string): void {
    const m = (matricule || '').trim();
    if (!m) throw new Error('Matricule manquant.');

    const user = this.userService.getUserByMatricule(m);
    const all = [...this.reservations()];
    const idx = all.findIndex(x => x.id === matchId);

    if (idx === -1) throw new Error('Match introuvable.');

    const r = all[idx];

    const ruleCheck = this.canUserReserveClub({
      matricule: m,
      userSiteName: user?.siteName,
      clubName: r.clubName,
      reservationDate: r.date,
    });

    if (!ruleCheck.allowed) {
      throw new Error(ruleCheck.message);
    }

    if (r.status !== 'CONFIRMED') throw new Error('Match non disponible.');
    if (r.visibility !== 'PUBLIC') throw new Error('Impossible de rejoindre un match privé.');
    if ((r.players || []).some(p => (p.matricule || '').trim() === m)) {
      throw new Error('Tu participes déjà à ce match.');
    }
    if ((r.players || []).length >= 4) throw new Error('Match complet.');

    all[idx] = {
      ...r,
      players: [
        ...(r.players || []),
        {
          matricule: m,
          paid: true,
          joinedAt: new Date().toISOString()
        }
      ]
    };

    this.write(all);

    this.notificationService.add({
      type: 'MATCH_JOINED',
      title: 'Des joueurs ont rejoint',
      message: `Un joueur a rejoint ton match sur ${r.courtName}.`,
      matchId: r.id,
      clubName: r.clubName,
      date: r.date,
      time: r.time,
      userMatricule: r.organizerMatricule,
    });
  }

  // =========================
  // Dette organisateur
  // =========================

  getOrganizerOutstandingDebt(matricule: string): number {
    const m = String(matricule || '').trim();
    if (!m) return 0;

    return this.list()
      .filter(match => (match.organizerMatricule || '').trim() === m)
      .reduce((sum, match) => sum + (Number(match.organizerDebtAmount) || 0), 0);
  }

  // Methode clearOrganizerDebtForMatch: supprime ou reinitialise les donnees concernees.
  clearOrganizerDebtForMatch(matchId: string): void {
    const all = [...this.reservations()];
    const idx = all.findIndex(r => r.id === matchId);
    if (idx === -1) return;

    all[idx] = {
      ...all[idx],
      organizerDebtAmount: 0,
      organizerDebtApplied: false,
    };

    this.write(all);
  }

  // =========================
  // Réservations par site
  // =========================

  listBySite(siteName: string): ReservationModel[] {
    const site = (siteName || '').trim().toLowerCase();
    if (!site) return [];

    return this.list().filter(r =>
      r.status === 'CONFIRMED' &&
      (r.siteName || r.clubName || '').trim().toLowerCase() === site
    );
  }

  // Methode listBySiteAndDate: recupere les donnees necessaires a cette fonctionnalite.
  listBySiteAndDate(siteName: string, date: string): ReservationModel[] {
    const site = (siteName || '').trim().toLowerCase();
    const d = (date || '').trim();

    return this.list().filter(r =>
      r.status === 'CONFIRMED' &&
      (r.siteName || r.clubName || '').trim().toLowerCase() === site &&
      (r.date || '').trim() === d
    );
  }

  // Methode listReservedSlotsBySiteAndDate: recupere les donnees necessaires a cette fonctionnalite.
  listReservedSlotsBySiteAndDate(siteName: string, date: string): Array<{
    reservationId: string;
    courtName: string;
    time: string;
    clubName: string;
    date: string;
    organizerMatricule: string;
    playersCount: number;
    total: number;
  }> {
    return this.listBySiteAndDate(siteName, date)
      .sort((a, b) => {
        const court = (a.courtName || '').localeCompare(b.courtName || '');
        if (court !== 0) return court;
        return (a.time || '').localeCompare(b.time || '');
      })
      .map(r => ({
        reservationId: r.id,
        courtName: r.courtName,
        time: r.time,
        clubName: r.clubName,
        date: r.date,
        organizerMatricule: r.organizerMatricule,
        playersCount: r.players?.length || 0,
        total: Number(r.total) || 0,
      }));
  }

  // =========================
  // Statistiques
  // =========================

  getGlobalStats() {
    const all = this.list().filter(r => r.status === 'CONFIRMED');

    const totalRevenue = all.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalMatches = all.length;
    const totalPlayers = all.reduce((sum, r) => sum + (r.players?.length || 0), 0);
    const totalCapacity = totalMatches * 4;
    const occupancyRate = totalCapacity ? Math.round((totalPlayers / totalCapacity) * 100) : 0;

    const privateMatches = all.filter(r => r.visibility === 'PRIVATE').length;
    const publicMatches = all.filter(r => r.visibility === 'PUBLIC').length;

    const siteMap = new Map<string, { site: string; revenue: number; matches: number; players: number }>();

    for (const r of all) {
      const site = (r.siteName || r.clubName || 'Sans site').trim();
      const current = siteMap.get(site) || { site, revenue: 0, matches: 0, players: 0 };
      current.revenue += Number(r.total) || 0;
      current.matches += 1;
      current.players += r.players?.length || 0;
      siteMap.set(site, current);
    }

    const bySite = Array.from(siteMap.values()).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalMatches,
      totalPlayers,
      occupancyRate,
      privateMatches,
      publicMatches,
      bySite,
    };
  }

  // Methode getGlobalStatsDetailed: recupere les donnees necessaires a cette fonctionnalite.
  getGlobalStatsDetailed() {
    const all = this.list().filter(r => r.status === 'CONFIRMED');

    const totalRevenue = all.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalMatches = all.length;
    const totalPlayers = all.reduce((sum, r) => sum + (r.players?.length || 0), 0);
    const totalCapacity = totalMatches * 4;
    const occupancyRate = totalCapacity ? Math.round((totalPlayers / totalCapacity) * 100) : 0;

    const privateMatches = all.filter(r => r.visibility === 'PRIVATE').length;
    const publicMatches = all.filter(r => r.visibility === 'PUBLIC').length;

    const siteMap = new Map<string, {
      site: string;
      revenue: number;
      matches: number;
      players: number;
      occupancyRate: number;
    }>();

    for (const r of all) {
      const site = (r.siteName || r.clubName || 'Sans site').trim();
      const current = siteMap.get(site) || {
        site,
        revenue: 0,
        matches: 0,
        players: 0,
        occupancyRate: 0,
      };

      current.revenue += Number(r.total) || 0;
      current.matches += 1;
      current.players += r.players?.length || 0;

      siteMap.set(site, current);
    }

    const bySite = Array.from(siteMap.values())
      .map(x => ({
        ...x,
        occupancyRate: x.matches ? Math.round((x.players / (x.matches * 4)) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const recentReservations = [...all]
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, 12);

    return {
      totalRevenue,
      totalMatches,
      totalPlayers,
      occupancyRate,
      privateMatches,
      publicMatches,
      bySite,
      recentReservations,
    };
  }

  // Methode getSiteStats: recupere les donnees necessaires a cette fonctionnalite.
  getSiteStats(siteName: string) {
    const target = (siteName || '').trim().toLowerCase();

    const all = this.list().filter(r =>
      r.status === 'CONFIRMED' &&
      (r.siteName || r.clubName || '').trim().toLowerCase() === target
    );

    const totalRevenue = all.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalMatches = all.length;
    const totalPlayers = all.reduce((sum, r) => sum + (r.players?.length || 0), 0);
    const totalCapacity = totalMatches * 4;
    const occupancyRate = totalCapacity ? Math.round((totalPlayers / totalCapacity) * 100) : 0;

    const privateMatches = all.filter(r => r.visibility === 'PRIVATE').length;
    const publicMatches = all.filter(r => r.visibility === 'PUBLIC').length;

    const courtMap = new Map<string, number>();
    for (const r of all) {
      const court = (r.courtName || 'Terrain inconnu').trim();
      courtMap.set(court, (courtMap.get(court) || 0) + 1);
    }

    const byCourt = Array.from(courtMap.entries())
      .map(([court, matches]) => ({ court, matches }))
      .sort((a, b) => b.matches - a.matches);

    return {
      siteName,
      totalRevenue,
      totalMatches,
      totalPlayers,
      occupancyRate,
      privateMatches,
      publicMatches,
      byCourt,
    };
  }

  // =========================
  // Normalisation / règles automatiques
  // =========================

  private normalize(all: ReservationModel[]): { data: ReservationModel[]; changed: boolean } {
    let changed = false;
    const now = new Date();

    const updated: ReservationModel[] = all.map((r): ReservationModel => {
      const normalized: ReservationModel = {
        ...r,
        visibility: toVisibility(r.visibility),
        status: String(r.status).toUpperCase() === 'CANCELED' ? 'CANCELED' : 'CONFIRMED',
        total: Number(r.total) || 0,
        players: Array.isArray(r.players) ? r.players : [],
        invitedEmails: Array.isArray(r.invitedEmails) ? r.invitedEmails : [],
        acceptedEmails: Array.isArray(r.acceptedEmails) ? r.acceptedEmails : [],
        organizerDebtApplied: !!r.organizerDebtApplied,
        organizerDebtAmount: Number(r.organizerDebtAmount) || 0,
      };

      if (normalized.status !== 'CONFIRMED') return normalized;

      const start = this.getMatchStartDateTime(normalized);
      if (!start) return normalized;

      const msToStart = start.getTime() - now.getTime();
      const daysToStart = msToStart / (1000 * 60 * 60 * 24);

      const isComplete = (normalized.players?.length || 0) >= 4;

      if (daysToStart <= 1 && daysToStart > 0) {
        const organizer = normalized.organizerMatricule;
        const kept = (normalized.players || []).filter(
          p => p.matricule === organizer || p.paid
        );

        const removedSomeone = kept.length !== (normalized.players?.length || 0);
        const shouldBePublic = normalized.visibility !== 'PUBLIC';

        if (removedSomeone || shouldBePublic) {
          changed = true;
          return {
            ...normalized,
            players: kept,
            visibility: 'PUBLIC'
          };
        }
      }

      if (daysToStart <= 0) {
        if (normalized.visibility === 'PRIVATE' && !isComplete) {
          changed = true;
          return {
            ...normalized,
            visibility: 'PUBLIC'
          };
        }
      }

      if (daysToStart <= 1 && daysToStart > 0 && !isComplete && !normalized.organizerDebtApplied) {
        const debt = Number(normalized.total) || 0;
        changed = true;

        this.userService.blockBookingForDays(normalized.organizerMatricule, 7);

        return {
          ...normalized,
          organizerDebtApplied: true,
          organizerDebtAmount: debt,
        };
      }

      return normalized;
    });

    return { data: updated, changed };
  }

  // Methode getMatchStartDateTime: recupere les donnees necessaires a cette fonctionnalite.
  private getMatchStartDateTime(r: ReservationModel): Date | null {
    const date = (r.date || '').trim();
    const startTime = this.extractStartHHmm(r.time);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    if (!/^\d{2}:\d{2}$/.test(startTime)) return null;

    const d = new Date(`${date}T${startTime}:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Methode extractStartHHmm: construit la valeur attendue a partir des donnees disponibles.
  private extractStartHHmm(time: string): string {
    const s = (time || '').trim();
    const m = s.match(/(\d{2}:\d{2})/);
    return m ? m[1] : '';
  }

  // =========================
  // Persistance localStorage
  // =========================

  private read(): ReservationModel[] {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? (JSON.parse(raw) as any[]) : [];

      return arr.map((r: any): ReservationModel => ({
        id: String(r?.id ?? `${Date.now()}-${Math.floor(Math.random() * 1e9)}`),
        createdAt: String(r?.createdAt ?? new Date().toISOString()),
        organizerMatricule: String(r?.organizerMatricule ?? '').trim(),
        clubName: String(r?.clubName ?? '').trim(),
        courtName: String(r?.courtName ?? '').trim(),
        time: String(r?.time ?? '').trim(),
        date: String(r?.date ?? '').trim(),
        siteName: r?.siteName ? String(r.siteName).trim() : undefined,
        total: Number(r?.total) || 0,
        visibility: toVisibility(r?.visibility),
        players: Array.isArray(r?.players)
          ? r.players.map((p: any) => ({
            matricule: String(p?.matricule ?? '').trim(),
            paid: !!p?.paid,
            joinedAt: String(p?.joinedAt ?? new Date().toISOString()),
          }))
          : [],
        invitedEmails: Array.isArray(r?.invitedEmails)
          ? r.invitedEmails.map((e: any) => String(e ?? '').trim().toLowerCase()).filter(Boolean)
          : [],
        acceptedEmails: Array.isArray(r?.acceptedEmails)
          ? r.acceptedEmails.map((e: any) => String(e ?? '').trim().toLowerCase()).filter(Boolean)
          : [],
        status: String(r?.status).toUpperCase() === 'CANCELED' ? 'CANCELED' : 'CONFIRMED',
        organizerDebtApplied: !!r?.organizerDebtApplied,
        organizerDebtAmount: Number(r?.organizerDebtAmount) || 0,
      }));
    } catch {
      return [];
    }
  }

  // Methode write: met a jour les donnees et maintient la coherence de l etat.
  private write(all: ReservationModel[]) {
    localStorage.setItem(KEY, JSON.stringify(all));
    this.reservations.set(all);
  }
}
