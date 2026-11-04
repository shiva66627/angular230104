import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClaimService } from '../../services/claim';
import { ClaimDocumentService } from '../../services/claim-document';

@Component({
  selector: 'app-staff-claim-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './claim-history.html',
  styleUrl: './claim-history.css',
})
export class ClaimHistory implements OnInit {
  private claimService = inject(ClaimService);
  private claimDocService = inject(ClaimDocumentService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  claims: any[] = [];
  searchText: string = '';
  selectedStatus: string = 'All';

  // Supporting docs modal
  selectedDocsClaim: any = null;
  claimDocuments: any[] = [];
  isLoadingDocs = false;
  docsError = '';

  claimStatus: any = {
    0: 'Pending',
    1: 'Approved',
    2: 'Rejected'
  };

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get totalPages(): number {
    return Math.ceil(this.getFilteredClaims().length / this.pageSize) || 1;
  }

  get startIndex(): number {
    return this.getFilteredClaims().length > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.getFilteredClaims().length);
  }

  get paginatedClaims(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.getFilteredClaims().slice(start, start + this.pageSize);
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

  onFilterChange() {
    this.currentPage = 1;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
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
      this.claimService.getAll().subscribe({
        next: (res) => {
          this.claims = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  openDocsModal(claim: any) {
    this.selectedDocsClaim = claim;
    this.claimDocuments = [];
    this.isLoadingDocs = true;
    this.docsError = '';
    this.cdr.detectChanges();

    if (isPlatformBrowser(this.platformId)) {
      this.claimDocService.getByClaim(claim.claimId).subscribe({
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

  getFilteredClaims() {
    let filtered = this.claims;

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(c =>
        (c.claimId && `clm-${c.claimId}`.toLowerCase().includes(term)) ||
        (c.claimNumber && `clm-${c.claimNumber}`.toLowerCase().includes(term)) ||
        (c.customerName && c.customerName.toLowerCase().includes(term)) ||
        (c.agentRemarks && c.agentRemarks.toLowerCase().includes(term)) ||
        (c.adminRemarks && c.adminRemarks.toLowerCase().includes(term)) ||
        (c.policyNumber && `pol-${c.policyNumber}`.toLowerCase().includes(term))
      );
    }

    if (this.selectedStatus !== 'All') {
      const statusValue = parseInt(this.selectedStatus, 10);
      filtered = filtered.filter(c => c.claimStatus === statusValue);
    }

    return filtered;
  }
}
