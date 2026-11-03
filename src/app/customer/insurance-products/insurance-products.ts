import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InsuranceProductService } from '../../services/insurance-product';

@Component({
  selector: 'app-insurance-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './insurance-products.html',
  styleUrl: './insurance-products.css',
})
export class InsuranceProducts implements OnInit {
  private service = inject(InsuranceProductService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  products: any[] = [];
  selectedCategory: number | null = null;

  categories = [
    { id: 0, name: 'Health Insurance', emoji: '💖', colorClass: 'health-card', description: 'Comprehensive health insurance for individuals and families.' },
    { id: 3, name: 'Travel Insurance', emoji: '✈️', colorClass: 'travel-card', description: 'Coverage for domestic and international travel.' },
    { id: 2, name: 'Life Insurance', emoji: '🛡️', colorClass: 'life-card', description: 'Long-term life protection plan.' },
    { id: 1, name: 'Motor Insurance', emoji: '🚗', colorClass: 'motor-card', description: 'Insurance coverage for cars and bikes.' }
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.service.getAll().subscribe({
        next: (res) => {
          this.products = (res.data || []).filter((p: any) => p.status === 1);
          this.cdr.detectChanges();
        },
        error: (e) => console.error(e)
      });
    }
  }

  selectCategory(catId: number | null) {
    this.selectedCategory = catId;
    this.cdr.detectChanges();
  }

  getFilteredProducts() {
    if (this.selectedCategory === null) {
      return [];
    }
    return this.products.filter(p => p.productType === this.selectedCategory);
  }

  getSelectedCategoryName() {
    const cat = this.categories.find(c => c.id === this.selectedCategory);
    return cat ? cat.name : '';
  }
}
