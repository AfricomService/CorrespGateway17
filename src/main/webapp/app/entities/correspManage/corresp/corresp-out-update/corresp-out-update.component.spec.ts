import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorrespOutUpdateComponent } from './corresp-out-update.component';

describe('CorrespOutUpdateComponent', () => {
  let component: CorrespOutUpdateComponent;
  let fixture: ComponentFixture<CorrespOutUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CorrespOutUpdateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CorrespOutUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
