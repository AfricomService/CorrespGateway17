import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { PersonCompanyFormService } from './person-company-form.service';
import { PersonCompanyService } from '../service/person-company.service';
import { IPersonCompany } from '../person-company.model';

import { PersonCompanyUpdateComponent } from './person-company-update.component';

describe('PersonCompany Management Update Component', () => {
  let comp: PersonCompanyUpdateComponent;
  let fixture: ComponentFixture<PersonCompanyUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let personCompanyFormService: PersonCompanyFormService;
  let personCompanyService: PersonCompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [PersonCompanyUpdateComponent],
      providers: [
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(PersonCompanyUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PersonCompanyUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    personCompanyFormService = TestBed.inject(PersonCompanyFormService);
    personCompanyService = TestBed.inject(PersonCompanyService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const personCompany: IPersonCompany = { id: 456 };

      activatedRoute.data = of({ personCompany });
      comp.ngOnInit();

      expect(comp.personCompany).toEqual(personCompany);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPersonCompany>>();
      const personCompany = { id: 123 };
      jest.spyOn(personCompanyFormService, 'getPersonCompany').mockReturnValue(personCompany);
      jest.spyOn(personCompanyService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ personCompany });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: personCompany }));
      saveSubject.complete();

      // THEN
      expect(personCompanyFormService.getPersonCompany).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(personCompanyService.update).toHaveBeenCalledWith(expect.objectContaining(personCompany));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPersonCompany>>();
      const personCompany = { id: 123 };
      jest.spyOn(personCompanyFormService, 'getPersonCompany').mockReturnValue({ id: null });
      jest.spyOn(personCompanyService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ personCompany: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: personCompany }));
      saveSubject.complete();

      // THEN
      expect(personCompanyFormService.getPersonCompany).toHaveBeenCalled();
      expect(personCompanyService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPersonCompany>>();
      const personCompany = { id: 123 };
      jest.spyOn(personCompanyService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ personCompany });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(personCompanyService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
