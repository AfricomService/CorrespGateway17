import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { BordereauxFormService } from './bordereaux-form.service';
import { BordereauxService } from '../service/bordereaux.service';
import { IBordereaux } from '../bordereaux.model';

import { BordereauxUpdateComponent } from './bordereaux-update.component';

describe('Bordereaux Management Update Component', () => {
  let comp: BordereauxUpdateComponent;
  let fixture: ComponentFixture<BordereauxUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let bordereauxFormService: BordereauxFormService;
  let bordereauxService: BordereauxService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [BordereauxUpdateComponent],
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
      .overrideTemplate(BordereauxUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(BordereauxUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    bordereauxFormService = TestBed.inject(BordereauxFormService);
    bordereauxService = TestBed.inject(BordereauxService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const bordereaux: IBordereaux = { id: 456 };

      activatedRoute.data = of({ bordereaux });
      comp.ngOnInit();

      expect(comp.bordereaux).toEqual(bordereaux);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IBordereaux>>();
      const bordereaux = { id: 123 };
      jest.spyOn(bordereauxFormService, 'getBordereaux').mockReturnValue(bordereaux);
      jest.spyOn(bordereauxService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ bordereaux });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: bordereaux }));
      saveSubject.complete();

      // THEN
      expect(bordereauxFormService.getBordereaux).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(bordereauxService.update).toHaveBeenCalledWith(expect.objectContaining(bordereaux));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IBordereaux>>();
      const bordereaux = { id: 123 };
      jest.spyOn(bordereauxFormService, 'getBordereaux').mockReturnValue({ id: null });
      jest.spyOn(bordereauxService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ bordereaux: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: bordereaux }));
      saveSubject.complete();

      // THEN
      expect(bordereauxFormService.getBordereaux).toHaveBeenCalled();
      expect(bordereauxService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IBordereaux>>();
      const bordereaux = { id: 123 };
      jest.spyOn(bordereauxService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ bordereaux });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(bordereauxService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
