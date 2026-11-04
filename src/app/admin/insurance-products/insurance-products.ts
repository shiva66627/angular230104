import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

import { InsuranceProductService } from '../../services/insurance-product';
import { IInsuranceProduct } from '../../Models/InsuranceProduct';
import { ProductType } from '../../Models/product-type';
import { ProductStatus } from '../../Models/product-status';

@Component({
  selector: 'app-insurance-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './insurance-products.html',
  styleUrl: './insurance-products.css'
})
export class InsuranceProducts implements OnInit {

  private productService = inject(InsuranceProductService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  products: IInsuranceProduct[] = [];
  searchText = '';
  selectedType = 'All';
  selectedStatus = 'All';
  
  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get paginatedProducts(): IInsuranceProduct[] {
    const list = this.getFilteredProducts();
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.getFilteredProducts().length / this.pageSize) || 1;
  }

  get startIndex(): number {
    const total = this.getFilteredProducts().length;
    return total > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.getFilteredProducts().length);
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

  // Modal & Form State
  showModal = false;
  isEditMode = false;
  currentProductId: number | null = null;
  currentProductStatus: ProductStatus = ProductStatus.Available;
  isLoading = false;
  
  // Enums for template
  ProductType = ProductType;
  ProductStatus = ProductStatus;
  
  productTypes = [
    { value: ProductType.Health, name: 'Health' },
    { value: ProductType.Motor, name: 'Motor' },
    { value: ProductType.Life, name: 'Life' },
    { value: ProductType.Travel, name: 'Travel' }
  ];
 
  productForm = new FormGroup({
    productName: new FormControl('', [Validators.required, Validators.minLength(10)]),
    productType: new FormControl<ProductType>(ProductType.Health, [Validators.required]),
    description: new FormControl('', [Validators.required])
  });
 
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProducts();
    }
  }
 
  loadProducts() {
    this.productService.getAll().subscribe({
      next: (response) => {
        this.products = response.data;
        this.isLoading = false;
        this.cdr.detectChanges(); // Force view update
      },
      error: (err) => {
        console.error('API Error:', err);
        this.isLoading = false;
      }
    });
  }
 
  openAddModal() {
    this.isEditMode = false;
    this.currentProductId = null;
    this.currentProductStatus = ProductStatus.Available;
    this.productForm.reset({ productType: ProductType.Health });
    this.showModal = true;
  }
 
  openEditModal(product: IInsuranceProduct) {
    this.isEditMode = true;
    this.currentProductId = product.productId;
    this.currentProductStatus = product.status ?? ProductStatus.Available;
    this.productForm.patchValue({
      productName: product.productName,
      productType: product.productType,
      description: product.description
    });
    this.showModal = true;
  }
 
  closeModal() {
    this.showModal = false;
    this.productForm.reset();
  }
 
  onSubmit() {
    if (this.productForm.invalid || this.isLoading) return;
 
    this.isLoading = true;
    const formValue = this.productForm.value;
    // DTO mapping
    const productPayload: any = {
      productName: formValue.productName,
      productType: Number(formValue.productType),
      description: formValue.description,
      status: this.isEditMode ? this.currentProductStatus : ProductStatus.Available
    };
 
    if (this.isEditMode && this.currentProductId) {
      this.productService.update(this.currentProductId, productPayload).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => {
          console.error('Update Error:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.productService.create(productPayload).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => {
          console.error('Create Error:', err);
          this.isLoading = false;
        }
      });
    }
  }
 
  deactivateProduct(id: number) {
    if (this.isLoading) return;
    if (confirm('Are you sure you want to deactivate this product?')) {
      this.isLoading = true;
      this.productService.deactivate(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          console.error('Deactivate Error:', err);
          this.isLoading = false;
        }
      });
    }
  }
 
  activateProduct(id: number) {
    if (this.isLoading) return;
    if (confirm('Are you sure you want to activate this product?')) {
      this.isLoading = true;
      this.productService.activate(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          console.error('Activate Error:', err);
          this.isLoading = false;
        }
      });
    }
  }

  getFilteredProducts() {
    let filtered = this.products;

    // Filter by search text
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.productId && `prd-${p.productId}`.toLowerCase().includes(term)) ||
        (p.productName && p.productName.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Filter by product type dropdown
    if (this.selectedType !== 'All') {
      const typeValue = parseInt(this.selectedType, 10);
      filtered = filtered.filter(p => p.productType === typeValue);
    }

    // Filter by status dropdown
    if (this.selectedStatus !== 'All') {
      const statusValue = parseInt(this.selectedStatus, 10);
      filtered = filtered.filter(p => p.status === statusValue);
    }

    return filtered;
  }
}