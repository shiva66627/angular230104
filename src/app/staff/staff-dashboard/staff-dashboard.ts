import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PolicyService } from '../../services/policy';
import { ClaimService } from '../../services/claim';
import { Customer } from '../../services/customer';
import { PremiumPaymentService } from '../../services/premium-payment';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staff-dashboard.html',
  styleUrl: './staff-dashboard.css',
})
export class StaffDashboard implements OnInit {
  private policyService = inject(PolicyService);
  private claimService = inject(ClaimService);
  private customerService = inject(Customer);
  private paymentService = inject(PremiumPaymentService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  staffName = 'Staff Member';
  currentDate = new Date();
  isLoading = true;

  // Key Metrics
  pendingClaims = 0;
  totalClaims = 0;
  activePolicies = 0;
  totalPolicies = 0;
  totalCustomers = 0;
  totalRevenue = 0;

  // Feeds
  pendingClaimsList: any[] = [];
  recentPolicies: any[] = [];
  recentPayments: any[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('fullName') || localStorage.getItem('username');
      if (storedUser) {
        this.staffName = storedUser;
      }
      this.loadMetrics();
    }
  }

  loadMetrics() {
    this.isLoading = true;

    // Claims
    this.claimService.getAll().subscribe({
      next: (res) => {
        const claims = res.data || [];
        this.totalClaims = claims.length;
        this.pendingClaims = claims.filter(c => c.claimStatus === 0).length;
        this.pendingClaimsList = claims.filter(c => c.claimStatus === 0).slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load claims for staff dashboard:', e)
    });

    // Policies
    this.policyService.getAll().subscribe({
      next: (res) => {
        const policies = res.data || [];
        this.totalPolicies = policies.length;
        this.activePolicies = policies.filter(p => p.policyStatus === 1).length;
        this.recentPolicies = [...policies].sort((a, b) => b.policyId - a.policyId).slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load policies for staff dashboard:', e)
    });

    // Customers
    this.customerService.getAll().subscribe({
      next: (res) => {
        this.totalCustomers = (res.data || []).length;
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load customers for staff dashboard:', e)
    });

    // Payments
    this.paymentService.getAll().subscribe({
      next: (res) => {
        const payments = res.data || [];
        this.totalRevenue = payments
          .filter(p => p.paymentStatus === 1)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        this.recentPayments = [...payments]
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
          .slice(0, 5);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.warn('Could not load payments for staff dashboard:', e);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    this.router.navigate(['/login']);
  }
}
