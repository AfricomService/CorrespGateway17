import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { TypedocumentFormService } from './typedocument-form.service';
import { TypedocumentService } from '../service/typedocument.service';
import { ITypedocument } from '../typedocument.model';

import { TypedocumentUpdateComponent } from './typedocument-update.component';

describe('Typedocument Management Update Component', () => {
  let comp: TypedocumentUpdateComponent;
  let fixture: ComponentFixture<TypedocumentUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let typedocumentFormService: TypedocumentFormService;
  let typedocumentService: TypedocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [TypedocumentUpdateComponent],
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
      .overrideTemplate(TypedocumentUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(TypedocumentUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    typedocumentFormService = TestBed.inject(TypedocumentFormService);
    typedocumentService = TestBed.inject(TypedocumentService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const typedocument: ITypedocument = { id: 456 };

      activatedRoute.data = of({ typedocument });
      comp.ngOnInit();

      expect(comp.typedocument).toEqual(typedocument);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITypedocument>>();
      const typedocument = { id: 123 };
      jest.spyOn(typedocumentFormService, 'getTypedocument').mockReturnValue(typedocument);
      jest.spyOn(typedocumentService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ typedocument });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: typedocument }));
      saveSubject.complete();

      // THEN
      expect(typedocumentFormService.getTypedocument).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(typedocumentService.update).toHaveBeenCalledWith(expect.objectContaining(typedocument));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITypedocument>>();
      const typedocument = { id: 123 };
      jest.spyOn(typedocumentFormService, 'getTypedocument').mockReturnValue({ id: null });
      jest.spyOn(typedocumentService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ typedocument: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: typedocument }));
      saveSubject.complete();

      // THEN
      expect(typedocumentFormService.getTypedocument).toHaveBeenCalled();
      expect(typedocumentService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITypedocument>>();
      const typedocument = { id: 123 };
      jest.spyOn(typedocumentService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ typedocument });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(typedocumentService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
