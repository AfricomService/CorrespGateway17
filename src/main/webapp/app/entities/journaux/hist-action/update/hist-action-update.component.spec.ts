import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { HistActionFormService } from './hist-action-form.service';
import { HistActionService } from '../service/hist-action.service';
import { IHistAction } from '../hist-action.model';

import { HistActionUpdateComponent } from './hist-action-update.component';

describe('HistAction Management Update Component', () => {
  let comp: HistActionUpdateComponent;
  let fixture: ComponentFixture<HistActionUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let histActionFormService: HistActionFormService;
  let histActionService: HistActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [HistActionUpdateComponent],
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
      .overrideTemplate(HistActionUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(HistActionUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    histActionFormService = TestBed.inject(HistActionFormService);
    histActionService = TestBed.inject(HistActionService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const histAction: IHistAction = { id: 456 };

      activatedRoute.data = of({ histAction });
      comp.ngOnInit();

      expect(comp.histAction).toEqual(histAction);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IHistAction>>();
      const histAction = { id: 123 };
      jest.spyOn(histActionFormService, 'getHistAction').mockReturnValue(histAction);
      jest.spyOn(histActionService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ histAction });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: histAction }));
      saveSubject.complete();

      // THEN
      expect(histActionFormService.getHistAction).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(histActionService.update).toHaveBeenCalledWith(expect.objectContaining(histAction));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IHistAction>>();
      const histAction = { id: 123 };
      jest.spyOn(histActionFormService, 'getHistAction').mockReturnValue({ id: null });
      jest.spyOn(histActionService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ histAction: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: histAction }));
      saveSubject.complete();

      // THEN
      expect(histActionFormService.getHistAction).toHaveBeenCalled();
      expect(histActionService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IHistAction>>();
      const histAction = { id: 123 };
      jest.spyOn(histActionService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ histAction });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(histActionService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
