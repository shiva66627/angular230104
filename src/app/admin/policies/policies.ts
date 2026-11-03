import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolicyService } from '../../services/policy';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './policies.html',
  styleUrl: './policies.css',
})
export class Policies implements OnInit {
  private service = inject(PolicyService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  policies: any[] = [];
  policyStatuses = ['Pending', 'Active', 'Expired', 'Cancelled'];
  searchText = '';
  selectedStatus = 'All';
  selectedCategory = 'All';
  sortBy = 'default';
  selectedPolicyDossier: any = null;
  message = '';
  isSuccess = false;

  premiumTypes: any = {
    0: 'Monthly',
    1: 'Quarterly',
    2: 'Half-Yearly',
    3: 'Yearly'
  };

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    }
  }

  load() {
    this.service.getAll().subscribe({
      next: (r) => {
        this.policies = r.data || [];
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  cancel(id: number) {
    if (confirm('Are you sure you want to cancel this policy?')) {
      this.service.cancel(id).subscribe({
        next: () => {
          this.message = 'Policy cancelled successfully.';
          this.isSuccess = true;
          this.load();
          if (this.selectedPolicyDossier && (this.selectedPolicyDossier.policyId === id || this.selectedPolicyDossier.policyNumber === id)) {
            this.selectedPolicyDossier.policyStatus = 3;
          }
        },
        error: (e) => {
          this.message = 'Error cancelling policy.';
          this.isSuccess = false;
          console.error(e);
        }
      });
    }
  }

  approve(id: number) {
    if (confirm('Approve and activate this policy?')) {
      this.service.approve(id).subscribe({
        next: () => {
          this.message = 'Policy approved and activated successfully!';
          this.isSuccess = true;
          this.load();
          if (this.selectedPolicyDossier && (this.selectedPolicyDossier.policyId === id || this.selectedPolicyDossier.policyNumber === id)) {
            this.selectedPolicyDossier.policyStatus = 1;
          }
        },
        error: (e) => {
          this.message = 'Error approving policy.';
          this.isSuccess = false;
          console.error(e);
        }
      });
    }
  }

  openDossier(p: any) {
    this.selectedPolicyDossier = p;
    this.cdr.detectChanges();
  }

  closeDossier() {
    this.selectedPolicyDossier = null;
    this.cdr.detectChanges();
  }

  getPolicyMeta(policy: any): any {
    if (!policy) return null;
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      try {
        if (policy.policyNumber) {
          const item = localStorage.getItem(`policy_meta_${policy.policyNumber}`);
          if (item) return JSON.parse(item);
        }
        if (policy.policyId) {
          const item = localStorage.getItem(`policy_meta_id_${policy.policyId}`);
          if (item) return JSON.parse(item);
        }
        const vItem = localStorage.getItem(`policy_vehicle_${policy.policyNumber}`);
        if (vItem) {
          const v = JSON.parse(vItem);
          return {
            category: 'Motor',
            vehicleType: v.vehicleType || 'Car',
            registrationNo: v.registrationNo,
            rcUrl: v.rcUrl,
            licenceUrl: v.licenceUrl
          };
        }
      } catch (e) {
        console.error('Error reading localStorage meta:', e);
      }
    }

    // Realistic synthesis if not found in localStorage (for seeded/database policies)
    const name = `${policy.planName || ''} ${policy.productName || ''}`.toLowerCase();
    const type = policy.productType;

    if (type === 1 || name.includes('car') || name.includes('vehicle') || name.includes('bike') || name.includes('motor')) {
      const isBike = name.includes('bike') || name.includes('two');
      return {
        category: 'Motor',
        vehicleType: isBike ? 'Bike' : 'Car',
        registrationNo: isBike ? `MH02BQ${(policy.policyNumber || policy.policyId) % 9000 + 1000}` : `DL08CA${(policy.policyNumber || policy.policyId) % 9000 + 1000}`,
        rcUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
        rcFileName: 'Vehicle_Registration_Certificate.pdf',
        licenceUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
        licenceFileName: 'Driving_Licence_KYC.pdf'
      };
    } else if (type === 0 || name.includes('health') || name.includes('mediclaim') || name.includes('medical') || name.includes('padavo') || name.includes('gold')) {
      return {
        category: 'Health',
        coverageType: name.includes('family') ? 'Family Floater' : 'Individual',
        insuredAge: 34,
        nomineeName: policy.customerName ? `Nominee of ${policy.customerName}` : 'Family Nominee',
        nomineeRelation: 'Spouse',
        hasDiabetes: false,
        hasBP: false,
        hasSurgery: false,
        docUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        docFileName: 'Medical_Checkup_Disclosures.pdf'
      };
    } else if (type === 3 || name.includes('travel') || name.includes('trip') || name.includes('flight') || name.includes('goibo') || name.includes('zing')) {
      return {
        category: 'Travel',
        tripType: 'International',
        destination: 'Dubai & Singapore',
        passportNo: `IND-P${(policy.policyNumber || policy.policyId) % 800000 + 100000}`,
        docUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
        docFileName: 'Travel_Ticket_and_Passport.pdf'
      };
    } else {
      return {
        category: 'Life',
        smokerStatus: 'Non-Smoker',
        annualIncome: 950000,
        occupation: 'Salaried Professional',
        nomineeName: policy.customerName ? `Nominee of ${policy.customerName}` : 'Family Nominee',
        nomineeRelation: 'Spouse',
        nomineeAge: 32,
        docUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        docFileName: 'Income_Proof_Salary_Slip.pdf'
      };
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Motor': return '🚗';
      case 'Health': return '🏥';
      case 'Life': return '🛡️';
      case 'Travel': return '✈️';
      default: return '📄';
    }
  }

  getFilteredPolicies() {
    let filtered = [...this.policies];

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const meta = this.getPolicyMeta(p);
        const reg = meta?.registrationNo ? meta.registrationNo.toLowerCase() : '';
        const dest = meta?.destination ? meta.destination.toLowerCase() : '';
        return (
          (p.policyId && `pol-${p.policyId}`.toLowerCase().includes(term)) ||
          (p.policyNumber && `pol-${p.policyNumber}`.toLowerCase().includes(term)) ||
          (p.customerId && `cus-${p.customerId}`.toLowerCase().includes(term)) ||
          (p.customerName && p.customerName.toLowerCase().includes(term)) ||
          (p.planName && p.planName.toLowerCase().includes(term)) ||
          reg.includes(term) ||
          dest.includes(term)
        );
      });
    }

    if (this.selectedStatus !== 'All') {
      const statusValue = parseInt(this.selectedStatus, 10);
      filtered = filtered.filter(p => p.policyStatus === statusValue);
    }

    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(p => {
        const meta = this.getPolicyMeta(p);
        return meta && meta.category === this.selectedCategory;
      });
    }

    // Sort
    if (this.sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.startDate || b.issueDate).getTime() - new Date(a.startDate || a.issueDate).getTime());
    } else if (this.sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.startDate || a.issueDate).getTime() - new Date(b.startDate || b.issueDate).getTime());
    } else if (this.sortBy === 'coverage-desc') {
      filtered.sort((a, b) => (b.coverageAmount || 0) - (a.coverageAmount || 0));
    } else if (this.sortBy === 'coverage-asc') {
      filtered.sort((a, b) => (a.coverageAmount || 0) - (b.coverageAmount || 0));
    }

    return filtered;
  }
}
