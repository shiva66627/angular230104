import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PremiumPaymentService } from '../../services/premium-payment';
import { Customer } from '../../services/customer';
import { PolicyService } from '../../services/policy';

@Component({
  selector: 'app-premium-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './premium-payments.html',
  styleUrl: './premium-payments.css',
})
export class PremiumPayments implements OnInit {
  private paymentService = inject(PremiumPaymentService);
  private customerService = inject(Customer);
  private policyService = inject(PolicyService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  payments: any[] = [];
  policies: any[] = [];
  customerId: number | null = null;

  selectedPolicyId = 0;
  selectedPolicyNumber = '';
  selectedPlanName = '';
  selectedAmount = 0;

  isLockedPolicy = false;
  isFromPurchase = false;
  isSubmitting = false;
  showPolicySelector = false;

  message = '';
  isSuccess = false;

  policyNameMap = new Map<number | string, string>();

  // Payment History Pagination State
  currentPage: number = 1;
  pageSize: number = 6;

  get paginatedPayments(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.payments.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.payments.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return this.payments.length > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.payments.length);
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

  paymentModes = [
    { id: 0, label: '⚡ UPI (Google Pay, PhonePe, Paytm, BHIM)', short: 'UPI' },
    { id: 1, label: '💳 Credit / Debit Card (Visa, MasterCard, RuPay)', short: 'Card' },
    { id: 2, label: '🏦 Net Banking (All Major Indian Banks)', short: 'NetBanking' },
    { id: 3, label: '💵 Cash / Branch Deposit', short: 'Cash' }
  ];

  paymentForm = this.fb.group({
    policyId: [0, [Validators.required, Validators.min(1)]],
    amount: [0, [Validators.required, Validators.min(1)]],
    paymentMode: [0, Validators.required],
    transactionReferenceNo: ['', Validators.required]
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe(params => {
        if (params['policyId']) {
          this.selectedPolicyId = parseInt(params['policyId'], 10);
          this.isLockedPolicy = true;
        }
        if (params['policyNumber']) {
          this.selectedPolicyNumber = params['policyNumber'].toString();
        }
        if (params['planName']) {
          this.selectedPlanName = params['planName'];
        }
        if (params['amount']) {
          this.selectedAmount = parseFloat(params['amount']);
        }
        if (params['fromPurchase'] === 'true') {
          this.isFromPurchase = true;
        }

        if (this.selectedPolicyId && this.selectedPlanName) {
          this.policyNameMap.set(this.selectedPolicyId, this.selectedPlanName);
        }
        if (this.selectedPolicyNumber && this.selectedPlanName) {
          this.policyNameMap.set(this.selectedPolicyNumber, this.selectedPlanName);
        }

        this.generateNewTxnRef();
        this.syncFormValues();
      });

      const userIdStr = localStorage.getItem('userId');
      if (userIdStr) {
        this.customerService.getByUserId(parseInt(userIdStr, 10)).subscribe({
          next: (res) => {
            if (res.data) {
              this.customerId = res.data.customerId;
              this.loadPolicies();
              this.loadPayments();
            }
          },
          error: (err) => console.error('Error fetching customer profile:', err)
        });
      }
    }
  }

  loadPolicies() {
    if (this.customerId) {
      this.policyService.getByCustomerId(this.customerId).subscribe({
        next: (res) => {
          this.policies = res.data || [];
          
          // Index policy names
          this.policies.forEach((pol: any) => {
            if (pol.policyId && pol.planName) {
              this.policyNameMap.set(pol.policyId, pol.planName);
            }
            if (pol.policyNumber && pol.planName) {
              this.policyNameMap.set(pol.policyNumber, pol.planName);
              this.policyNameMap.set(pol.policyNumber.toString(), pol.planName);
            }
          });

          // Match selected policy or default to first
          if (this.selectedPolicyId) {
            const match = this.policies.find(p => p.policyId === this.selectedPolicyId);
            if (match) {
              this.selectedPolicyNumber = match.policyNumber.toString();
              if (!this.selectedPlanName) this.selectedPlanName = match.planName;
              if (!this.selectedAmount) this.selectedAmount = match.premiumAmount;
            }
          } else if (this.policies.length > 0) {
            const first = this.policies[0];
            this.selectPolicy(first.policyId);
          }

          this.syncFormValues();
          this.enrichPayments();
          this.cdr.detectChanges();
        },
        error: (e) => console.error('Error loading policies:', e)
      });
    }
  }

  loadPayments() {
    if (this.customerId) {
      this.paymentService.getByCustomerId(this.customerId).subscribe({
        next: (res: any) => {
          this.payments = res.data || [];
          this.enrichPayments();
          this.cdr.detectChanges();
        },
        error: (e: any) => console.error('Error loading payments:', e)
      });
    }
  }

  enrichPayments() {
    if (this.payments && this.payments.length) {
      this.payments = this.payments.map((p: any) => {
        let dateVal = p.paymentDate;
        if (typeof dateVal === 'string' && !dateVal.endsWith('Z') && !dateVal.includes('+')) {
          dateVal = dateVal + 'Z';
        }
        return {
          ...p,
          paymentDate: dateVal,
          planName: this.getPlanName(p)
        };
      });
    }
  }

  getPlanName(p: any): string {
    if (p.planName && p.planName !== 'Insurance Plan' && p.planName !== 'Standard Insurance') {
      return p.planName;
    }
    const match = this.policies.find(po => po.policyId === p.policyId || po.policyNumber == p.policyNumber);
    if (match && match.planName) return match.planName;
    if (this.policyNameMap.has(p.policyId)) return this.policyNameMap.get(p.policyId)!;
    if (p.policyNumber && this.policyNameMap.has(p.policyNumber)) return this.policyNameMap.get(p.policyNumber)!;
    if (p.policyNumber && this.policyNameMap.has(p.policyNumber.toString())) return this.policyNameMap.get(p.policyNumber.toString())!;
    if (this.selectedPolicyId === p.policyId && this.selectedPlanName) return this.selectedPlanName;
    return 'Standard Protection';
  }

  getNextDueDate(payment: any): Date | null {
    if (!payment) return null;

    // Find associated policy
    const policy = this.policies.find(po =>
      (payment.policyId && po.policyId === payment.policyId) ||
      (payment.policyNumber && po.policyNumber == payment.policyNumber)
    );

    if (policy) {
      const planName = (policy.planName || '').toLowerCase();
      if (planName.includes('travel') || planName.includes('trip') || planName.includes('flight') || planName.includes('tour')) {
        return null;
      }

      if (policy.nextPremiumDueDate) {
        const d = new Date(policy.nextPremiumDueDate);
        if (!isNaN(d.getTime())) return d;
      }

      const baseDateStr = policy.startDate || payment.paymentDate;
      if (baseDateStr) {
        const baseDate = new Date(baseDateStr);
        if (!isNaN(baseDate.getTime())) {
          let intervalMonths = 12;
          const premType = policy.premiumType;
          if (premType === 0 || premType === 'Monthly') intervalMonths = 1;
          else if (premType === 1 || premType === 'Quarterly') intervalMonths = 3;
          else if (premType === 2 || premType === 'HalfYearly' || premType === 'Half-Yearly') intervalMonths = 6;
          else if (premType === 3 || premType === 'Yearly') intervalMonths = 12;

          const nextDate = new Date(baseDate);
          const now = new Date();
          while (nextDate <= now) {
            nextDate.setMonth(nextDate.getMonth() + intervalMonths);
          }
          return nextDate;
        }
      }
    }

    if (payment.paymentDate) {
      const nextDate = new Date(payment.paymentDate);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      return nextDate;
    }

    return null;
  }

  onPolicyDropdownChange(event: any) {
    const polId = parseInt(event.target.value, 10);
    this.selectPolicy(polId);
    this.showPolicySelector = false;
  }

  selectPolicy(polId: number) {
    const pol = this.policies.find(p => p.policyId === polId);
    if (pol) {
      this.selectedPolicyId = pol.policyId;
      this.selectedPolicyNumber = pol.policyNumber.toString();
      this.selectedPlanName = pol.planName;
      this.selectedAmount = pol.premiumAmount;
      this.policyNameMap.set(pol.policyId, pol.planName);
      this.policyNameMap.set(pol.policyNumber.toString(), pol.planName);
      this.syncFormValues();
      this.cdr.detectChanges();
    }
  }

  syncFormValues() {
    this.paymentForm.patchValue({
      policyId: this.selectedPolicyId || 0,
      amount: this.selectedAmount || 0,
    });
  }

  generateNewTxnRef() {
    const ref = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    this.paymentForm.patchValue({
      transactionReferenceNo: ref
    });
  }

  togglePolicySelector() {
    this.showPolicySelector = !this.showPolicySelector;
  }

  onSubmit() {
    if (this.paymentForm.invalid || !this.selectedPolicyId || this.selectedAmount <= 0) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.message = '';

    const payload = {
      policyId: this.selectedPolicyId,
      amount: this.selectedAmount,
      paymentMode: parseInt(this.paymentForm.value.paymentMode as any, 10),
      transactionReferenceNo: this.paymentForm.value.transactionReferenceNo || ('TXN-' + Math.floor(100000 + Math.random() * 900000))
    };

    this.paymentService.makePayment(payload).subscribe({
      next: () => {
        this.isSuccess = true;
        this.isSubmitting = false;
        this.isFromPurchase = false;
        this.message = `Payment of ₹${payload.amount.toLocaleString()} for POL-${this.selectedPolicyNumber} (${this.selectedPlanName}) completed successfully! Your policy is now active.`;
        
        if (this.selectedPlanName) {
          this.policyNameMap.set(payload.policyId, this.selectedPlanName);
          this.policyNameMap.set(this.selectedPolicyNumber, this.selectedPlanName);
        }

        this.generateNewTxnRef();
        this.loadPayments();
        this.loadPolicies();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSuccess = false;
        this.isSubmitting = false;
        const baseMsg: string = err?.error?.message || (err?.status === 0 ? 'Cannot reach server. Please try again.' : 'Failed to record payment.');
        this.message = baseMsg;
        this.cdr.detectChanges();
        if (baseMsg.toLowerCase().includes('duplicate') || baseMsg.toLowerCase().includes('already')) {
          this.paymentService.getNextDue(payload.policyId).subscribe({
            next: (res: any) => {
              const d = res?.data?.nextPremiumDueDate;
              if (d) {
                const dt = new Date(d).toLocaleDateString('en-GB');
                this.message = `Duplicate payment not allowed. POL-${this.selectedPolicyNumber} is already paid for this cycle. Next payment of ₹${(res.data.premiumAmount ?? this.selectedAmount).toLocaleString()} is due on ${dt}.`;
              }
              this.cdr.detectChanges();
            }
          });
        }
      }
    });
  }
}
