import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { EmployeDetailComponent } from './employe-detail.component';

describe('Employe Management Detail Component', () => {
  let comp: EmployeDetailComponent;
  let fixture: ComponentFixture<EmployeDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmployeDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ employe: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(EmployeDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(EmployeDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load employe on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.employe).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
