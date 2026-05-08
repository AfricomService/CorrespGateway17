import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorrespDetailIncomingComponent } from './corresp-detail-incoming.component';

describe('CorrespDetailIncomingComponent', () => {
  let component: CorrespDetailIncomingComponent;
  let fixture: ComponentFixture<CorrespDetailIncomingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CorrespDetailIncomingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CorrespDetailIncomingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
