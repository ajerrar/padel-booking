import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user-service';
import { getRoleLabel } from '../../../core/utils/user.utils';

type RoleFilter = 'ALL' | 'USER' | 'ADMIN_SITE';

@Component({
  selector: 'app-admin-site-members-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-site-members-page.html',
})
export class AdminSiteMembersPage {
  private userService = inject(UserService);

  currentUser = this.userService.currentUser;

  searchQuery = signal('');
  selectedRoleFilter = signal<RoleFilter>('ALL');

  // Methode normalizeSiteName: gere normalize site name de ce bloc.
  private normalizeSiteName(value: string): string {
    const raw = String(value || '').trim().toLowerCase();

    if (
      raw === 'court 24 arena' ||
      raw === 'site_court24_arena_waterloo' ||
      raw === 'court24' ||
      raw === 'waterloo'
    ) {
      return 'Court 24 Arena';
    }

    if (
      raw === 'padel factory' ||
      raw === 'site_padel_factory_uccle' ||
      raw === 'factory' ||
      raw === 'uccle'
    ) {
      return 'Padel Factory';
    }

    if (
      raw === 'playzone padely' ||
      raw === 'playzone padel' ||
      raw === 'site_playzone_padely_forest' ||
      raw === 'playzone' ||
      raw === 'forest'
    ) {
      return 'PlayZone Padely';
    }

    return String(value || '').trim();
  }

  siteName = computed(() => {
    return this.normalizeSiteName(this.currentUser()?.siteName || '');
  });

  allUsers = computed(() => this.userService.listUsers());

  siteUsers = computed(() => {
    const adminSite = this.siteName().trim().toLowerCase();
    if (!adminSite) return [];

    return this.allUsers().filter(user => {
      const userSite = this.normalizeSiteName(user.siteName || '').trim().toLowerCase();
      return userSite === adminSite;
    });
  });

  filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const role = this.selectedRoleFilter();

    let users = [...this.siteUsers()];

    if (role !== 'ALL') {
      users = users.filter(user => {
        const userRole = String(user.role || '').trim();

        if (role === 'USER') return userRole === 'User';
        if (role === 'ADMIN_SITE') return userRole === 'AdminClub';

        return true;
      });
    }

    if (query) {
      users = users.filter(user =>
        `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''} ${user.matricule || ''} ${user.city || ''} ${user.siteName || ''} ${user.role || ''} ${user.level || ''}`
          .toLowerCase()
          .includes(query)
      );
    }

    return users.sort((a, b) =>
      `${a.lastName || ''} ${a.firstName || ''}`.localeCompare(
        `${b.lastName || ''} ${b.firstName || ''}`
      )
    );
  });

  totalMembers = computed(() => this.siteUsers().length);

  totalUsers = computed(() =>
    this.siteUsers().filter(user => String(user.role || '').trim() === 'User').length
  );

  totalSiteAdmins = computed(() =>
    this.siteUsers().filter(user => String(user.role || '').trim() === 'AdminClub').length
  );

  // Methode handleSearchInput: gere handle search input de ce bloc.
  handleSearchInput(value: string) {
    this.searchQuery.set(value || '');
  }

  // Methode handleRoleFilterChange: gere handle role filter change de ce bloc.
  handleRoleFilterChange(value: string) {
    this.selectedRoleFilter.set((value || 'ALL') as RoleFilter);
  }

  // Methode getRoleLabel: recupere les donnees necessaires a cette fonctionnalite.
  getRoleLabel(role: string): string {
    return getRoleLabel(role);
  }

  // Methode getRoleBadgeClass: recupere les donnees necessaires a cette fonctionnalite.
  getRoleBadgeClass(role: string): string {
    const r = String(role || '').trim();

    if (r === 'AdminClub') return 'bg-sky-50 text-sky-700';
    return 'bg-emerald-50 text-emerald-700';
  }
}
