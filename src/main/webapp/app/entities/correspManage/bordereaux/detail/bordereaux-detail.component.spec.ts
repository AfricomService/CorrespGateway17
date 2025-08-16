import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { BordereauxDetailComponent } from './bordereaux-detail.component';

describe('Bordereaux Management Detail Component', () => {
  let comp: BordereauxDetailComponent;
  let fixture: ComponentFixture<BordereauxDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BordereauxDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ bordereaux: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(BordereauxDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(BordereauxDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load bordereaux on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.bordereaux).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
