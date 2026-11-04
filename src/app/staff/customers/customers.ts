import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Customer } from '../../services/customer';
import { PolicyService } from '../../services/policy';

@Component({
  selector: 'app-staff-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class Customers implements OnInit {
  private customerService = inject(Customer);
  private policyService = inject(PolicyService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  customers: any[] = [];
  allPolicies: any[] = [];
  searchText: string = '';
  detailedCustomer: any = null;
  selectedCustomerPhoto: any = null;
  isLoading = true;

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get totalPages(): number {
    return Math.ceil(this.getFilteredCustomers().length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return this.getFilteredCustomers().length > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.getFilteredCustomers().length);
  }

  get paginatedCustomers(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.getFilteredCustomers().slice(start, start + this.pageSize);
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

  onFilterChange() {
    this.currentPage = 1;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCustomers();
      this.loadPolicies();
    }
  }

  loadCustomers() {
    this.isLoading = true;
    this.customerService.getAll().subscribe({
      next: (res) => {
        this.customers = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching customers:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPolicies() {
    this.policyService.getAll().subscribe({
      next: (res) => {
        this.allPolicies = res.data || [];
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error fetching policies:', e)
    });
  }

  getCustomerPolicies(customerId: number): any[] {
    return this.allPolicies.filter(p => p.customerId === customerId);
  }

  getCustomerPolicyCount(customerId: number): number {
    return this.getCustomerPolicies(customerId).length;
  }

  getFilteredCustomers() {
    if (!this.searchText.trim()) {
      return this.customers;
    }
    const term = this.searchText.toLowerCase().trim();
    return this.customers.filter(c => 
      (c.customerId && `cus-${c.customerId}`.toLowerCase().includes(term)) ||
      (c.fullName && c.fullName.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.mobileNumber && c.mobileNumber.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.state && c.state.toLowerCase().includes(term)) ||
      (c.occupation && c.occupation.toLowerCase().includes(term))
    );
  }

  getCustomerPhoto(userId: number): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(`profilePhoto_${userId}`);
    }
    return null;
  }

  viewProfile(customer: any) {
    this.detailedCustomer = customer;
    this.cdr.detectChanges();
  }

  closeProfileModal() {
    this.detailedCustomer = null;
    this.cdr.detectChanges();
  }

  viewPhoto(customer: any) {
    this.selectedCustomerPhoto = customer;
    this.cdr.detectChanges();
  }

  closePhotoModal() {
    this.selectedCustomerPhoto = null;
    this.cdr.detectChanges();
  }

  getAge(dob: any): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  getGenderLabel(gender: any): string {
    if (gender === 0 || gender === '0' || gender === 'Male') return 'Male';
    if (gender === 1 || gender === '1' || gender === 'Female') return 'Female';
    if (gender === 2 || gender === '2' || gender === 'Other') return 'Other';
    return 'Not Specified';
  }
}
