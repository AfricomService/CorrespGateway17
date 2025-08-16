import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { PersonCompanyDetailComponent } from './person-company-detail.component';

describe('PersonCompany Management Detail Component', () => {
  let comp: PersonCompanyDetailComponent;
  let fixture: ComponentFixture<PersonCompanyDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PersonCompanyDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ personCompany: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(PersonCompanyDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(PersonCompanyDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load personCompany on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.personCompany).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
