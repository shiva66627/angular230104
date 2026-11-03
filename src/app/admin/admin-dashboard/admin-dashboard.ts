import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { User } from '../../services/user';
import { Customer } from '../../services/customer';
import { PolicyService } from '../../services/policy';
import { ClaimService } from '../../services/claim';
import { PremiumPaymentService } from '../../services/premium-payment';
import { InsuranceProductService } from '../../services/insurance-product';
import { PolicyPlanService } from '../../services/policy-plan';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private userService = inject(User);
  private customerService = inject(Customer);
  private policyService = inject(PolicyService);
  private claimService = inject(ClaimService);
  private paymentService = inject(PremiumPaymentService);
  private productService = inject(InsuranceProductService);
  private planService = inject(PolicyPlanService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  adminName = 'Administrator';
  adminEmail = 'admin@safeinsurance.com';
  currentDate = new Date();
  isLoading = true;
  activeTab: 'policies' | 'payments' | 'claims' = 'policies';

  // Metrics
  totalRevenue = 0;
  totalPolicies = 0;
  activePolicies = 0;
  pendingPolicies = 0;
  cancelledPolicies = 0;

  totalClaims = 0;
  pendingClaims = 0;
  approvedClaims = 0;
  rejectedClaims = 0;

  totalCustomers = 0;
  totalUsers = 0;
  staffUsers = 0;

  totalProducts = 0;
  totalPlans = 0;

  // Recent operational data
  recentPolicies: any[] = [];
  recentPayments: any[] = [];
  recentClaims: any[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('username');
      if (storedUser) {
        this.adminName = storedUser;
      }
      const storedEmail = localStorage.getItem('email');
      if (storedEmail) {
        this.adminEmail = storedEmail;
      }

      this.loadAllMetrics();
    }
  }

  loadAllMetrics() {
    this.isLoading = true;

    // 1. Policies
    this.policyService.getAll().subscribe({
      next: (res) => {
        const policies = res.data || [];
        this.totalPolicies = policies.length;
        this.activePolicies = policies.filter(p => p.policyStatus === 1).length;
        this.pendingPolicies = policies.filter(p => p.policyStatus === 0).length;
        this.cancelledPolicies = policies.filter(p => p.policyStatus === 3).length;
        this.recentPolicies = [...policies].sort((a, b) => b.policyId - a.policyId).slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load policies for admin dashboard:', e)
    });

    // 2. Payments / Revenue
    this.paymentService.getAll().subscribe({
      next: (res) => {
        const payments = res.data || [];
        this.totalRevenue = payments
          .filter(p => p.paymentStatus === 1)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        this.recentPayments = [...payments]
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
          .slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load payments for admin dashboard:', e)
    });

    // 3. Claims
    this.claimService.getAll().subscribe({
      next: (res) => {
        const claims = res.data || [];
        this.totalClaims = claims.length;
        this.pendingClaims = claims.filter(c => c.claimStatus === 0).length;
        this.approvedClaims = claims.filter(c => c.claimStatus === 1).length;
        this.rejectedClaims = claims.filter(c => c.claimStatus === 2).length;
        this.recentClaims = [...claims].sort((a, b) => b.claimId - a.claimId).slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load claims for admin dashboard:', e)
    });

    // 4. Customers
    this.customerService.getAll().subscribe({
      next: (res) => {
        this.totalCustomers = (res.data || []).length;
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load customers for admin dashboard:', e)
    });

    // 5. Users
    this.userService.getAll().subscribe({
      next: (res) => {
        const users = res.data || [];
        this.totalUsers = users.length;
        this.staffUsers = users.filter((u: any) => u.role === 1 || u.role === 'Staff').length;
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load users for admin dashboard:', e)
    });

    // 6. Products & Plans
    this.productService.getAll().subscribe({
      next: (res) => {
        this.totalProducts = (res.data || []).length;
        this.cdr.detectChanges();
      },
      error: (e) => console.warn('Could not load products for admin dashboard:', e)
    });

    this.planService.getAll().subscribe({
      next: (res) => {
        this.totalPlans = (res.data || []).length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.warn('Could not load plans for admin dashboard:', e);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'policies' | 'payments' | 'claims') {
    this.activeTab = tab;
  }

  logout() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    this.router.navigate(['/login']);
  }
}