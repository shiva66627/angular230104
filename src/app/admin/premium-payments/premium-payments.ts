import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PremiumPaymentService } from '../../services/premium-payment';

@Component({
  selector: 'app-premium-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './premium-payments.html',
  styleUrl: './premium-payments.css',
})
export class PremiumPayments implements OnInit {
  private service = inject(PremiumPaymentService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  payments: any[] = [];
  paymentModes = ['UPI', 'Card', 'NetBanking', 'Cash'];
  paymentStatuses = ['Failed', 'Success', 'Pending'];
  searchText = '';
  selectedStatus = 'All';
  sortBy = 'default';

  ngOnInit() { if (isPlatformBrowser(this.platformId)) this.load(); }
  load() {
    this.service.getAll().subscribe({
      next: (r) => {
        this.payments = (r.data || []).map((p: any) => {
          let dateVal = p.paymentDate;
          if (typeof dateVal === 'string' && !dateVal.endsWith('Z') && !dateVal.includes('+')) {
            dateVal = dateVal + 'Z';
          }
          return { ...p, paymentDate: dateVal };
        });
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });
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
