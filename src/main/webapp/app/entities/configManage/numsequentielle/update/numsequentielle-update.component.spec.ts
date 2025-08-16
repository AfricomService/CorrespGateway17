import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { NumsequentielleFormService } from './numsequentielle-form.service';
import { NumsequentielleService } from '../service/numsequentielle.service';
import { INumsequentielle } from '../numsequentielle.model';

import { NumsequentielleUpdateComponent } from './numsequentielle-update.component';

describe('Numsequentielle Management Update Component', () => {
  let comp: NumsequentielleUpdateComponent;
  let fixture: ComponentFixture<NumsequentielleUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let numsequentielleFormService: NumsequentielleFormService;
  let numsequentielleService: NumsequentielleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [NumsequentielleUpdateComponent],
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
      .overrideTemplate(NumsequentielleUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NumsequentielleUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    numsequentielleFormService = TestBed.inject(NumsequentielleFormService);
    numsequentielleService = TestBed.inject(NumsequentielleService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const numsequentielle: INumsequentielle = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };

      activatedRoute.data = of({ numsequentielle });
      comp.ngOnInit();

      expect(comp.numsequentielle).toEqual(numsequentielle);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INumsequentielle>>();
      const numsequentielle = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(numsequentielleFormService, 'getNumsequentielle').mockReturnValue(numsequentielle);
      jest.spyOn(numsequentielleService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ numsequentielle });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: numsequentielle }));
      saveSubject.complete();

      // THEN
      expect(numsequentielleFormService.getNumsequentielle).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(numsequentielleService.update).toHaveBeenCalledWith(expect.objectContaining(numsequentielle));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INumsequentielle>>();
      const numsequentielle = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(numsequentielleFormService, 'getNumsequentielle').mockReturnValue({ id: null });
      jest.spyOn(numsequentielleService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ numsequentielle: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: numsequentielle }));
      saveSubject.complete();

      // THEN
      expect(numsequentielleFormService.getNumsequentielle).toHaveBeenCalled();
      expect(numsequentielleService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<INumsequentielle>>();
      const numsequentielle = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
      jest.spyOn(numsequentielleService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ numsequentielle });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(numsequentielleService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
