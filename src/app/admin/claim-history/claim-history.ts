import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaimHistoryService } from '../../services/claim-history';
import { ClaimDocumentService } from '../../services/claim-document';

@Component({
  selector: 'app-claim-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claim-history.html',
  styleUrl: './claim-history.css',
})
export class ClaimHistory implements OnInit {
  private service = inject(ClaimHistoryService);
  private claimDocService = inject(ClaimDocumentService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  history: any[] = [];
  claimStatuses = ['Pending', 'Approved', 'Rejected'];
  searchText = '';
  selectedStatus = 'All';

  // Supporting docs modal
  selectedDocsClaim: any = null;
  claimDocuments: any[] = [];
  isLoadingDocs = false;
  docsError = '';

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get paginatedHistory(): any[] {
    const list = this.getFilteredHistory();
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.getFilteredHistory().length / this.pageSize) || 1;
  }

  get startIndex(): number {
    const total = this.getFilteredHistory().length;
    return total > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.getFilteredHistory().length);
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
      this.load();
    }
  }

  load() {
    this.service.getAll().subscribe({
      next: (r) => {
        this.history = r.data || [];
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  openDocsModal(item: any) {
    this.selectedDocsClaim = item;
    this.claimDocuments = [];
    this.isLoadingDocs = true;
    this.docsError = '';
    this.cdr.detectChanges();

    if (isPlatformBrowser(this.platformId)) {
      this.claimDocService.getByClaim(item.claimId).subscribe({
        next: (res) => {
          this.isLoadingDocs = false;
          this.claimDocuments = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingDocs = false;
          this.docsError = 'Unable to load attached documents.';
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeDocsModal() {
    this.selectedDocsClaim = null;
    this.claimDocuments = [];
    this.docsError = '';
  }

  isUrl(val: string): boolean {
    return /^https?:\/\//i.test(val);
  }

  getStatus(item: any): { label: string; badgeClass: string; raw: number } {
    let raw = item?.status ?? item?.newStatus ?? item?.claimStatus;

    if (typeof raw === 'string' && /^\d+$/.test(raw)) {
      raw = parseInt(raw, 10);
    }

    if (raw === 0 || raw === 'Pending' || raw === 'pending') {
      return { label: 'Pending', badgeClass: 'bg-warning text-dark', raw: 0 };
    }
    if (raw === 1 || raw === 'Approved' || raw === 'approved') {
      return { label: 'Approved', badgeClass: 'bg-success text-white', raw: 1 };
    }
    if (raw === 2 || raw === 'Rejected' || raw === 'rejected') {
      return { label: 'Rejected', badgeClass: 'bg-danger text-white', raw: 2 };
    }

    // Fallback based on remarks if status property is missing
    const rem = (item?.remarks || '').toLowerCase();
    if (rem.includes('approved') || rem.includes('approve')) {
      return { label: 'Approved', badgeClass: 'bg-success text-white', raw: 1 };
    }
    if (rem.includes('rejected') || rem.includes('reject')) {
      return { label: 'Rejected', badgeClass: 'bg-danger text-white', raw: 2 };
    }
    if (rem.includes('submitted') || rem.includes('pending')) {
      return { label: 'Pending', badgeClass: 'bg-warning text-dark', raw: 0 };
    }

    return { label: 'Pending', badgeClass: 'bg-secondary text-white', raw: 0 };
  }

  getFilteredHistory() {
    let filtered = this.history;

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(h =>
        (h.claimId && `clm-${h.claimId}`.toLowerCase().includes(term)) ||
        (h.historyId && `his-${h.historyId}`.toLowerCase().includes(term)) ||
        (h.remarks && h.remarks.toLowerCase().includes(term)) ||
        (h.updatedBy && h.updatedBy.toLowerCase().includes(term))
      );
    }

    if (this.selectedStatus !== 'All') {
      const statusValue = parseInt(this.selectedStatus, 10);
      filtered = filtered.filter(h => this.getStatus(h).raw === statusValue);
    }

    return filtered;
  }
}
