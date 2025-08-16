import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { ParentClassdefFormService } from './parent-classdef-form.service';
import { ParentClassdefService } from '../service/parent-classdef.service';
import { IParentClassdef } from '../parent-classdef.model';
import { INumsequentielle } from 'app/entities/configManage/numsequentielle/numsequentielle.model';
import { NumsequentielleService } from 'app/entities/configManage/numsequentielle/service/numsequentielle.service';

import { ParentClassdefUpdateComponent } from './parent-classdef-update.component';

describe('ParentClassdef Management Update Component', () => {
  let comp: ParentClassdefUpdateComponent;
  let fixture: ComponentFixture<ParentClassdefUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let parentClassdefFormService: ParentClassdefFormService;
  let parentClassdefService: ParentClassdefService;
  let numsequentielleService: NumsequentielleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [ParentClassdefUpdateComponent],
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
      .overrideTemplate(ParentClassdefUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ParentClassdefUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    parentClassdefFormService = TestBed.inject(ParentClassdefFormService);
    parentClassdefService = TestBed.inject(ParentClassdefService);
    numsequentielleService = TestBed.inject(NumsequentielleService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Numsequentielle query and add missing value', () => {
      const parentClassdef: IParentClassdef = { id: 456 };
      const sequenceId: INumsequentielle = { id: '87f14e97-6d22-4eb4-b28c-0b14d9f10c08' };
      parentClassdef.sequenceId = sequenceId;

      const numsequentielleCollection: INumsequentielle[] = [{ id: 'bf57e5bf-bddf-4a34-ae04-8d834fe0bf86' }];
      jest.spyOn(numsequentielleService, 'query').mockReturnValue(of(new HttpResponse({ body: numsequentielleCollection })));
      const additionalNumsequentielles = [sequenceId];
      const expectedCollection: INumsequentielle[] = [...additionalNumsequentielles, ...numsequentielleCollection];
      jest.spyOn(numsequentielleService, 'addNumsequentielleToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ parentClassdef });
      comp.ngOnInit();

      expect(numsequentielleService.query).toHaveBeenCalled();
      expect(numsequentielleService.addNumsequentielleToCollectionIfMissing).toHaveBeenCalledWith(
        numsequentielleCollection,
        ...additionalNumsequentielles.map(expect.objectContaining)
      );
      expect(comp.numsequentiellesSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const parentClassdef: IParentClassdef = { id: 456 };
      const sequenceId: INumsequentielle = { id: '46426c97-11df-48f6-b8a1-ef10e557acc1' };
      parentClassdef.sequenceId = sequenceId;

      activatedRoute.data = of({ parentClassdef });
      comp.ngOnInit();

      expect(comp.numsequentiellesSharedCollection).toContain(sequenceId);
      expect(comp.parentClassdef).toEqual(parentClassdef);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IParentClassdef>>();
      const parentClassdef = { id: 123 };
      jest.spyOn(parentClassdefFormService, 'getParentClassdef').mockReturnValue(parentClassdef);
      jest.spyOn(parentClassdefService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ parentClassdef });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: parentClassdef }));
      saveSubject.complete();

      // THEN
      expect(parentClassdefFormService.getParentClassdef).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(parentClassdefService.update).toHaveBeenCalledWith(expect.objectContaining(parentClassdef));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IParentClassdef>>();
      const parentClassdef = { id: 123 };
      jest.spyOn(parentClassdefFormService, 'getParentClassdef').mockReturnValue({ id: null });
      jest.spyOn(parentClassdefService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ parentClassdef: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: parentClassdef }));
      saveSubject.complete();

      // THEN
      expect(parentClassdefFormService.getParentClassdef).toHaveBeenCalled();
      expect(parentClassdefService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IParentClassdef>>();
      const parentClassdef = { id: 123 };
      jest.spyOn(parentClassdefService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ parentClassdef });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(parentClassdefService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareNumsequentielle', () => {
      it('Should forward to numsequentielleService', () => {
        const entity = { id: '9fec3727-3421-4967-b213-ba36557ca194' };
        const entity2 = { id: '1361f429-3817-4123-8ee3-fdf8943310b2' };
        jest.spyOn(numsequentielleService, 'compareNumsequentielle');
        comp.compareNumsequentielle(entity, entity2);
        expect(numsequentielleService.compareNumsequentielle).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
