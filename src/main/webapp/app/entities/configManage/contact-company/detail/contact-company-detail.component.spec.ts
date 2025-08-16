import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ContactCompanyDetailComponent } from './contact-company-detail.component';

describe('ContactCompany Management Detail Component', () => {
  let comp: ContactCompanyDetailComponent;
  let fixture: ComponentFixture<ContactCompanyDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ContactCompanyDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ contactCompany: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(ContactCompanyDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(ContactCompanyDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load contactCompany on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.contactCompany).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
