import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PolicyService } from '../../services/policy';
import { Customer } from '../../services/customer';
import { PolicyPlanService } from '../../services/policy-plan';

@Component({
  selector: 'app-my-policies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-policies.html',
  styleUrl: './my-policies.css',
})
export class MyPolicies implements OnInit {
  private policyService = inject(PolicyService);
  private customerService = inject(Customer);
  private planService = inject(PolicyPlanService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  policies: any[] = [];
  allPlans: any[] = [];
  customerId: number | null = null;
  customerProfile: any = null;
  selectedPolicyForCertificate: any = null;
  message = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAllPlans();

      const userIdStr = localStorage.getItem('userId');
      if (userIdStr) {
        this.customerService.getByUserId(parseInt(userIdStr, 10)).subscribe({
          next: (res) => {
            if (res.data) {
              this.customerId = res.data.customerId;
              this.customerProfile = res.data;
              this.loadPolicies();
            }
          },
          error: () => {
            this.message = 'Please complete your profile to view your policies.';
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  loadAllPlans() {
    this.planService.getAll().subscribe({
      next: (res) => {
        this.allPlans = res.data || [];
        if (this.policies.length > 0) {
          this.policies = this.policies.map(p => ({
            ...p,
            computedNextDueDate: this.calculateRenewalDate(p)
          }));
        }
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error fetching plans:', e)
    });
  }

  loadPolicies() {
    if (this.customerId) {
      this.policyService.getByCustomerId(this.customerId).subscribe({
        next: (res) => {
          this.policies = (res.data || []).map(p => ({
            ...p,
            computedNextDueDate: this.calculateRenewalDate(p)
          }));
          this.cdr.detectChanges();
        },
        error: (e) => console.error(e)
      });
    }
  }

  openCertificate(policy: any) {
    this.selectedPolicyForCertificate = policy;
    this.cdr.detectChanges();
  }

  closeCertificate() {
    this.selectedPolicyForCertificate = null;
    this.cdr.detectChanges();
  }

  printCertificate() {
    if (!isPlatformBrowser(this.platformId)) return;
    const printElement = document.getElementById('policy-certificate-print-area');
    if (!printElement) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1050,height=900');
    if (!printWindow) {
      // Fallback if browser blocks popup
      window.print();
      return;
    }

    const htmlContent = printElement.innerHTML;
    const policyNum = this.selectedPolicyForCertificate?.policyNumber || this.selectedPolicyForCertificate?.policyId || 'Certificate';

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Policy_Certificate_POL_${policyNum}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      background: #ffffff !important;
      color: #1e293b !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 10px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .certificate-wrapper {
      background: #ffffff;
      border: 3px double #1e3a8a;
      border-radius: 6px;
      padding: 22px;
      position: relative;
    }
    .watermark-overlay {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 4rem;
      font-weight: 900;
      color: rgba(30, 58, 138, 0.04);
      letter-spacing: 0.15em;
      pointer-events: none;
      white-space: nowrap;
      user-select: none;
      z-index: 1;
    }
    .cert-header {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 0.8rem;
      margin-bottom: 1rem;
    }
    .cert-stamp {
      width: 80px;
      height: 80px;
      border: 2px dashed #1e3a8a;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 0.62rem;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 auto;
    }
    .card {
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px !important;
      margin-bottom: 10px !important;
      break-inside: avoid;
      page-break-inside: avoid;
      background: #ffffff !important;
    }
    .card-header {
      background-color: #f1f5f9 !important;
      border-bottom: 1px solid #cbd5e1 !important;
      font-weight: 700;
      padding: 6px 12px !important;
    }
    .card-body {
      padding: 10px 14px !important;
    }
    .badge {
      border: 1px solid currentColor !important;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-wrapper">
    ${htmlContent}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  }

  getPlanTerms(policy: any): string {
    if (!policy) return '';
    const plan = this.allPlans.find(pl => pl.planId === policy.planId);
    if (plan?.termsConditions && plan.termsConditions.trim()) {
      return plan.termsConditions;
    }
    if (policy.termsConditions && policy.termsConditions.trim()) {
      return policy.termsConditions;
    }
    return '1. Incidents, injuries, or accidents occurring while under the influence of alcohol, non-prescribed drugs, or narcotics are strictly excluded.\n2. Standard 20-day notice rule applies for claim reporting from incident date.\n3. Pre-existing chronic conditions not disclosed during proposal are excluded.\n4. Intentional self-inflicted harm or participation in unauthorized speed contests is excluded.';
  }

  getCategoryName(policy: any): string {
    const meta = this.getPolicyMeta(policy);
    if (meta?.category) return meta.category;
    const name = `${policy.planName || ''}`.toLowerCase();
    if (name.includes('car') || name.includes('bike') || name.includes('vehicle') || name.includes('motor')) return 'Motor';
    if (name.includes('health') || name.includes('mediclaim') || name.includes('gold') || name.includes('padavo')) return 'Health';
    if (name.includes('travel') || name.includes('trip') || name.includes('flight') || name.includes('goibo')) return 'Travel';
    return 'Life';
  }

  getNextDueDate(policy: any): Date | null {
    if (!policy) return null;
    if (policy.computedNextDueDate) return policy.computedNextDueDate;
    return this.calculateRenewalDate(policy);
  }

  calculateRenewalDate(policy: any): Date | null {
    if (!policy) return null;
    if (this.getCategoryName(policy) === 'Travel') return null;

    // 1. If backend already calculated it
    if (policy.nextPremiumDueDate) {
      const d = new Date(policy.nextPremiumDueDate);
      if (!isNaN(d.getTime())) return d;
    }
    if (policy.NextPremiumDueDate) {
      const d = new Date(policy.NextPremiumDueDate);
      if (!isNaN(d.getTime())) return d;
    }

    // 2. Compute from startDate
    const startStr = policy.startDate || policy.StartDate;
    if (!startStr) return null;

    const start = new Date(startStr);
    if (isNaN(start.getTime())) return null;

    // Determine interval months based on plan frequency
    let intervalMonths = 12; // default yearly
    const plan = this.allPlans.find(pl => pl.planId === policy.planId);
    const premType = plan?.premiumType ?? policy.premiumType ?? policy.PremiumType;

    if (premType === 0 || premType === 'Monthly') intervalMonths = 1;
    else if (premType === 1 || premType === 'Quarterly') intervalMonths = 3;
    else if (premType === 2 || premType === 'HalfYearly' || premType === 'Half-Yearly') intervalMonths = 6;
    else if (premType === 3 || premType === 'Yearly') intervalMonths = 12;

    const nextDate = new Date(start);
    const now = new Date();

    // Advance by interval until future date
    while (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + intervalMonths);
    }

    // Check if beyond policy end date
    const endStr = policy.endDate || policy.EndDate;
    if (endStr) {
      const end = new Date(endStr);
      if (!isNaN(end.getTime()) && nextDate > end) {
        return null;
      }
    }

    return nextDate;
  }

  getPolicyMeta(policy: any): any | null {
    if (typeof localStorage === 'undefined' || !policy) return null;
    try {
      if (policy.policyNumber) {
        const item = localStorage.getItem(`policy_meta_${policy.policyNumber}`);
        if (item) return JSON.parse(item);
      }
      if (policy.policyId) {
        const item = localStorage.getItem(`policy_meta_id_${policy.policyId}`);
        if (item) return JSON.parse(item);
      }
      // fallback to vehicle
      const v = this.getVehicleInfo(policy);
      if (v) {
        return {
          category: 'Motor',
          vehicleType: v.vehicleType || 'Car',
          registrationNo: v.registrationNo,
          rcUrl: v.rcUrl,
          licenceUrl: v.licenceUrl
        };
      }
    } catch {
      return null;
    }
    return null;
  }

  getVehicleInfo(policy: any): any | null {
    if (typeof localStorage === 'undefined' || !policy) return null;
    try {
      if (policy.policyNumber) {
        const item = localStorage.getItem(`policy_vehicle_${policy.policyNumber}`);
        if (item) return JSON.parse(item);
      }
      if (policy.policyId) {
        const item = localStorage.getItem(`policy_vehicle_id_${policy.policyId}`);
        if (item) return JSON.parse(item);
      }
      const allStr = localStorage.getItem('registered_vehicles');
      if (allStr) {
        const list: any[] = JSON.parse(allStr);
        const match = list.find(v => v.policyNumber == policy.policyNumber || v.policyId == policy.policyId);
        if (match) return match;
      }
    } catch {
      return null;
    }
    return null;
  }

  getVehicleEmoji(type: string): string {
    if (!type) return '🚗';
    const lower = type.toLowerCase();
    if (lower.includes('bike')) return '🏍️';
    if (lower.includes('heavy') || lower.includes('load') || lower.includes('truck')) return '🚛';
    return '🚗';
  }

  payPremium(policy: any) {
    this.router.navigate(['/customer/premium-payments'], {
      queryParams: {
        policyId: policy.policyId,
        policyNumber: policy.policyNumber,
        planName: policy.planName,
        amount: policy.premiumAmount
      }
    });
  }

  raiseClaim(policy: any) {
    this.router.navigate(['/customer/my-claims'], { queryParams: { policyId: policy.policyId } });
  }
}
