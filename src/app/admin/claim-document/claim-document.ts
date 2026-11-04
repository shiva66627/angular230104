import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { ClaimDocumentService } from '../../services/claim-document';

@Component({
  selector: 'app-claim-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './claim-document.html',
  styleUrl: './claim-document.css',
})
export class ClaimDocument implements OnInit {
  private service = inject(ClaimDocumentService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  documents: any[] = [];
  claimIdControl = new FormControl<number | null>(null);

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get paginatedDocuments(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.documents.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.documents.length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return this.documents.length > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.documents.length);
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

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAll();
    }
  }

  loadAll() {
    this.service.getAll().subscribe({
      next: (r) => { this.documents = r.data || []; this.cdr.detectChanges(); },
      error: (e) => console.error(e)
    });
  }

  search() {
    const id = this.claimIdControl.value;
    if (!id) {
      this.loadAll();
      return;
    }
    this.service.getByClaim(id).subscribe({
      next: (r) => { this.documents = r.data || []; this.cdr.detectChanges(); },
      error: (e) => console.error(e)
    });
  }

  isUrl(val: string): boolean {
    if (!val) return false;
    const str = val.trim().toLowerCase();
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('www.') || str.startsWith('/');
  }

  getValidUrl(val: string): string {
    if (!val) return '#';
    const str = val.trim();
    if (str.startsWith('http://') || str.startsWith('https://')) {
      return str;
    }
    if (str.startsWith('www.')) {
      return 'https://' + str;
    }
    return str;
  }

  openLink(url: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const validUrl = this.getValidUrl(url);
    if (typeof window !== 'undefined') {
      window.open(validUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
