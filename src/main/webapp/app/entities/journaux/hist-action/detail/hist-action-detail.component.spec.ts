import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { HistActionDetailComponent } from './hist-action-detail.component';

describe('HistAction Management Detail Component', () => {
  let comp: HistActionDetailComponent;
  let fixture: ComponentFixture<HistActionDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistActionDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ histAction: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(HistActionDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(HistActionDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load histAction on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.histAction).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
