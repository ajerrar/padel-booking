import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user-service';
import { getRoleLabel } from '../../../core/utils/user.utils';

type RoleFilter = 'ALL' | 'USER' | 'ADMIN_GLOBAL' | 'ADMIN_SITE';

@Component({
  selector: 'app-admin-members-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-members-page.html',
})
export class AdminMembersPage {
  private userService = inject(UserService);

  searchQuery = signal('');
  selectedRoleFilter = signal<RoleFilter>('ALL');

  allUsers = computed(() => this.userService.listUsers());

  filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const role = this.selectedRoleFilter();

    let users = [...this.allUsers()];

    if (role !== 'ALL') {
      users = users.filter(user => {
        const userRole = String(user.role || '').trim();

        if (role === 'USER') return userRole === 'User';
        if (role === 'ADMIN_GLOBAL') return userRole === 'AdminGlobal';
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

  totalMembers = computed(() => this.allUsers().length);

  totalUsers = computed(() =>
    this.allUsers().filter(user => String(user.role || '').trim() === 'User').length
  );

  totalGlobalAdmins = computed(() =>
    this.allUsers().filter(user => String(user.role || '').trim() === 'AdminGlobal').length
  );

  totalSiteAdmins = computed(() =>
    this.allUsers().filter(user => String(user.role || '').trim() === 'AdminClub').length
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

    if (r === 'AdminGlobal') return 'bg-violet-50 text-violet-700';
    if (r === 'AdminClub') return 'bg-sky-50 text-sky-700';

    return 'bg-emerald-50 text-emerald-700';
  }
}
