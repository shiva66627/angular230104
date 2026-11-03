import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ClaimService } from '../../services/claim';
import { Customer } from '../../services/customer';
import { PolicyService } from '../../services/policy';
import { CloudinaryService } from '../../services/cloudinary';
import { ClaimDocumentService } from '../../services/claim-document';
import { FormsModule } from '@angular/forms';

function formatLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function incidentDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const inputDate = new Date(control.value);
  inputDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 20);
  minDate.setHours(0, 0, 0, 0);

  if (inputDate > today) {
    return { futureDate: true };
  }
  if (inputDate < minDate) {
    return { tooOld: true };
  }
  return null;
}

@Component({
  selector: 'app-my-claims',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './my-claims.html',
  styleUrl: './my-claims.css',
})
export class MyClaims implements OnInit {
  private claimService = inject(ClaimService);
  private customerService = inject(Customer);
  private policyService = inject(PolicyService);
  private cloudinaryService = inject(CloudinaryService);
  private claimDocService = inject(ClaimDocumentService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  claims: any[] = [];

  // Re-upload Modal State
  selectedReuploadClaim: any = null;
  reuploadDocs: string[] = [];
  reuploadInputUrl: string = '';
  isUploadingReupload = false;
  reuploadError = '';
  isSubmittingReupload = false;

  needsReupload(claim: any): boolean {
    if (!claim || claim.claimStatus !== 0 || !claim.agentRemarks) return false;
    const r = claim.agentRemarks.toLowerCase();
    const hasFlag = r.includes('reject') || r.includes('re-upload') || r.includes('reupload') || r.includes('proof') || r.includes('missing');
    const isAlreadyReuploaded = r.includes('[re-uploaded');
    return hasFlag && !isAlreadyReuploaded;
  }

  isAwaitingReevaluation(claim: any): boolean {
    if (!claim || claim.claimStatus !== 0 || !claim.agentRemarks) return false;
    return claim.agentRemarks.toLowerCase().includes('[re-uploaded');
  }

  openReuploadModal(claim: any) {
    this.selectedReuploadClaim = claim;
    this.reuploadDocs = [];
    this.reuploadInputUrl = '';
    this.reuploadError = '';
    this.isSubmittingReupload = false;
    this.cdr.detectChanges();
  }

  closeReuploadModal() {
    this.selectedReuploadClaim = null;
    this.reuploadDocs = [];
    this.reuploadInputUrl = '';
    this.reuploadError = '';
    this.isSubmittingReupload = false;
    this.cdr.detectChanges();
  }

  onReuploadFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      this.reuploadError = 'File size exceeds 10MB limit.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }
    this.isUploadingReupload = true;
    this.reuploadError = '';
    this.cdr.detectChanges();

    this.cloudinaryService.upload(file).subscribe({
      next: (res) => {
        this.isUploadingReupload = false;
        if (res.secure_url) {
          this.reuploadDocs.push(res.secure_url);
        }
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingReupload = false;
        this.reuploadError = 'Upload failed: ' + (err?.error?.error?.message || err?.message || 'Network error');
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  addReuploadDocUrl() {
    const url = this.reuploadInputUrl.trim();
    if (url) {
      this.reuploadDocs.push(url);
      this.reuploadInputUrl = '';
      this.cdr.detectChanges();
    }
  }

  removeReuploadDoc(index: number) {
    this.reuploadDocs.splice(index, 1);
    this.cdr.detectChanges();
  }

  submitReupload() {
    if (!this.selectedReuploadClaim || this.reuploadDocs.length === 0 || this.isSubmittingReupload) {
      return;
    }
    this.isSubmittingReupload = true;
    this.reuploadError = '';

    const claimId = this.selectedReuploadClaim.claimId;
    let completed = 0;
    let hasError = false;

    this.reuploadDocs.forEach(docUrl => {
      const payload = {
        claimId: claimId,
        documentName: this.getDocDisplayName(docUrl) || 'Updated Supporting Evidence',
        documentType: 'Supporting Evidence',
        field: docUrl,
        documentReference: 0
      };

      this.claimDocService.upload(payload).subscribe({
        next: () => {
          completed++;
          if (completed === this.reuploadDocs.length && !hasError) {
            this.isSubmittingReupload = false;
            this.message = 'Updated documents successfully submitted! Staff has been notified for re-evaluation.';
            this.isSuccess = true;
            this.closeReuploadModal();
            this.loadClaims();
          }
        },
        error: (err) => {
          hasError = true;
          this.isSubmittingReupload = false;
          this.reuploadError = err.error?.message || 'Error submitting document.';
          this.cdr.detectChanges();
        }
      });
    });
  }

  policies: any[] = [];
  customerId: number | null = null;
  supportingDocs: string[] = [];

  // Incident date must be between 20 days ago and today
  todayDate = formatLocalYMD(new Date());
  minIncidentDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 20);
    return formatLocalYMD(d);
  })();

  selectedPolicyNumber = '';
  selectedPolicyCoverage: number | null = null;
  selectedPolicy: any = null;
  isPolicyInWaitingPeriod: boolean = false;
  waitingPeriodRemainingDays: number = 0;
  waitingPeriodEligibleDate: Date | null = null;

  incidentDateStatus: 'none' | 'ok' | 'error' = 'none';
  incidentDateMessage: string = '';
  parsedIncidentDateIso: string = '';


  isUploading = false;
  uploadError = '';
  
  claimForm = this.fb.group({
    policyId: [0, [Validators.required, (control: AbstractControl) => (!control.value || control.value === 0) ? { required: true } : null]],
    claimAmount: [0, [Validators.required, Validators.min(1)]],
    claimReason: ['', Validators.required],
    incidentDate: ['', Validators.required],
    docInput: ['']
  });

  message = '';
  isSuccess = false;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.uploadError = 'File size exceeds 10MB limit.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.isUploading = true;
    this.uploadError = '';
    this.cdr.detectChanges();

    this.cloudinaryService.upload(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        if (res.secure_url) {
          this.supportingDocs.push(res.secure_url);
        }
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploading = false;
        const msg = err?.error?.error?.message || err?.message || 'Check network connection or upload preset';
        this.uploadError = 'Cloudinary upload failed: ' + msg;
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  isUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  getDocDisplayName(doc: string): string {
    if (!doc) return '';
    if (this.isUrl(doc)) {
      try {
        const parts = doc.split('/');
        const filename = parts[parts.length - 1];
        return decodeURIComponent(filename);
      } catch {
        return doc;
      }
    }
    return doc;
  }

  addDoc() {
    const value = this.claimForm.value.docInput;
    if (value && value.trim()) {
      this.supportingDocs.push(value.trim());
      this.claimForm.patchValue({ docInput: '' });
      this.cdr.detectChanges();
    }
  }

  removeDoc(index: number) {
    this.supportingDocs.splice(index, 1);
    this.cdr.detectChanges();
  }

  getWaitingDays(policy: any): number {
    if (!policy?.startDate) return 0;
    const start = new Date(policy.startDate);
    start.setHours(0, 0, 0, 0);
    const eligible = new Date(start);
    eligible.setDate(eligible.getDate() + 20);
    eligible.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((eligible.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  
  parseInputDate(val: string): Date | null {
    if (!val) return null;
    val = val.trim();
    const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
    const match = val.match(ddmmyyyy);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const d = new Date(year, month, day);
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d;
      }
      return null;
    }
    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
    const matchY = val.match(yyyymmdd);
    if (matchY) {
      const year = parseInt(matchY[1], 10);
      const month = parseInt(matchY[2], 10) - 1;
      const day = parseInt(matchY[3], 10);
      const d = new Date(year, month, day);
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d;
      }
    }
    return null;
  }

  validateIncidentDate(val: string) {
    if (!val || val.trim() === '') {
      this.incidentDateStatus = 'none';
      this.incidentDateMessage = '';
      this.parsedIncidentDateIso = '';
      return;
    }

    const d = this.parseInputDate(val);
    if (!d) {
      this.incidentDateStatus = 'error';
      this.incidentDateMessage = 'Invalid date. Please enter in DD-MM-YYYY format (e.g. 25-11-2026).';
      this.parsedIncidentDateIso = '';
      return;
    }

    if (!this.selectedPolicy) {
      this.incidentDateStatus = 'error';
      this.incidentDateMessage = 'Please select a policy first.';
      this.parsedIncidentDateIso = '';
      return;
    }

    const policyStart = new Date(this.selectedPolicy.startDate);
    policyStart.setHours(0, 0, 0, 0);

    const waitingEnd = new Date(policyStart);
    waitingEnd.setDate(waitingEnd.getDate() + 20);
    waitingEnd.setHours(0, 0, 0, 0);

    const incDate = new Date(d);
    incDate.setHours(0, 0, 0, 0);

    if (incDate < policyStart) {
      this.incidentDateStatus = 'error';
      this.incidentDateMessage = `Incident date cannot be before policy purchase date (${formatLocalYMD(policyStart)}).`;
      this.parsedIncidentDateIso = '';
      return;
    }

    if (incDate < waitingEnd) {
      const daysDiff = Math.ceil((waitingEnd.getTime() - incDate.getTime()) / (1000 * 60 * 60 * 24));
      this.incidentDateStatus = 'error';
      this.incidentDateMessage = `Initial 20-Day Waiting Period: Date is within 20 days of policy purchase. Must be on or after ${formatLocalYMD(waitingEnd)} (${daysDiff} day(s) remaining).`;
      this.parsedIncidentDateIso = '';
      return;
    }

    // Success: After 20 days
    this.incidentDateStatus = 'ok';
    this.incidentDateMessage = 'OK! Incident occurred after the 20-day waiting period. Claim is eligible.';
    this.parsedIncidentDateIso = d.toISOString();
  }

  onIncidentDateInput(event: any) {
    const val = event.target.value;
    this.validateIncidentDate(val);
  }

  updateSelectedPolicy() {
    const polId = Number(this.claimForm.get('policyId')?.value);
    if (polId && polId !== 0) {
      const match = this.policies.find(p => p.policyId === polId);
      if (match) {
        this.selectedPolicy = match;
        this.selectedPolicyNumber = `POL-${match.policyNumber}`;
        this.selectedPolicyCoverage = match.coverageAmount || null;

        const start = new Date(match.startDate);
        start.setHours(0, 0, 0, 0);
        const eligible = new Date(start);
        eligible.setDate(eligible.getDate() + 20);
        this.waitingPeriodEligibleDate = eligible;
        this.isPolicyInWaitingPeriod = false;

        const curDateVal = this.claimForm.get('incidentDate')?.value;
        if (curDateVal) {
          this.validateIncidentDate(curDateVal);
        }
        return;
      }
    }
    this.selectedPolicy = null;
    this.selectedPolicyNumber = '';
    this.selectedPolicyCoverage = null;
    this.isPolicyInWaitingPeriod = false;
    this.incidentDateStatus = 'none';
    this.incidentDateMessage = '';
  }

  ngOnInit() {
    this.claimForm.get('policyId')?.valueChanges.subscribe(() => {
      this.updateSelectedPolicy();
      this.cdr.detectChanges();
    });

    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe(params => {
        if (params['policyId']) {
          this.claimForm.patchValue({
            policyId: parseInt(params['policyId'], 10)
          });
          this.updateSelectedPolicy();
        }
      });

      const userIdStr = localStorage.getItem('userId');
      if (userIdStr) {
        this.customerService.getByUserId(parseInt(userIdStr, 10)).subscribe({
          next: (res) => {
            if (res.data) {
              this.customerId = res.data.customerId;
              this.loadClaims();
              this.loadPolicies();
            }
          }
        });
      }
    }
  }

  loadPolicies() {
    if (this.customerId) {
      this.policyService.getByCustomerId(this.customerId).subscribe({
        next: (res) => {
          this.policies = (res.data || []).filter((p: any) => p.policyStatus === 1);
          this.updateSelectedPolicy();
          this.cdr.detectChanges();
        },
        error: (e) => console.error(e)
      });
    }
  }

  loadClaims() {
    if (this.customerId) {
      this.claimService.getByCustomerId(this.customerId).subscribe({
        next: (res) => {
          this.claims = res.data;
          this.cdr.detectChanges();
        },
        error: (e) => console.error(e)
      });
    }
  }

  onSubmit() {
    const polId = Number(this.claimForm.value.policyId);
    if (this.incidentDateStatus !== 'ok') {
      this.message = this.incidentDateMessage || 'Please enter a valid incident date occurring after the 20-day waiting period.';
      this.isSuccess = false;
      return;
    }

    if (this.claimForm.invalid || !polId || polId === 0 || this.supportingDocs.length === 0) {
      this.claimForm.markAllAsTouched();
      if (!polId || polId === 0) {
        this.message = 'Please select a policy.';
        this.isSuccess = false;
        return;
      }
      if (this.supportingDocs.length === 0) {
        this.message = 'At least one supporting document reference is required.';
        this.isSuccess = false;
      }
      return;
    }

    const payload = {
      policyId: polId,
      claimAmount: this.claimForm.value.claimAmount,
      claimReason: this.claimForm.value.claimReason,
      incidentDate: this.parsedIncidentDateIso || this.claimForm.value.incidentDate,
      supportingDocuments: this.supportingDocs
    };

    this.claimService.submit(payload).subscribe({
      next: () => {
        this.isSuccess = true;
        this.message = 'Claim submitted successfully!';
        this.claimForm.reset({
          policyId: 0,
          claimAmount: 0,
          claimReason: '',
          incidentDate: '',
          docInput: ''
        });
        this.supportingDocs = [];
        this.selectedPolicyNumber = '';
        this.selectedPolicyCoverage = null;
        this.uploadError = '';
        this.loadClaims();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSuccess = false;
        let msg = err.error?.message;
        if (!msg && err.error?.errors && typeof err.error.errors === 'object') {
          const msgs: string[] = [];
          for (const k of Object.keys(err.error.errors)) {
            const v = err.error.errors[k];
            if (Array.isArray(v)) msgs.push(...v);
            else if (typeof v === 'string') msgs.push(v);
          }
          if (msgs.length > 0) msg = msgs.join(' | ');
        }
        this.message = msg || err.error?.title || 'Failed to submit claim.';
        this.cdr.detectChanges();
      }
    });
  }
}
