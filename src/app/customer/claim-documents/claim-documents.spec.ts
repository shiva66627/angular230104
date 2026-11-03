import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimDocuments } from './claim-documents';

describe('ClaimDocuments', () => {
  let component: ClaimDocuments;
  let fixture: ComponentFixture<ClaimDocuments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimDocuments],
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimDocuments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
