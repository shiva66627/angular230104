import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClaimService } from '../../services/claim';
import { ClaimDocumentService } from '../../services/claim-document';

@Component({
  selector: 'app-staff-claims',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './claims.html',
  styleUrl: './claims.css',
})
export class Claims implements OnInit {
  private claimService = inject(ClaimService);
  private claimDocService = inject(ClaimDocumentService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  claims: any[] = [];
  searchText: string = '';
  selectedStatus: string = 'All';
  sortBy: string = 'default';
  
  selectedClaim: any = null;
  reviewRemarks: string = '';
  recommendedStatus: string = 'Approve';

  // Supporting documents modal state
  selectedDocsClaim: any = null;
  claimDocuments: any[] = [];
  isLoadingDocs: boolean = false;
  docsError: string = '';
  
  message = '';
  isSuccess = false;

  claimStatus: any = {
    0: 'Pending',
    1: 'Approved',
    2: 'Rejected'
  };

  ngOnInit() {
    this.loadClaims();
  }

  loadClaims() {
    if (isPlatformBrowser(this.platformId)) {
      this.claimService.getAll().subscribe({
        next: (res) => {
          this.claims = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  openReviewModal(claim: any) {
    this.selectedClaim = claim;
    this.reviewRemarks = claim.agentRemarks || '';
    this.recommendedStatus = 'Approve';
  }

  closeReviewModal() {
    this.selectedClaim = null;
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
          this.docsError = 'Unable to load documents for this claim.';
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

  isUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  getDaysSinceIncident(dateStr: string): number {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  setRemarksTemplate(text: string) {
    this.reviewRemarks = text;
  }

  setReuploadTemplate() {
    this.recommendedStatus = 'Reject';
    this.reviewRemarks = 'Missing clear proof or damage receipts. Please re-upload clearer photos or documents for re-evaluation.';
  }

  submitReview() {
    if (!this.selectedClaim) return;
    
    if (isPlatformBrowser(this.platformId)) {
      const payload = {
        claimId: this.selectedClaim.claimId,
        agentRemarks: this.reviewRemarks,
        recommendedStatus: this.recommendedStatus
      };

      this.claimService.review(payload).subscribe({
        next: (res) => {
          this.message = 'Claim reviewed successfully!';
          this.isSuccess = true;
          this.selectedClaim = null;
          this.loadClaims();
        },
        error: (err) => {
          this.message = err.error?.message || 'Error submitting review.';
          this.isSuccess = false;
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  getFilteredClaims() {
    let filtered = [...this.claims];

    // Filter by search text
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(c =>
        (c.claimId && `clm-${c.claimId}`.toLowerCase().includes(term)) ||
        (c.claimNumber && `clm-${c.claimNumber}`.toLowerCase().includes(term)) ||
        (c.policyId && `pol-${c.policyId}`.toLowerCase().includes(term)) ||
        (c.policyNumber && `pol-${c.policyNumber}`.toLowerCase().includes(term)) ||
        (c.customerName && c.customerName.toLowerCase().includes(term)) ||
        (c.claimReason && c.claimReason.toLowerCase().includes(term))
      );
    }

    // Filter by status dropdown
    if (this.selectedStatus !== 'All') {
      const statusValue = parseInt(this.selectedStatus, 10);
      filtered = filtered.filter(c => c.claimStatus === statusValue);
    }

    // Sort
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
