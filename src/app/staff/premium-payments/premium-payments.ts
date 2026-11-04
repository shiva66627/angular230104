import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PremiumPaymentService } from '../../services/premium-payment';

@Component({
  selector: 'app-staff-premium-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './premium-payments.html',
  styleUrl: './premium-payments.css',
})
export class PremiumPayments implements OnInit {
  private paymentService = inject(PremiumPaymentService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  payments: any[] = [];
  searchText: string = '';
  selectedStatus: string = 'All';
  sortBy: string = 'default';

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get totalPages(): number {
    return Math.ceil(this.getFilteredPayments().length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return this.getFilteredPayments().length > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.getFilteredPayments().length);
  }

  get paginatedPayments(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.getFilteredPayments().slice(start, start + this.pageSize);
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
      this.paymentService.getAll().subscribe({
        next: (res) => {
          this.payments = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  getFilteredPayments() {
    let filtered = [...this.payments];

    // Filter by search text
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.paymentId && `pay-${p.paymentId}`.toLowerCase().includes(term)) ||
        (p.policyId && `pol-${p.policyId}`.toLowerCase().includes(term)) ||
        (p.customerName && p.customerName.toLowerCase().includes(term)) ||
        (p.customerId && `cus-${p.customerId}`.toLowerCase().includes(term))
      );
    }

    // Filter by status dropdown
    if (this.selectedStatus !== 'All') {
      const statusValue = parseInt(this.selectedStatus, 10);
      filtered = filtered.filter(p => p.paymentStatus === statusValue);
    }

    // Sort
    if (this.sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    } else if (this.sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
    } else if (this.sortBy === 'amount-desc') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (this.sortBy === 'amount-asc') {
      filtered.sort((a, b) => a.amount - b.amount);
    }

    return filtered;
  }
}
