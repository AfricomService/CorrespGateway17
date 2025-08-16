import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { PjDetailComponent } from './pj-detail.component';

describe('Pj Management Detail Component', () => {
  let comp: PjDetailComponent;
  let fixture: ComponentFixture<PjDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PjDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ pj: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(PjDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(PjDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load pj on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.pj).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
