import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, from } from 'rxjs';

import { OrgaEntityFormService } from './orga-entity-form.service';
import { OrgaEntityService } from '../service/orga-entity.service';
import { IOrgaEntity } from '../orga-entity.model';
import { IDepartement } from 'app/entities/orgacare/departement/departement.model';
import { DepartementService } from 'app/entities/orgacare/departement/service/departement.service';
import { IEmploye } from 'app/entities/employe/employe.model';
import { EmployeService } from 'app/entities/employe/service/employe.service';

import { OrgaEntityUpdateComponent } from './orga-entity-update.component';

describe('OrgaEntity Management Update Component', () => {
  let comp: OrgaEntityUpdateComponent;
  let fixture: ComponentFixture<OrgaEntityUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let orgaEntityFormService: OrgaEntityFormService;
  let orgaEntityService: OrgaEntityService;
  let departementService: DepartementService;
  let employeService: EmployeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule.withRoutes([])],
      declarations: [OrgaEntityUpdateComponent],
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
      .overrideTemplate(OrgaEntityUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(OrgaEntityUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    orgaEntityFormService = TestBed.inject(OrgaEntityFormService);
    orgaEntityService = TestBed.inject(OrgaEntityService);
    departementService = TestBed.inject(DepartementService);
    employeService = TestBed.inject(EmployeService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('Should call Departement query and add missing value', () => {
      const orgaEntity: IOrgaEntity = { id: 456 };
      const departement: IDepartement = { id: 4865 };
      orgaEntity.departement = departement;

      const departementCollection: IDepartement[] = [{ id: 99024 }];
      jest.spyOn(departementService, 'query').mockReturnValue(of(new HttpResponse({ body: departementCollection })));
      const additionalDepartements = [departement];
      const expectedCollection: IDepartement[] = [...additionalDepartements, ...departementCollection];
      jest.spyOn(departementService, 'addDepartementToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ orgaEntity });
      comp.ngOnInit();

      expect(departementService.query).toHaveBeenCalled();
      expect(departementService.addDepartementToCollectionIfMissing).toHaveBeenCalledWith(
        departementCollection,
        ...additionalDepartements.map(expect.objectContaining)
      );
      expect(comp.departementsSharedCollection).toEqual(expectedCollection);
    });

    it('Should call Employe query and add missing value', () => {
      const orgaEntity: IOrgaEntity = { id: 456 };
      const employe: IEmploye = { id: 38273 };
      orgaEntity.employe = employe;

      const employeCollection: IEmploye[] = [{ id: 39621 }];
      jest.spyOn(employeService, 'query').mockReturnValue(of(new HttpResponse({ body: employeCollection })));
      const additionalEmployes = [employe];
      const expectedCollection: IEmploye[] = [...additionalEmployes, ...employeCollection];
      jest.spyOn(employeService, 'addEmployeToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ orgaEntity });
      comp.ngOnInit();

      expect(employeService.query).toHaveBeenCalled();
      expect(employeService.addEmployeToCollectionIfMissing).toHaveBeenCalledWith(
        employeCollection,
        ...additionalEmployes.map(expect.objectContaining)
      );
      expect(comp.employesSharedCollection).toEqual(expectedCollection);
    });

    it('Should update editForm', () => {
      const orgaEntity: IOrgaEntity = { id: 456 };
      const departement: IDepartement = { id: 61867 };
      orgaEntity.departement = departement;
      const employe: IEmploye = { id: 42540 };
      orgaEntity.employe = employe;

      activatedRoute.data = of({ orgaEntity });
      comp.ngOnInit();

      expect(comp.departementsSharedCollection).toContain(departement);
      expect(comp.employesSharedCollection).toContain(employe);
      expect(comp.orgaEntity).toEqual(orgaEntity);
    });
  });

  describe('save', () => {
    it('Should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IOrgaEntity>>();
      const orgaEntity = { id: 123 };
      jest.spyOn(orgaEntityFormService, 'getOrgaEntity').mockReturnValue(orgaEntity);
      jest.spyOn(orgaEntityService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ orgaEntity });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: orgaEntity }));
      saveSubject.complete();

      // THEN
      expect(orgaEntityFormService.getOrgaEntity).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(orgaEntityService.update).toHaveBeenCalledWith(expect.objectContaining(orgaEntity));
      expect(comp.isSaving).toEqual(false);
    });

    it('Should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IOrgaEntity>>();
      const orgaEntity = { id: 123 };
      jest.spyOn(orgaEntityFormService, 'getOrgaEntity').mockReturnValue({ id: null });
      jest.spyOn(orgaEntityService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ orgaEntity: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: orgaEntity }));
      saveSubject.complete();

      // THEN
      expect(orgaEntityFormService.getOrgaEntity).toHaveBeenCalled();
      expect(orgaEntityService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('Should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IOrgaEntity>>();
      const orgaEntity = { id: 123 };
      jest.spyOn(orgaEntityService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ orgaEntity });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(orgaEntityService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareDepartement', () => {
      it('Should forward to departementService', () => {
        const entity = { id: 123 };
        const entity2 = { id: 456 };
        jest.spyOn(departementService, 'compareDepartement');
        comp.compareDepartement(entity, entity2);
        expect(departementService.compareDepartement).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareEmploye', () => {
      it('Should forward to employeService', () => {
        const entity = { id: 123 };
        const entity2 = { id: 456 };
        jest.spyOn(employeService, 'compareEmploye');
        comp.compareEmploye(entity, entity2);
        expect(employeService.compareEmploye).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
