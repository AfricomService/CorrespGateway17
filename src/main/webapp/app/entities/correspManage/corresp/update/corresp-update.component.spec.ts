import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { CorrespFormService } from './corresp-form.service';
import { CorrespService } from '../service/corresp.service';
import { ICorresp } from '../corresp.model';
import { IDossier } from 'app/entities/correspManage/dossier/dossier.model';
import { DossierService } from 'app/entities/correspManage/dossier/service/dossier.service';
import { IBordereaux } from 'app/entities/correspManage/bordereaux/bordereaux.model';
import { BordereauxService } from 'app/entities/correspManage/bordereaux/service/bordereaux.service';
import { IPj } from 'app/entities/correspManage/pj/pj.model';
import { PjService } from 'app/entities/correspManage/pj/service/pj.service';
import { ITasks } from 'app/entities/correspManage/tasks/tasks.model';
import { TasksService } from 'app/entities/correspManage/tasks/service/tasks.service';

import { CorrespUpdateComponent } from './corresp-update.component';

describe('Corresp Management Update Component', () => {
  let comp: CorrespUpdateComponent;
  let fixture: ComponentFixture<CorrespUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let correspFormService: CorrespFormService;
  let correspService: CorrespService;
  let dossierService: DossierService;
  let bordereauxService: BordereauxService;
  let pjService: PjService;
  let tasksService: TasksService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [CorrespUpdateComponent],
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
      .overrideTemplate(CorrespUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(CorrespUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    correspFormService = TestBed.inject(CorrespFormService);
    correspService = TestBed.inject(CorrespService);
    dossierService = TestBed.inject(DossierService);
    bordereauxService = TestBed.inject(BordereauxService);
    pjService = TestBed.inject(PjService);
    tasksService = TestBed.inject(TasksService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Dossier query and add missing value', () => {
      const corresp: ICorresp = { id: 456 };
      const dossiers: IDossier[] = [{ id: 6938 }];
      corresp.dossiers = dossiers;

      const dossierCollection: IDossier[] = [{ id: 47935 }];
      jest.spyOn(dossierService, 'query').mockReturnValue(of(new HttpResponse({ body: dossierCollection })));
      const additionalDossiers = [...dossiers];
      const expectedCollection: IDossier[] = [...additionalDossiers, ...dossierCollection];
      jest.spyOn(dossierService, 'addDossierToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ corresp });
      comp.ngOnInit();

      expect(dossierService.query).toHaveBeenCalled();
      expect(dossierService.addDossierToCollectionIfMissing).toHaveBeenCalledWith(
        dossierCollection,
        ...additionalDossiers.map(expect.objectContaining)
      );
      expect(comp.dossiersSharedCollection).toEqual(expectedCollection);
    });

    it('Should call Bordereaux query and add missing value', () => {
      const corresp: ICorresp = { id: 456 };
      const bordereaux: IBordereaux[] = [{ id: 89374 }];
      corresp.bordereaux = bordereaux;

      const bordereauxCollection: IBordereaux[] = [{ id: 49414 }];
      jest.spyOn(bordereauxService, 'query').mockReturnValue(of(new HttpResponse({ body: bordereauxCollection })));
      const additionalBordereaux = [...bordereaux];
      const expectedCollection: IBordereaux[] = [...additionalBordereaux, ...bordereauxCollection];
      jest.spyOn(bordereauxService, 'addBordereauxToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ corresp });
      comp.ngOnInit();

      expect(bordereauxService.query).toHaveBeenCalled();
      expect(bordereauxService.addBordereauxToCollectionIfMissing).toHaveBeenCalledWith(
        bordereauxCollection,
        ...additionalBordereaux.map(expect.objectContaining)
      );
      expect(comp.bordereauxSharedCollection).toEqual(expectedCollection);
    });

    it('Should call Pj query and add missing value', () => {
      const corresp: ICorresp = { id: 456 };
      const attachments: IPj[] = [{ id: 78627 }];
      corresp.attachments = attachments;

      const pjCollection: IPj[] = [{ id: 16402 }];
      jest.spyOn(pjService, 'query').mockReturnValue(of(new HttpResponse({ body: pjCollection })));
      const additionalPjs = [...attachments];
      const expectedCollection: IPj[] = [...additionalPjs, ...pjCollection];
      jest.spyOn(pjService, 'addPjToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ corresp });
      comp.ngOnInit();

      expect(pjService.query).toHaveBeenCalled();
      expect(pjService.addPjToCollectionIfMissing).toHaveBeenCalledWith(pjCollection, ...additionalPjs.map(expect.objectContaining));
      expect(comp.pjsSharedCollection).toEqual(expectedCollection);
    });

    it('Should call Tasks query and add missing value', () => {
      const corresp: ICorresp = { id: 456 };
      const tasks: ITasks[] = [{ id: 70018 }];
      corresp.tasks = tasks;

      const tasksCollection: ITasks[] = [{ id: 37835 }];
      jest.spyOn(tasksService, 'query').mockReturnValue(of(new HttpResponse({ body: tasksCollection })));
      const additionalTasks = [...tasks];
      const expectedCollection: ITasks[] = [...additionalTasks, ...tasksCollection];
      jest.spyOn(tasksService, 'addTasksToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ corresp });
      comp.ngOnInit();

      expect(tasksService.query).toHaveBeenCalled();
      expect(tasksService.addTasksToCollectionIfMissing).toHaveBeenCalledWith(
        tasksCollection,
        ...additionalTasks.map(expect.objectContaining)
      );
      expect(comp.tasksSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const corresp: ICorresp = { id: 456 };
      const dossiers: IDossier = { id: 16174 };
      corresp.dossiers = [dossiers];
      const bordereaux: IBordereaux = { id: 62688 };
      corresp.bordereaux = [bordereaux];
      const attachments: IPj = { id: 95283 };
      corresp.attachments = [attachments];
      const tasks: ITasks = { id: 38227 };
      corresp.tasks = [tasks];

      activatedRoute.data = of({ corresp });
      comp.ngOnInit();

      expect(comp.dossiersSharedCollection).toContain(dossiers);
      expect(comp.bordereauxSharedCollection).toContain(bordereaux);
      expect(comp.pjsSharedCollection).toContain(attachments);
      expect(comp.tasksSharedCollection).toContain(tasks);
      expect(comp.corresp).toEqual(corresp);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICorresp>>();
      const corresp = { id: 123 };
      jest.spyOn(correspFormService, 'getCorresp').mockReturnValue(corresp);
      jest.spyOn(correspService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ corresp });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: corresp }));
      saveSubject.complete();

      // THEN
      expect(correspFormService.getCorresp).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(correspService.update).toHaveBeenCalledWith(expect.objectContaining(corresp));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICorresp>>();
      const corresp = { id: 123 };
      jest.spyOn(correspFormService, 'getCorresp').mockReturnValue({ id: null });
      jest.spyOn(correspService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ corresp: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: corresp }));
      saveSubject.complete();

      // THEN
      expect(correspFormService.getCorresp).toHaveBeenCalled();
      expect(correspService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ICorresp>>();
      const corresp = { id: 123 };
      jest.spyOn(correspService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ corresp });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(correspService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareDossier', () => {
      it('Should forward to dossierService', () => {
        const entity = { id: 123 };
        const entity2 = { id: 456 };
        jest.spyOn(dossierService, 'compareDossier');
        comp.compareDossier(entity, entity2);
        expect(dossierService.compareDossier).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareBordereaux', () => {
      it('Should forward to bordereauxService', () => {
        const entity = { id: 123 };
        const entity2 = { id: 456 };
        jest.spyOn(bordereauxService, 'compareBordereaux');
        comp.compareBordereaux(entity, entity2);
        expect(bordereauxService.compareBordereaux).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('comparePj', () => {
      it('Should forward to pjService', () => {
        const entity = { id: 123 };
        const entity2 = { id: 456 };
        jest.spyOn(pjService, 'comparePj');
        comp.comparePj(entity, entity2);
        expect(pjService.comparePj).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareTasks', () => {
      it('Should forward to tasksService', () => {
        const entity = { id: 123 };
        const entity2 = { id: 456 };
        jest.spyOn(tasksService, 'compareTasks');
        comp.compareTasks(entity, entity2);
        expect(tasksService.compareTasks).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
