import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { SmtpConfigDetailComponent } from './smtp-config-detail.component';

describe('SmtpConfig Management Detail Component', () => {
  let comp: SmtpConfigDetailComponent;
  let fixture: ComponentFixture<SmtpConfigDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SmtpConfigDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ smtpConfig: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(SmtpConfigDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(SmtpConfigDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load smtpConfig on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.smtpConfig).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
