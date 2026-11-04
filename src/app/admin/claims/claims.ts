import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaimService } from '../../services/claim';
import { ClaimDocumentService } from '../../services/claim-document';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claims.html',
  styleUrl: './claims.css',
})
export class Claims implements OnInit {
  private service = inject(ClaimService);
  private claimDocService = inject(ClaimDocumentService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  claims: any[] = [];
  claimStatuses = ['Pending', 'Approved', 'Rejected'];
  searchText = '';
  selectedStatus = 'All';
  sortBy = 'default';
  message = '';
  isSuccess = false;

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;

  get paginatedClaims(): any[] {
    const list = this.getFilteredClaims();
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.getFilteredClaims().length / this.pageSize) || 1;
  }

  get startIndex(): number {
    const total = this.getFilteredClaims().length;
    return total > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.getFilteredClaims().length);
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

  // Documents Modal State
  selectedDocsClaim: any = null;
  claimDocuments: any[] = [];
  isLoadingDocs = false;
  docsError = '';

  // Decision Modal State
  selectedClaimForDecision: any = null;
  decisionAction: 'approve' | 'reject' = 'approve';
  adminRemarks: string = '';
  isSubmittingDecision = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    }
  }

  load() {
    this.service.getAll().subscribe({
      next: (r) => {
        this.claims = r.data || [];
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });
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

  isStaffRejected(claim: any): boolean {
    if (!claim?.agentRemarks) return false;
    const r = claim.agentRemarks.toLowerCase();
    const hasRejectionOrReupload = r.includes('reject') || r.includes('re-upload') || r.includes('reupload') || r.includes('missing') || r.includes('proof');
    const hasBeenReuploaded = r.includes('[re-uploaded');
    return hasRejectionOrReupload && !hasBeenReuploaded;
  }

  openDecisionModal(claim: any, action: 'approve' | 'reject') {
    if (action === 'approve' && this.isStaffRejected(claim)) {
      this.message = 'Cannot approve this claim: Staff has rejected or requested document re-upload. The customer must re-upload required proof first.';
      this.isSuccess = false;
      this.cdr.detectChanges();
      return;
    }
    this.selectedClaimForDecision = claim;
    this.decisionAction = action;
    if (action === 'approve') {
      this.adminRemarks = claim.agentRemarks && claim.agentRemarks !== 'None' 
        ? `Approved. Verified staff notes: "${claim.agentRemarks}". Settlement approved.`
        : 'Approved. Supporting documents verified against policy terms and incident report.';
    } else {
      this.adminRemarks = 'Claim rejected due to non-compliance with policy guidelines or missing documentation.';
    }
    this.cdr.detectChanges();
  }

  closeDecisionModal() {
    this.selectedClaimForDecision = null;
    this.adminRemarks = '';
    this.isSubmittingDecision = false;
  }

  submitDecision() {
    if (!this.selectedClaimForDecision || this.isSubmittingDecision) return;
    this.isSubmittingDecision = true;

    const statusValue = this.decisionAction === 'approve' ? 1 : 2;
    const payload = {
      claimId: this.selectedClaimForDecision.claimId,
      claimStatus: statusValue,
      adminRemarks: this.adminRemarks.trim() || (this.decisionAction === 'approve' ? 'Approved by Admin' : 'Rejected by Admin')
    };

    this.service.decide(payload).subscribe({
      next: () => {
        this.message = `Claim #${this.selectedClaimForDecision.claimNumber || this.selectedClaimForDecision.claimId} successfully ${this.decisionAction === 'approve' ? 'Approved' : 'Rejected'}!`;
        this.isSuccess = true;
        this.closeDecisionModal();
        this.load();
      },
      error: (e) => {
        this.message = 'Error submitting claim decision.';
        this.isSuccess = false;
        this.isSubmittingDecision = false;
        console.error(e);
        this.cdr.detectChanges();
      }
    });
  }

  getDaysSinceIncident(dateStr: string): number {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  getFilteredClaims() {
    let filtered = [...this.claims];

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(c =>
        (c.claimId && `clm-${c.claimId}`.toLowerCase().includes(term)) ||
        (c.claimNumber && `clm-${c.claimNumber}`.toLowerCase().includes(term)) ||
        (c.policyId && `pol-${c.policyId}`.toLowerCase().includes(term)) ||
        (c.policyNumber && `pol-${c.policyNumber}`.toLowerCase().includes(term)) ||
        (c.customerName && c.customerName.toLowerCase().includes(term)) ||
        (c.claimReason && c.claimReason.toLowerCase().includes(term)) ||
        (c.agentRemarks && c.agentRemarks.toLowerCase().includes(term))
      );
    }

    if (this.selectedStatus !== 'All') {
      const statusValue = parseInt(this.selectedStatus, 10);
      filtered = filtered.filter(c => c.claimStatus === statusValue);
    }

    if (this.sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
    } else if (this.sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.incidentDate).getTime() - new Date(b.incidentDate).getTime());
    } else if (this.sortBy === 'amount-desc') {
      filtered.sort((a, b) => b.claimAmount - a.claimAmount);
    } else if (this.sortBy === 'amount-asc') {
      filtered.sort((a, b) => a.claimAmount - b.claimAmount);
    }

    return filtered;
  }
}
