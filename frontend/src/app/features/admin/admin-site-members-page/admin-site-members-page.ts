import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user-service';

type RoleFilter = 'ALL' | 'USER' | 'ADMIN_SITE';

@Component({
  selector: 'app-admin-site-members-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-site-members-page.html',
  styleUrls: ['./admin-site-members-page.css'],
})
export class AdminSiteMembersPage {
  private userService = inject(UserService);

  currentUser = this.userService.currentUser;

  searchQuery = signal('');
  selectedRoleFilter = signal<RoleFilter>('ALL');

  siteName = computed(() => this.currentUser()?.siteName || '');

  allSiteUsers = computed(() => {
    const site = this.siteName();

    return this.userService
      .listUsers()
      .filter(user => user.siteName === site);
  });

  filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const role = this.selectedRoleFilter();

    let users = [...this.allSiteUsers()];

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
        `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''} ${user.matricule || ''}`
          .toLowerCase()
          .includes(query)
      );
    }

    return users.sort((a, b) =>
      `${a.lastName || ''} ${a.firstName || ''}`.localeCompare(`${b.lastName || ''} ${b.firstName || ''}`)
    );
  });

  totalMembers = computed(() => this.allSiteUsers().length);

  totalUsers = computed(() =>
    this.allSiteUsers().filter(user => String(user.role || '').trim() === 'User').length
  );

  totalSiteAdmins = computed(() =>
    this.allSiteUsers().filter(user => String(user.role || '').trim() === 'AdminClub').length
  );

  handleSearchInput(value: string) {
    this.searchQuery.set(value || '');
  }

  handleRoleFilterChange(value: string) {
    this.selectedRoleFilter.set((value || 'ALL') as RoleFilter);
  }

  getRoleLabel(role: string): string {
    const r = String(role || '').trim();

    if (r === 'AdminClub') return 'Admin site';

    return 'Utilisateur';
  }

  getRoleBadgeClass(role: string): string {
    const r = String(role || '').trim();

    if (r === 'AdminClub') return 'bg-sky-50 text-sky-700';

    return 'bg-emerald-50 text-emerald-700';
  }
}
