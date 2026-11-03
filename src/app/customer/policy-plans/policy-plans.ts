import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PolicyPlanService } from '../../services/policy-plan';
import { PolicyService } from '../../services/policy';
import { InsuranceProductService } from '../../services/insurance-product';
import { Customer } from '../../services/customer';
import { AuthService } from '../../services/auth';
import { CloudinaryService } from '../../services/cloudinary';

export interface RegisteredVehicle {
  vehicleType: 'Bike' | 'Car' | 'Heavy Vehicle' | string;
  registrationNo: string;
  rcUrl?: string;
  rcFileName?: string;
  licenceUrl?: string;
  licenceFileName?: string;
  policyNumber?: number | string;
  policyId?: number;
  planName?: string;
  customerId?: number | null;
  registeredAt?: string;
}

@Component({
  selector: 'app-customer-policy-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './policy-plans.html',
  styleUrl: './policy-plans.css',
})
export class PolicyPlans implements OnInit {
  private planService = inject(PolicyPlanService);
  private policyService = inject(PolicyService);
  private productService = inject(InsuranceProductService);
  private customerService = inject(Customer);
  private authService = inject(AuthService);
  private cloudinaryService = inject(CloudinaryService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  plans: any[] = [];
  allPlans: any[] = [];
  products: any[] = [];
  selectedCategory: number | null = null;
  selectedProductId: number | null = null;
  customerId: number | null = null;
  selectedPlanForPurchase: any = null;
  customerProfile: any = null;
  showProfileIncompleteModal: boolean = false;
  isPurchasing = false;
  message = '';
  isSuccess = false;
  sortBy = 'default';
  isLoading = true;

  // 1. MOTOR INSURANCE STATE
  vehicleTypes = [
    { type: 'Bike', label: 'Bike', subtitle: 'Two Wheeler', icon: '🏍️' },
    { type: 'Car', label: 'Car', subtitle: 'Four Wheeler', icon: '🚗' },
    { type: 'Heavy Vehicle', label: 'Heavy Vehicle', subtitle: 'Commercial / Heavy Load', icon: '🚛' }
  ];
  selectedVehicleType: string = 'Bike';
  vehicleRegistrationNo: string = '';
  regNoError: string = '';

  isUploadingRc: boolean = false;
  uploadedRcUrl: string = '';
  rcFileName: string = '';
  rcUploadError: string = '';

  isUploadingLicence: boolean = false;
  uploadedLicenceUrl: string = '';
  licenceFileName: string = '';
  licenceUploadError: string = '';

  // 2. HEALTH INSURANCE STATE
  healthCoverageType: 'Individual' | 'Family Floater' = 'Individual';
  healthInsuredAge: number = 30;
  healthNomineeName: string = '';
  healthNomineeRelation: string = 'Spouse';
  healthConditionDiabetes: boolean = false;
  healthConditionBP: boolean = false;
  healthConditionSurgery: boolean = false;

  isUploadingHealthDoc: boolean = false;
  uploadedHealthDocUrl: string = '';
  healthDocFileName: string = '';
  healthDocUploadError: string = '';

  // 3. TERM / LIFE INSURANCE STATE
  termSmokerStatus: 'Non-Smoker' | 'Smoker' = 'Non-Smoker';
  termAnnualIncome: string = '₹5L - ₹10L';
  termOccupation: string = 'Salaried';
  termNomineeName: string = '';
  termNomineeRelation: string = 'Spouse';
  termNomineeAge: number = 28;

  isUploadingTermDoc: boolean = false;
  uploadedTermDocUrl: string = '';
  termDocFileName: string = '';
  termDocUploadError: string = '';

  // 4. TRAVEL INSURANCE STATE
  travelTripType: 'Domestic' | 'International' = 'International';
  travelDestination: string = '';
  travelPassportNo: string = '';

  isUploadingTravelDoc: boolean = false;
  uploadedTravelDocUrl: string = '';
  travelDocFileName: string = '';
  travelDocUploadError: string = '';

  categories = [
    { id: 0, name: 'Health Insurance', emoji: '🏥' },
    { id: 1, name: 'Motor Insurance', emoji: '🚗' },
    { id: 2, name: 'Life Insurance', emoji: '🛡️' },
    { id: 3, name: 'Travel Insurance', emoji: '✈️' }
  ];

  premiumTypes: any = {
    0: { name: 'Monthly', value: 0 },
    1: { name: 'Quarterly', value: 1 },
    2: { name: 'Half-Yearly', value: 2 },
    3: { name: 'Yearly', value: 3 }
  };

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initSampleRegisteredVehicles();

      const userId = this.authService.getUserId();
      if (userId) {
        this.customerService.getByUserId(userId).subscribe({
          next: (res) => {
            if (res.data) {
              this.customerId = res.data.customerId;
              this.customerProfile = res.data;
            }
          },
          error: (err) => console.error('Error fetching customer profile:', err)
        });
      }

      this.productService.getAll().subscribe({
        next: (prodRes) => {
          this.products = prodRes.data || [];
          this.subscribeToParams();
        },
        error: () => {
          this.subscribeToParams();
        }
      });
    }
  }

  // Pre-seed sample registered vehicles so duplicate checks across types work immediately
  private initSampleRegisteredVehicles() {
    if (typeof localStorage === 'undefined') return;
    const existing = localStorage.getItem('registered_vehicles');
    if (!existing) {
      const sampleVehicles: RegisteredVehicle[] = [
        { vehicleType: 'Bike', registrationNo: 'AP09CD1111', planName: 'Existing Bike Policy', policyNumber: 443021 },
        { vehicleType: 'Car', registrationNo: 'TS08EF2222', planName: 'Existing Car Policy', policyNumber: 443022 },
        { vehicleType: 'Heavy Vehicle', registrationNo: 'KA01GH3333', planName: 'Existing Heavy Vehicle Policy', policyNumber: 443023 }
      ];
      localStorage.setItem('registered_vehicles', JSON.stringify(sampleVehicles));
    }
  }

  subscribeToParams() {
    this.route.queryParams.subscribe(params => {
      this.selectedProductId = params['productId'] !== undefined ? Number(params['productId']) : null;
      this.selectedCategory = params['category'] !== undefined ? Number(params['category']) : null;
      this.loadPlans();
    });
  }

  loadPlans() {
    this.isLoading = true;
    this.planService.getAll().subscribe({
      next: (res) => {
        let activePlans = (res.data || []).filter((p: any) => {
          if (p.planStatus !== 1) return false;
          const prod = this.products.find((pr: any) => pr.productId === p.productId);
          return !prod || prod.status === 1;
        });
        activePlans = activePlans.map((p: any) => {
          const prod = this.products.find((pr: any) => pr.productId === p.productId);
          return {
            ...p,
            productName: p.productName || (prod ? prod.productName : ''),
            productType: p.productType !== undefined ? p.productType : (prod ? prod.productType : undefined)
          };
        });
        this.allPlans = activePlans;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error(e);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setCategory(catId: number | null) {
    this.selectedCategory = catId;
    this.selectedProductId = null;
    this.applyFilter();
  }

  applyFilter() {
    let filtered = [...this.allPlans];
    if (this.selectedProductId !== null) {
      filtered = filtered.filter(p => p.productId === this.selectedProductId);
    } else if (this.selectedCategory !== null) {
      filtered = filtered.filter(p => {
        if (p.productType !== undefined && p.productType === this.selectedCategory) {
          return true;
        }
        const prod = this.products.find(pr => pr.productId === p.productId);
        return prod ? prod.productType === this.selectedCategory : false;
      });
    }
    this.plans = filtered;
    this.cdr.detectChanges();
  }

  getSelectedCategoryName(): string {
    if (this.selectedCategory === null) return '';
    const cat = this.categories.find(c => c.id === this.selectedCategory);
    return cat ? cat.name : '';
  }

  // Insurance type helper methods
  isMotorPlan(plan: any): boolean {
    if (!plan) return false;
    if (plan.productType === 1) return true;
    const name = `${plan.planName || ''} ${plan.productName || ''}`.toLowerCase();
    if (name.includes('travel') || name.includes('tour') || name.includes('trip') || name.includes('flight')) return false;
    return name.includes('motor') || name.includes('vehicle') || name.includes('car') || name.includes('bike') || name.includes('scooter');
  }

  isHealthPlan(plan: any): boolean {
    if (!plan) return false;
    if (plan.productType === 0) return true;
    const name = `${plan.planName || ''} ${plan.productName || ''}`.toLowerCase();
    return name.includes('health') || name.includes('mediclaim') || name.includes('medical') || name.includes('hospital');
  }

  isLifePlan(plan: any): boolean {
    if (!plan) return false;
    if (plan.productType === 2) return true;
    const name = `${plan.planName || ''} ${plan.productName || ''}`.toLowerCase();
    return name.includes('life') || name.includes('term') || name.includes('jeevan') || name.includes('suraksha');
  }

  isTravelPlan(plan: any): boolean {
    if (!plan) return false;
    if (plan.productType === 3) return true;
    const prod = this.products?.find(pr => pr.productId === plan.productId);
    if (prod && (prod.productType === 3 || `${prod.productName || ''}`.toLowerCase().includes('travel'))) return true;
    const name = `${plan.planName || ''} ${plan.productName || ''}`.toLowerCase();
    return name.includes('travel') || name.includes('tour') || name.includes('trip') || name.includes('flight') || name.includes('voyage');
  }

  
  isProfileComplete(): boolean {
    if (!this.customerProfile) return false;
    const c = this.customerProfile;
    if (!c.city || c.city === 'Not Updated' || c.city.trim() === '') return false;
    if (!c.address || c.address === 'Not Updated' || c.address.trim() === '') return false;
    if (!c.nomineeName || c.nomineeName === 'Not Updated' || c.nomineeName.trim() === '') return false;
    if (!c.pincode || c.pincode === '000000' || c.pincode.trim() === '') return false;
    return true;
  }

  openPurchaseModal(plan: any) {
    if (!this.isProfileComplete()) {
      this.showProfileIncompleteModal = true;
      this.cdr.detectChanges();
      return;
    }
    this.selectedPlanForPurchase = plan;
    this.message = '';
    this.resetAllForms();
    this.cdr.detectChanges();
  }

  cancelPurchaseModal() {
    if (!this.isPurchasing) {
      this.selectedPlanForPurchase = null;
      this.resetAllForms();
    }
  }

  resetAllForms() {
    // Motor
    this.selectedVehicleType = 'Bike';
    this.vehicleRegistrationNo = '';
    this.regNoError = '';
    this.isUploadingRc = false;
    this.uploadedRcUrl = '';
    this.rcFileName = '';
    this.rcUploadError = '';
    this.isUploadingLicence = false;
    this.uploadedLicenceUrl = '';
    this.licenceFileName = '';
    this.licenceUploadError = '';

    // Health
    this.healthCoverageType = 'Individual';
    this.healthInsuredAge = 30;
    this.healthNomineeName = '';
    this.healthNomineeRelation = 'Spouse';
    this.healthConditionDiabetes = false;
    this.healthConditionBP = false;
    this.healthConditionSurgery = false;
    this.isUploadingHealthDoc = false;
    this.uploadedHealthDocUrl = '';
    this.healthDocFileName = '';
    this.healthDocUploadError = '';

    // Term Life
    this.termSmokerStatus = 'Non-Smoker';
    this.termAnnualIncome = '₹5L - ₹10L';
    this.termOccupation = 'Salaried';
    this.termNomineeName = '';
    this.termNomineeRelation = 'Spouse';
    this.termNomineeAge = 28;
    this.isUploadingTermDoc = false;
    this.uploadedTermDocUrl = '';
    this.termDocFileName = '';
    this.termDocUploadError = '';

    // Travel
    this.travelTripType = 'International';
    this.travelDestination = '';
    this.travelPassportNo = '';
    this.isUploadingTravelDoc = false;
    this.uploadedTravelDocUrl = '';
    this.travelDocFileName = '';
    this.travelDocUploadError = '';
  }

  // Motor Vehicle Methods
  selectVehicleType(type: string) {
    this.selectedVehicleType = type;
    this.validateRegistrationNumber();
    this.cdr.detectChanges();
  }

  onRegNumberInput(event: any) {
    const val: string = event?.target?.value || '';
    this.vehicleRegistrationNo = val.toUpperCase().trim();
    this.validateRegistrationNumber();
  }

  getRegisteredVehicles(): RegisteredVehicle[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem('registered_vehicles');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveRegisteredVehicle(record: RegisteredVehicle) {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = this.getRegisteredVehicles();
      list.push(record);
      localStorage.setItem('registered_vehicles', JSON.stringify(list));
      if (record.policyNumber) {
        localStorage.setItem(`policy_vehicle_${record.policyNumber}`, JSON.stringify(record));
      }
      if (record.policyId) {
        localStorage.setItem(`policy_vehicle_id_${record.policyId}`, JSON.stringify(record));
      }
    } catch (e) {
      console.error('Error saving registered vehicle:', e);
    }
  }

  validateRegistrationNumber(): boolean {
    if (!this.isMotorPlan(this.selectedPlanForPurchase)) {
      this.regNoError = '';
      return true;
    }

    const raw = (this.vehicleRegistrationNo || '').trim().toUpperCase();
    if (!raw) {
      this.regNoError = 'Vehicle registration number is required.';
      return false;
    }

    const clean = raw.replace(/[\s-]/g, '');
    if (clean.length < 5 || clean.length > 14) {
      this.regNoError = 'Please enter a valid vehicle registration number (e.g. AP09CD1234).';
      return false;
    }

    const allRegistered = this.getRegisteredVehicles();
    const match = allRegistered.find(v => (v.registrationNo || '').replace(/[\s-]/g, '').toUpperCase() === clean);

    if (match) {
      this.regNoError = `Registration number '${raw}' is already registered as a ${match.vehicleType} (Policy: POL-${match.policyNumber || 'Existing'}). Bike, Car, and Heavy Vehicle registration numbers must not be the same!`;
      return false;
    }

    this.regNoError = '';
    return true;
  }

  // Upload RC Document to Cloudinary
  onRcFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.rcUploadError = 'File size exceeds 10MB limit.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.isUploadingRc = true;
    this.rcUploadError = '';
    this.cdr.detectChanges();

    this.cloudinaryService.upload(file).subscribe({
      next: (res) => {
        this.isUploadingRc = false;
        this.uploadedRcUrl = res.secure_url || res.url;
        this.rcFileName = file.name;
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingRc = false;
        const msg = err?.error?.error?.message || err?.message || 'Upload failed.';
        this.rcUploadError = 'RC upload failed: ' + msg;
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeRc() {
    this.uploadedRcUrl = '';
    this.rcFileName = '';
    this.rcUploadError = '';
    this.cdr.detectChanges();
  }

  // Upload Driving Licence to Cloudinary
  onLicenceFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.licenceUploadError = 'File size exceeds 10MB limit.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.isUploadingLicence = true;
    this.licenceUploadError = '';
    this.cdr.detectChanges();

    this.cloudinaryService.upload(file).subscribe({
      next: (res) => {
        this.isUploadingLicence = false;
        this.uploadedLicenceUrl = res.secure_url || res.url;
        this.licenceFileName = file.name;
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingLicence = false;
        const msg = err?.error?.error?.message || err?.message || 'Upload failed.';
        this.licenceUploadError = 'Licence upload failed: ' + msg;
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeLicence() {
    this.uploadedLicenceUrl = '';
    this.licenceFileName = '';
    this.licenceUploadError = '';
    this.cdr.detectChanges();
  }

  // Health Document Upload (Health Checkup / Govt ID)
  onHealthDocSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.healthDocUploadError = 'File size exceeds 10MB limit.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.isUploadingHealthDoc = true;
    this.healthDocUploadError = '';
    this.cdr.detectChanges();

    this.cloudinaryService.upload(file).subscribe({
      next: (res) => {
        this.isUploadingHealthDoc = false;
        this.uploadedHealthDocUrl = res.secure_url || res.url;
        this.healthDocFileName = file.name;
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingHealthDoc = false;
        const msg = err?.error?.error?.message || err?.message || 'Upload failed.';
        this.healthDocUploadError = 'Upload failed: ' + msg;
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeHealthDoc() {
    this.uploadedHealthDocUrl = '';
    this.healthDocFileName = '';
    this.healthDocUploadError = '';
    this.cdr.detectChanges();
  }

  // Term Life Document Upload (Income Proof / PAN / ID)
  onTermDocSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.termDocUploadError = 'File size exceeds 10MB limit.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.isUploadingTermDoc = true;
    this.termDocUploadError = '';
    this.cdr.detectChanges();

    this.cloudinaryService.upload(file).subscribe({
      next: (res) => {
        this.isUploadingTermDoc = false;
        this.uploadedTermDocUrl = res.secure_url || res.url;
        this.termDocFileName = file.name;
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingTermDoc = false;
        const msg = err?.error?.error?.message || err?.message || 'Upload failed.';
        this.termDocUploadError = 'Upload failed: ' + msg;
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeTermDoc() {
    this.uploadedTermDocUrl = '';
    this.termDocFileName = '';
    this.termDocUploadError = '';
    this.cdr.detectChanges();
  }

  // Travel Document Upload (Ticket / Visa / Passport)
  onTravelDocSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.travelDocUploadError = 'File size exceeds 10MB limit.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.isUploadingTravelDoc = true;
    this.travelDocUploadError = '';
    this.cdr.detectChanges();

    this.cloudinaryService.upload(file).subscribe({
      next: (res) => {
        this.isUploadingTravelDoc = false;
        this.uploadedTravelDocUrl = res.secure_url || res.url;
        this.travelDocFileName = file.name;
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingTravelDoc = false;
        const msg = err?.error?.error?.message || err?.message || 'Upload failed.';
        this.travelDocUploadError = 'Upload failed: ' + msg;
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  removeTravelDoc() {
    this.uploadedTravelDocUrl = '';
    this.travelDocFileName = '';
    this.travelDocUploadError = '';
    this.cdr.detectChanges();
  }

  canConfirmPurchase(): boolean {
    if (!this.selectedPlanForPurchase || this.isPurchasing) return false;

    if (this.isMotorPlan(this.selectedPlanForPurchase)) {
      if (!this.selectedVehicleType) return false;
      if (!this.vehicleRegistrationNo.trim() || !!this.regNoError) return false;
      if (!this.uploadedRcUrl || !this.uploadedLicenceUrl) return false;
      if (this.isUploadingRc || this.isUploadingLicence) return false;
    } else if (this.isHealthPlan(this.selectedPlanForPurchase)) {
      if (!this.healthNomineeName.trim()) return false;
      if (!this.healthNomineeRelation) return false;
      if (!this.uploadedHealthDocUrl || this.isUploadingHealthDoc) return false;
    } else if (this.isLifePlan(this.selectedPlanForPurchase)) {
      if (!this.termNomineeName.trim()) return false;
      if (!this.termNomineeRelation) return false;
      if (!this.termNomineeAge || this.termNomineeAge <= 0) return false;
      if (!this.uploadedTermDocUrl || this.isUploadingTermDoc) return false;
    } else if (this.isTravelPlan(this.selectedPlanForPurchase)) {
      if (!this.travelDestination.trim()) return false;
      if (!this.travelPassportNo.trim()) return false;
      if (!this.uploadedTravelDocUrl || this.isUploadingTravelDoc) return false;
    }

    return true;
  }

  confirmPurchase() {
    if (!this.isProfileComplete()) {
      this.showProfileIncompleteModal = true;
      this.message = 'Please complete your customer profile before purchasing a policy.';
      this.isSuccess = false;
      this.cdr.detectChanges();
      return;
    }
    if (!this.canConfirmPurchase()) return;
    const plan = this.selectedPlanForPurchase;

    // Motor insurance uniqueness check
    if (this.isMotorPlan(plan) && !this.validateRegistrationNumber()) {
      return;
    }

    this.isPurchasing = true;
    this.message = '';

    const executePurchase = () => {
      const payload = {
        planId: plan.planId,
        startDate: new Date().toISOString()
      };

      this.policyService.purchase(payload).subscribe({
        next: () => {
          this.isSuccess = true;
          this.message = 'Policy purchased successfully! Redirecting to payment...';

          const proceedToPayment = (newPolicy?: any) => {
            const policyNum = newPolicy?.policyNumber || '';
            const policyId = newPolicy?.policyId || 0;

            // Save domain metadata
            this.savePolicyMetadata(policyNum, policyId, plan);

            this.selectedPlanForPurchase = null;
            this.isPurchasing = false;
            this.resetAllForms();

            this.router.navigate(['/customer/premium-payments'], {
              queryParams: {
                policyId: policyId || '',
                policyNumber: policyNum || '',
                planName: plan.planName || newPolicy?.planName || '',
                amount: plan.premiumAmount || newPolicy?.premiumAmount || 0,
                fromPurchase: 'true'
              }
            });
          };

          if (this.customerId) {
            this.policyService.getByCustomerId(this.customerId).subscribe({
              next: (polRes) => {
                const customerPolicies = polRes.data || [];
                customerPolicies.sort((a: any, b: any) => b.policyId - a.policyId);
                const newPolicy = customerPolicies.find((pol: any) => pol.planId === plan.planId) || customerPolicies[0];
                proceedToPayment(newPolicy);
              },
              error: () => proceedToPayment()
            });
          } else {
            proceedToPayment();
          }
        },
        error: (err) => {
          this.isSuccess = false;
          this.isPurchasing = false;
          let errorMsg = '';
          if (err.status === 401) {
            errorMsg = 'Session expired. Please log in again.';
          } else if (err.status === 403) {
            errorMsg = 'Access denied (403). Your account does not have Customer purchasing permissions or your session needs to be refreshed. Please log in again.';
          } else if (err.status === 404) {
            errorMsg = 'Customer profile not found. Please complete your Customer Profile first!';
          } else if (err.error?.errors && typeof err.error.errors === 'object') {
            const msgs: string[] = [];
            for (const k of Object.keys(err.error.errors)) {
              const v = err.error.errors[k];
              if (Array.isArray(v)) msgs.push(...v);
              else if (typeof v === 'string') msgs.push(v);
            }
            if (msgs.length > 0) errorMsg = msgs.join(' | ');
          } else {
            errorMsg = err.error?.message || err.error?.Message || err.message || '';
          }
          this.message = errorMsg || 'Failed to purchase policy. Ensure your Customer Profile is complete!';
          this.selectedPlanForPurchase = null;
          this.cdr.detectChanges();
        }
      });
    };

    if (!this.customerId) {
      const uId = this.authService.getUserId();
      if (uId) {
        this.customerService.getByUserId(uId).subscribe({
          next: (res) => {
            if (res.data) {
              this.customerId = res.data.customerId;
            }
            executePurchase();
          },
          error: () => executePurchase()
        });
      } else {
        executePurchase();
      }
    } else {
      executePurchase();
    }
  }

  private savePolicyMetadata(policyNumber: any, policyId: any, plan: any) {
    if (typeof localStorage === 'undefined') return;
    try {
      let meta: any = null;

      if (this.isMotorPlan(plan)) {
        meta = {
          category: 'Motor',
          vehicleType: this.selectedVehicleType,
          registrationNo: this.vehicleRegistrationNo.trim().toUpperCase(),
          rcUrl: this.uploadedRcUrl,
          rcFileName: this.rcFileName,
          licenceUrl: this.uploadedLicenceUrl,
          licenceFileName: this.licenceFileName
        };
        this.saveRegisteredVehicle({
          vehicleType: this.selectedVehicleType,
          registrationNo: this.vehicleRegistrationNo.trim().toUpperCase(),
          rcUrl: this.uploadedRcUrl,
          licenceUrl: this.uploadedLicenceUrl,
          policyNumber: policyNumber,
          policyId: policyId,
          planName: plan.planName,
          customerId: this.customerId,
          registeredAt: new Date().toISOString()
        });
      } else if (this.isHealthPlan(plan)) {
        meta = {
          category: 'Health',
          coverageType: this.healthCoverageType,
          insuredAge: this.healthInsuredAge,
          nomineeName: this.healthNomineeName.trim(),
          nomineeRelation: this.healthNomineeRelation,
          hasDiabetes: this.healthConditionDiabetes,
          hasBP: this.healthConditionBP,
          hasSurgery: this.healthConditionSurgery,
          docUrl: this.uploadedHealthDocUrl,
          docFileName: this.healthDocFileName
        };
      } else if (this.isLifePlan(plan)) {
        meta = {
          category: 'Life',
          smokerStatus: this.termSmokerStatus,
          annualIncome: this.termAnnualIncome,
          occupation: this.termOccupation,
          nomineeName: this.termNomineeName.trim(),
          nomineeRelation: this.termNomineeRelation,
          nomineeAge: this.termNomineeAge,
          docUrl: this.uploadedTermDocUrl,
          docFileName: this.termDocFileName
        };
      } else if (this.isTravelPlan(plan)) {
        meta = {
          category: 'Travel',
          tripType: this.travelTripType,
          destination: this.travelDestination.trim(),
          passportNo: this.travelPassportNo.trim(),
          docUrl: this.uploadedTravelDocUrl,
          docFileName: this.travelDocFileName
        };
      }

      if (meta) {
        if (policyNumber) {
          localStorage.setItem(`policy_meta_${policyNumber}`, JSON.stringify(meta));
        }
        if (policyId) {
          localStorage.setItem(`policy_meta_id_${policyId}`, JSON.stringify(meta));
        }
      }
    } catch (e) {
      console.error('Error saving policy meta:', e);
    }
  }

  getFilteredSortedPlans() {
    let sorted = [...this.plans];
    if (this.sortBy === 'coverage-asc') {
      sorted.sort((a, b) => a.coverageAmount - b.coverageAmount);
    } else if (this.sortBy === 'coverage-desc') {
      sorted.sort((a, b) => b.coverageAmount - a.coverageAmount);
    } else if (this.sortBy === 'premium-asc') {
      sorted.sort((a, b) => a.premiumAmount - b.premiumAmount);
    } else if (this.sortBy === 'premium-desc') {
      sorted.sort((a, b) => b.premiumAmount - a.premiumAmount);
    }
    return sorted;
  }
}
