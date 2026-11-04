import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { User as UserService } from '../../services/user';
import { IUser } from '../../Models/User';
import { Role } from '../../Models/role';
import { ActiveStatus } from '../../Models/active-status';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  users: IUser[] = [];
  searchTerm: string = '';
  selectedRole: string = 'All';
  Role = Role;
  ActiveStatus = ActiveStatus;
  isProcessing = false;

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get filteredUsers(): IUser[] {
    let filtered = this.users;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(u => 
        (u.fullName && u.fullName.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.mobileNumber && u.mobileNumber.toLowerCase().includes(term)) ||
        (u.userId && `usr-${u.userId}`.toLowerCase().includes(term))
      );
    }
    if (this.selectedRole !== 'All') {
      const roleVal = parseInt(this.selectedRole, 10);
      filtered = filtered.filter(u => u.role === roleVal);
    }
    return filtered;
  }

  get paginatedUsers(): IUser[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return this.filteredUsers.length > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.userService.getAll().subscribe({
      next: (response) => {
        this.users = response.data || [];
        this.isProcessing = false;
        this.cdr.detectChanges(); // Force view update for SSR hydration
      },
      error: (err) => {
        console.error('API Error:', err);
        this.isProcessing = false;
      }
    });
  }

  deactivateUser(id: number) {
    if (this.isProcessing) return;
    if (confirm('Are you sure you want to deactivate this user?')) {
      this.isProcessing = true;
      this.userService.deactivate(id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => {
          console.error('Deactivate Error:', err);
          this.isProcessing = false;
        }
      });
    }
  }

  activateUser(id: number) {
    if (this.isProcessing) return;
    if (confirm('Are you sure you want to activate this user?')) {
      this.isProcessing = true;
      this.userService.updateStatus(id, { activeStatus: ActiveStatus.Active }).subscribe({
        next: () => this.loadUsers(),
        error: (err) => {
          console.error('Activate Error:', err);
          this.isProcessing = false;
        }
      });
    }
  }

  promoteToStaff(email: string) {
    if (this.isProcessing) return;
    if (confirm('Are you sure you want to promote this user to staff?')) {
      this.isProcessing = true;
      this.userService.promoteToStaff({ email: email }).subscribe({
        next: () => this.loadUsers(),
        error: (err) => {
          console.error('Promote Error:', err);
          this.isProcessing = false;
        }
      });
    }
  }

  demoteToCustomer(email: string) {
    if (this.isProcessing) return;
    if (confirm('Are you sure you want to demote this user to customer?')) {
      this.isProcessing = true;
      this.userService.demoteToCustomer({ email: email }).subscribe({
        next: () => this.loadUsers(),
        error: (err) => {
          console.error('Demote Error:', err);
          this.isProcessing = false;
        }
      });
    }
  }
}
