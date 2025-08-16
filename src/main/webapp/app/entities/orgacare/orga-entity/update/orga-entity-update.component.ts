import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { OrgaEntityFormService, OrgaEntityFormGroup } from './orga-entity-form.service';
import { IOrgaEntity } from '../orga-entity.model';
import { OrgaEntityService } from '../service/orga-entity.service';
import { IDepartement } from 'app/entities/orgacare/departement/departement.model';
import { DepartementService } from 'app/entities/orgacare/departement/service/departement.service';
import { IEmploye } from 'app/entities/employe/employe.model';
import { EmployeService } from 'app/entities/employe/service/employe.service';

@Component({
  selector: 'jhi-orga-entity-update',
  templateUrl: './orga-entity-update.component.html',
})
export class OrgaEntityUpdateComponent implements OnInit {
  isSaving = false;
  orgaEntity: IOrgaEntity | null = null;

  departementsSharedCollection: IDepartement[] = [];
  employesSharedCollection: IEmploye[] = [];

  editForm: OrgaEntityFormGroup = this.orgaEntityFormService.createOrgaEntityFormGroup();

  constructor(
    protected orgaEntityService: OrgaEntityService,
    protected orgaEntityFormService: OrgaEntityFormService,
    protected departementService: DepartementService,
    protected employeService: EmployeService,
    protected activatedRoute: ActivatedRoute
  ) {}

  compareDepartement = (o1: IDepartement | null, o2: IDepartement | null): boolean => this.departementService.compareDepartement(o1, o2);

  compareEmploye = (o1: IEmploye | null, o2: IEmploye | null): boolean => this.employeService.compareEmploye(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ orgaEntity }) => {
      this.orgaEntity = orgaEntity;
      if (orgaEntity) {
        this.updateForm(orgaEntity);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const orgaEntity = this.orgaEntityFormService.getOrgaEntity(this.editForm);
    if (orgaEntity.id !== null) {
      this.subscribeToSaveResponse(this.orgaEntityService.update(orgaEntity));
    } else {
      this.subscribeToSaveResponse(this.orgaEntityService.create(orgaEntity));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IOrgaEntity>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(orgaEntity: IOrgaEntity): void {
    this.orgaEntity = orgaEntity;
    this.orgaEntityFormService.resetForm(this.editForm, orgaEntity);

    this.departementsSharedCollection = this.departementService.addDepartementToCollectionIfMissing<IDepartement>(
      this.departementsSharedCollection,
      orgaEntity.departement
    );
    this.employesSharedCollection = this.employeService.addEmployeToCollectionIfMissing<IEmploye>(
      this.employesSharedCollection,
      orgaEntity.employe
    );
  }

  protected loadRelationshipsOptions(): void {
    this.departementService
      .query()
      .pipe(map((res: HttpResponse<IDepartement[]>) => res.body ?? []))
      .pipe(
        map((departements: IDepartement[]) =>
          this.departementService.addDepartementToCollectionIfMissing<IDepartement>(departements, this.orgaEntity?.departement)
        )
      )
      .subscribe((departements: IDepartement[]) => (this.departementsSharedCollection = departements));

    this.employeService
      .query()
      .pipe(map((res: HttpResponse<IEmploye[]>) => res.body ?? []))
      .pipe(
        map((employes: IEmploye[]) => this.employeService.addEmployeToCollectionIfMissing<IEmploye>(employes, this.orgaEntity?.employe))
      )
      .subscribe((employes: IEmploye[]) => (this.employesSharedCollection = employes));
  }
}
