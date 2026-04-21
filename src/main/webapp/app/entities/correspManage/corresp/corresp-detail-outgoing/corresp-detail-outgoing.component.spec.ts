import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorrespDetailOutgoingComponent } from './corresp-detail-outgoing.component';

describe('CorrespDetailOutgoingComponent', () => {
  let component: CorrespDetailOutgoingComponent;
  let fixture: ComponentFixture<CorrespDetailOutgoingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CorrespDetailOutgoingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CorrespDetailOutgoingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
