import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PolicyService } from '../../services/policy';
import { Customer } from '../../services/customer';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-dashboard.html',
  styleUrl: './customer-dashboard.css'
})
export class CustomerDashboard implements OnInit {
  private router = inject(Router);
  private policyService = inject(PolicyService);
  private customerService = inject(Customer);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  customerName: string = 'Valued Customer';
  customerId: number | null = null;
  activePoliciesCount: number = 0;
  totalSumInsured: number = 0;
  isLoadingStats: boolean = true;

  // Real insurance product categories designed for purchasing
  featuredCategories = [
    {
      id: 0,
      name: 'Health Insurance',
      tag: 'Most Popular',
      tagType: 'popular',
      description: 'Comprehensive medical & hospitalization cover with cashless treatment at 10,000+ top hospitals.',
      sumInsured: 'Up to ₹1 Crore Cover',
      startingPrice: '₹499/mo',
      highlights: ['Cashless Hospitalization', 'Zero Waiting on Accidents', 'Tax Savings under 80D'],
      colorGradient: 'linear-gradient(135deg, #0061ff 0%, #60efff 100%)',
      badgeColor: '#0061ff',
      iconBg: '#eff6ff',
      iconColor: '#2563eb'
    },
    {
      id: 2,
      name: 'Life & Term Insurance',
      tag: 'Tax Saver 80C',
      tagType: 'tax',
      description: 'Guaranteed financial security for your family. Pure protection with high sum assured payouts.',
      sumInsured: 'Up to ₹2 Crore Cover',
      startingPrice: '₹399/mo',
      highlights: ['Financial Security for Family', 'Terminal Illness Cover', '100% Tax Free Payout'],
      colorGradient: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)',
      badgeColor: '#7928ca',
      iconBg: '#f5f3ff',
      iconColor: '#7c3aed'
    },
    {
      id: 1,
      name: 'Motor & Vehicle Insurance',
      tag: 'Instant Policy',
      tagType: 'instant',
      description: 'Zero-depreciation car and bike insurance with instant renewal and 24x7 roadside breakdown support.',
      sumInsured: '100% Cashless Garages',
      startingPrice: '₹180/mo',
      highlights: ['Zero Depreciation Add-on', '24x7 Roadside Assistance', 'Quick Digital Claims'],
      colorGradient: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)',
      badgeColor: '#e11d48',
      iconBg: '#fff1f2',
      iconColor: '#e11d48'
    },
    {
      id: 3,
      name: 'Travel & Global Insurance',
      tag: 'Worldwide',
      tagType: 'global',
      description: 'Stress-free domestic & international journeys covering medical emergencies, lost baggage and flight delays.',
      sumInsured: '150+ Countries Covered',
      startingPrice: '₹49/day',
      highlights: ['Medical & Dental Cover', 'Baggage Loss Protection', 'Schengen Visa Approved'],
      colorGradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
      badgeColor: '#059669',
      iconBg: '#ecfdf5',
      iconColor: '#059669'
    }
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const storedName = localStorage.getItem('fullName');
      if (storedName) {
        this.customerName = storedName;
      }
      this.loadCustomerStats();
    }
  }

  loadCustomerStats() {
    const userIdStr = localStorage.getItem('userId');
    if (!userIdStr) {
      this.isLoadingStats = false;
      return;
    }

    const userId = parseInt(userIdStr, 10);
    this.customerService.getByUserId(userId).subscribe({
      next: (res) => {
        if (res.data) {
          this.customerId = res.data.customerId;
          if (res.data.fullName) {
            this.customerName = res.data.fullName;
          }
          this.fetchPolicies();
        } else {
          this.isLoadingStats = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchPolicies() {
    if (!this.customerId) {
      this.isLoadingStats = false;
      return;
    }

    this.policyService.getByCustomerId(this.customerId).subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data)) {
          this.activePoliciesCount = res.data.filter((p: any) => p.policyStatus === 1 || p.status === 1 || p.policyStatus === 'Active' || p.status === 'Active' || p.status === 'Approved').length;
          this.totalSumInsured = res.data.reduce((acc, curr) => acc + (curr.coverageAmount || 0), 0);
        }
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingStats = false;
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
