import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { HistConsultFormService } from './hist-consult-form.service';
import { HistConsultService } from '../service/hist-consult.service';
import { IHistConsult } from '../hist-consult.model';

import { HistConsultUpdateComponent } from './hist-consult-update.component';

describe('HistConsult Management Update Component', () => {
  let comp: HistConsultUpdateComponent;
  let fixture: ComponentFixture<HistConsultUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let histConsultFormService: HistConsultFormService;
  let histConsultService: HistConsultService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [HistConsultUpdateComponent],
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
      .overrideTemplate(HistConsultUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(HistConsultUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    histConsultFormService = TestBed.inject(HistConsultFormService);
    histConsultService = TestBed.inject(HistConsultService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const histConsult: IHistConsult = { id: 456 };

      activatedRoute.data = of({ histConsult });
      comp.ngOnInit();

      expect(comp.histConsult).toEqual(histConsult);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IHistConsult>>();
      const histConsult = { id: 123 };
      jest.spyOn(histConsultFormService, 'getHistConsult').mockReturnValue(histConsult);
      jest.spyOn(histConsultService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ histConsult });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: histConsult }));
      saveSubject.complete();

      // THEN
      expect(histConsultFormService.getHistConsult).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(histConsultService.update).toHaveBeenCalledWith(expect.objectContaining(histConsult));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IHistConsult>>();
      const histConsult = { id: 123 };
      jest.spyOn(histConsultFormService, 'getHistConsult').mockReturnValue({ id: null });
      jest.spyOn(histConsultService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ histConsult: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: histConsult }));
      saveSubject.complete();

      // THEN
      expect(histConsultFormService.getHistConsult).toHaveBeenCalled();
      expect(histConsultService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IHistConsult>>();
      const histConsult = { id: 123 };
      jest.spyOn(histConsultService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ histConsult });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(histConsultService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
