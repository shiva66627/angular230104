import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimDocument } from './claim-document';

describe('ClaimDocument', () => {
  let component: ClaimDocument;
  let fixture: ComponentFixture<ClaimDocument>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimDocument],
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimDocument);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
