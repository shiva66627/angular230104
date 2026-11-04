import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { PolicyPlanService } from '../../services/policy-plan';
import { InsuranceProductService } from '../../services/insurance-product';

@Component({
  selector: 'app-policy-plans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './policy-plans.html',
  styleUrl: './policy-plans.css',
})
export class PolicyPlans implements OnInit {
  private service = inject(PolicyPlanService);
  private productService = inject(InsuranceProductService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  plans: any[] = [];
  products: any[] = [];
  showModal = false;
  isEditMode = false;
  currentId: number | null = null;
  currentPlanStatus = 1;
  searchText = '';
  selectedStatus = 'All';
  isLoading = false;

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get paginatedPlans(): any[] {
    const list = this.getFilteredPlans();
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.getFilteredPlans().length / this.pageSize) || 1;
  }

  get startIndex(): number {
    const total = this.getFilteredPlans().length;
    return total > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.getFilteredPlans().length);
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

  premiumTypes = [
    { value: 0, name: 'Monthly' },
    { value: 1, name: 'Quarterly' },
    { value: 2, name: 'Half-Yearly' },
    { value: 3, name: 'Yearly' }
  ];
  planStatuses = [{ value: 0, name: 'Not Available' }, { value: 1, name: 'Available' }];

  planForm = new FormGroup({
    planName: new FormControl('', [Validators.required, Validators.minLength(10)]),
    productId: new FormControl<number | null>(null, Validators.required),
    coverageAmount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    premiumAmount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    premiumType: new FormControl(0, Validators.required),
    durationYears: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    termsConditions: new FormControl('', Validators.required),
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
      this.loadProducts();
    }
  }

  loadProducts() {
    this.productService.getAll().subscribe({
      next: (r) => { this.products = r.data || []; this.cdr.detectChanges(); },
      error: (e) => console.error(e)
    });
  }

  load() {
    this.service.getAll().subscribe({
      next: (r) => { this.plans = r.data || []; this.isLoading = false; this.cdr.detectChanges(); },
      error: (e) => { console.error(e); this.isLoading = false; }
    });
  }

  getProductName(productId: number): string {
    const prod = this.products.find(p => p.productId === productId);
    return prod ? prod.productName : '';
  }

  isTravelProductSelected(): boolean {
    const prodId = this.planForm.get('productId')?.value;
    if (!prodId) return false;
    const prod = this.products.find(p => p.productId === Number(prodId));
    if (!prod) return false;
    return prod.productType === 3 || (prod.productName && prod.productName.toLowerCase().includes('travel'));
  }

  isTravelPlan(p: any): boolean {
    if (!p) return false;
    if (p.productType === 3) return true;
    const name = `${p.planName || ''} ${p.productName || this.getProductName(p.productId) || ''}`.toLowerCase();
    return name.includes('travel') || name.includes('trip') || name.includes('flight') || name.includes('tour') || name.includes('bus');
  }

  onProductChange() {
    if (this.isTravelProductSelected()) {
      this.planForm.patchValue({
        premiumType: 3, // Stored as One-Time equivalent in DB
        durationYears: 1
      });
    }
  }

  openAdd() {
    this.isEditMode = false;
    this.currentId = null;
    this.currentPlanStatus = 1;
    this.planForm.reset({ premiumType: 0, durationYears: 1 });
    this.showModal = true;
  }

  openEdit(p: any) {
    this.isEditMode = true;
    this.currentId = p.planId;
    this.currentPlanStatus = p.planStatus ?? 1;
    this.planForm.patchValue({
      planName: p.planName,
      productId: p.productId,
      coverageAmount: p.coverageAmount,
      premiumAmount: p.premiumAmount,
      premiumType: p.premiumType,
      durationYears: p.durationYears || 1,
      termsConditions: p.termsConditions
    });
    this.showModal = true;
  }

  close() {
    this.showModal = false;
    this.planForm.reset();
  }

  submit() {
    if (this.planForm.invalid || this.isLoading) return;
    this.isLoading = true;
    const v = this.planForm.value;
    
    // For travel insurance, ensure duration is 1 (per trip) and premiumType is 3 (one-time)
    const isTravel = this.isTravelProductSelected();
    const payload = {
      planName: v.planName,
      productId: Number(v.productId),
      coverageAmount: Number(v.coverageAmount),
      premiumAmount: Number(v.premiumAmount),
      premiumType: isTravel ? 3 : Number(v.premiumType),
      durationYears: isTravel ? 1 : Number(v.durationYears),
      termsConditions: v.termsConditions,
      planStatus: this.isEditMode ? this.currentPlanStatus : 1
    };

    const obs = this.isEditMode && this.currentId ? this.service.update(this.currentId, payload) : this.service.create(payload);
    obs.subscribe({
      next: () => { this.load(); this.close(); },
      error: (e) => { console.error(e); this.isLoading = false; }
    });
  }

  deactivate(id: number) {
    if (this.isLoading) return;
    if (confirm('Deactivate this plan?')) {
      this.isLoading = true;
      this.service.deactivate(id).subscribe({
        next: () => this.load(),
        error: (e) => { console.error(e); this.isLoading = false; }
      });
    }
  }

  activate(id: number) {
    if (this.isLoading) return;
    if (confirm('Activate this plan?')) {
      this.isLoading = true;
      this.service.activate(id).subscribe({
        next: () => this.load(),
        error: (e) => { console.error(e); this.isLoading = false; }
      });
    }
  }

  getFilteredPlans() {
    let filtered = this.plans;

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.planId && `pln-${p.planId}`.toLowerCase().includes(term)) ||
        (p.planName && p.planName.toLowerCase().includes(term)) ||
        (p.productId && `prd-${p.productId}`.toLowerCase().includes(term)) ||
        (this.getProductName(p.productId) && this.getProductName(p.productId).toLowerCase().includes(term))
      );
    }

    if (this.selectedStatus !== 'All') {
      const statusValue = parseInt(this.selectedStatus, 10);
      filtered = filtered.filter(p => p.planStatus === statusValue);
    }

    return filtered;
  }
}
