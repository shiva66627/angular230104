import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ClaimDocumentService } from '../../services/claim-document';

@Component({
  selector: 'app-claim-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './claim-document.html',
  styleUrl: './claim-document.css',
})
export class ClaimDocument implements OnInit {
  private service = inject(ClaimDocumentService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  documents: any[] = [];
  claimIdControl = new FormControl<number | null>(null);

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
