import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { HistConsultDetailComponent } from './hist-consult-detail.component';

describe('HistConsult Management Detail Component', () => {
  let comp: HistConsultDetailComponent;
  let fixture: ComponentFixture<HistConsultDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistConsultDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ histConsult: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(HistConsultDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(HistConsultDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load histConsult on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.histConsult).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
