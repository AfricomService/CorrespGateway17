import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { MyreportDetailComponent } from './myreport-detail.component';

describe('Myreport Management Detail Component', () => {
  let comp: MyreportDetailComponent;
  let fixture: ComponentFixture<MyreportDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyreportDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ myreport: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(MyreportDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(MyreportDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load myreport on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.myreport).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
