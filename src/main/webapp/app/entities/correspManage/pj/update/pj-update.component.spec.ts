import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { PjFormService } from './pj-form.service';
import { PjService } from '../service/pj.service';
import { IPj } from '../pj.model';

import { PjUpdateComponent } from './pj-update.component';

describe('Pj Management Update Component', () => {
  let comp: PjUpdateComponent;
  let fixture: ComponentFixture<PjUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let pjFormService: PjFormService;
  let pjService: PjService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [PjUpdateComponent],
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
      .overrideTemplate(PjUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PjUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    pjFormService = TestBed.inject(PjFormService);
    pjService = TestBed.inject(PjService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should update editForm', () => {
      const pj: IPj = { id: 456 };

      activatedRoute.data = of({ pj });
      comp.ngOnInit();

      expect(comp.pj).toEqual(pj);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPj>>();
      const pj = { id: 123 };
      jest.spyOn(pjFormService, 'getPj').mockReturnValue(pj);
      jest.spyOn(pjService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ pj });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: pj }));
      saveSubject.complete();

      // THEN
      expect(pjFormService.getPj).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(pjService.update).toHaveBeenCalledWith(expect.objectContaining(pj));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPj>>();
      const pj = { id: 123 };
      jest.spyOn(pjFormService, 'getPj').mockReturnValue({ id: null });
      jest.spyOn(pjService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ pj: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: pj }));
      saveSubject.complete();

      // THEN
      expect(pjFormService.getPj).toHaveBeenCalled();
      expect(pjService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPj>>();
      const pj = { id: 123 };
      jest.spyOn(pjService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ pj });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(pjService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });
});
