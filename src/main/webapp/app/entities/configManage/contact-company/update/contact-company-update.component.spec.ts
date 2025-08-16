import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { ContactCompanyFormService } from './contact-company-form.service';
import { ContactCompanyService } from '../service/contact-company.service';
import { IContactCompany } from '../contact-company.model';

import { ContactCompanyUpdateComponent } from './contact-company-update.component';

describe('ContactCompany Management Update Component', () => {
  let comp: ContactCompanyUpdateComponent;
  let fixture: ComponentFixture<ContactCompanyUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let contactCompanyFormService: ContactCompanyFormService;
  let contactCompanyService: ContactCompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [ContactCompanyUpdateComponent],
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
      .overrideTemplate(ContactCompanyUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ContactCompanyUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    contactCompanyFormService = TestBed.inject(ContactCompanyFormService);
    contactCompanyService = TestBed.inject(ContactCompanyService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const contactCompany: IContactCompany = { id: 456 };

      activatedRoute.data = of({ contactCompany });
      comp.ngOnInit();

      expect(comp.contactCompany).toEqual(contactCompany);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IContactCompany>>();
      const contactCompany = { id: 123 };
      jest.spyOn(contactCompanyFormService, 'getContactCompany').mockReturnValue(contactCompany);
      jest.spyOn(contactCompanyService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ contactCompany });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: contactCompany }));
      saveSubject.complete();

      // THEN
      expect(contactCompanyFormService.getContactCompany).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(contactCompanyService.update).toHaveBeenCalledWith(expect.objectContaining(contactCompany));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IContactCompany>>();
      const contactCompany = { id: 123 };
      jest.spyOn(contactCompanyFormService, 'getContactCompany').mockReturnValue({ id: null });
      jest.spyOn(contactCompanyService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ contactCompany: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: contactCompany }));
      saveSubject.complete();

      // THEN
      expect(contactCompanyFormService.getContactCompany).toHaveBeenCalled();
      expect(contactCompanyService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IContactCompany>>();
      const contactCompany = { id: 123 };
      jest.spyOn(contactCompanyService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ contactCompany });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(contactCompanyService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
