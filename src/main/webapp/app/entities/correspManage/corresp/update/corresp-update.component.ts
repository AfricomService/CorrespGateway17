import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { CorrespFormService, CorrespFormGroup } from './corresp-form.service';
import { ICorresp } from '../corresp.model';
import { CorrespService } from '../service/corresp.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';
import { IDossier } from 'app/entities/correspManage/dossier/dossier.model';
import { DossierService } from 'app/entities/correspManage/dossier/service/dossier.service';
import { IBordereaux } from 'app/entities/correspManage/bordereaux/bordereaux.model';
import { BordereauxService } from 'app/entities/correspManage/bordereaux/service/bordereaux.service';
import { IPj } from 'app/entities/correspManage/pj/pj.model';
import { PjService } from 'app/entities/correspManage/pj/service/pj.service';
import { ITasks } from 'app/entities/correspManage/tasks/tasks.model';
import { TasksService } from 'app/entities/correspManage/tasks/service/tasks.service';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';
import { CorrespType } from 'app/entities/enumerations/corresp-type.model';
import { DispatchType } from 'app/entities/enumerations/dispatch-type.model';

@Component({
  selector: 'jhi-corresp-update',
  templateUrl: './corresp-update.component.html',
})
export class CorrespUpdateComponent implements OnInit {
  isSaving = false;
  corresp: ICorresp | null = null;
  correspStatusValues = Object.keys(CorrespStatus);
  correspTypeValues = Object.keys(CorrespType);
  dispatchTypeValues = Object.keys(DispatchType);

  dossiersSharedCollection: IDossier[] = [];
  bordereauxSharedCollection: IBordereaux[] = [];
  pjsSharedCollection: IPj[] = [];
  tasksSharedCollection: ITasks[] = [];

  editForm: CorrespFormGroup = this.correspFormService.createCorrespFormGroup();

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected correspService: CorrespService,
    protected correspFormService: CorrespFormService,
    protected dossierService: DossierService,
    protected bordereauxService: BordereauxService,
    protected pjService: PjService,
    protected tasksService: TasksService,
    protected activatedRoute: ActivatedRoute
  ) {}

  compareDossier = (o1: IDossier | null, o2: IDossier | null): boolean => this.dossierService.compareDossier(o1, o2);

  compareBordereaux = (o1: IBordereaux | null, o2: IBordereaux | null): boolean => this.bordereauxService.compareBordereaux(o1, o2);

  comparePj = (o1: IPj | null, o2: IPj | null): boolean => this.pjService.comparePj(o1, o2);

  compareTasks = (o1: ITasks | null, o2: ITasks | null): boolean => this.tasksService.compareTasks(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ corresp }) => {
      this.corresp = corresp;
      if (corresp) {
        this.updateForm(corresp);
      }

      this.loadRelationshipsOptions();
    });
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  setFileData(event: Event, field: string, isImage: boolean): void {
    this.dataUtils.loadFileToForm(event, this.editForm, field, isImage).subscribe({
      error: (err: FileLoadError) =>
        this.eventManager.broadcast(new EventWithContent<AlertError>('correspCareApp.error', { ...err, key: 'error.file.' + err.key })),
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const corresp = this.correspFormService.getCorresp(this.editForm);
    if (corresp.id !== null) {
      this.subscribeToSaveResponse(this.correspService.update(corresp));
    } else {
      this.subscribeToSaveResponse(this.correspService.create(corresp));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ICorresp>>): void {
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

  protected updateForm(corresp: ICorresp): void {
    this.corresp = corresp;
    this.correspFormService.resetForm(this.editForm, corresp);

    this.dossiersSharedCollection = this.dossierService.addDossierToCollectionIfMissing<IDossier>(
      this.dossiersSharedCollection,
      ...(corresp.dossiers ?? [])
    );
    this.bordereauxSharedCollection = this.bordereauxService.addBordereauxToCollectionIfMissing<IBordereaux>(
      this.bordereauxSharedCollection,
      ...(corresp.bordereaux ?? [])
    );
    this.pjsSharedCollection = this.pjService.addPjToCollectionIfMissing<IPj>(this.pjsSharedCollection, ...(corresp.attachments ?? []));
    this.tasksSharedCollection = this.tasksService.addTasksToCollectionIfMissing<ITasks>(
      this.tasksSharedCollection,
      ...(corresp.tasks ?? [])
    );
  }

  protected loadRelationshipsOptions(): void {
    this.dossierService
      .query()
      .pipe(map((res: HttpResponse<IDossier[]>) => res.body ?? []))
      .pipe(
        map((dossiers: IDossier[]) =>
          this.dossierService.addDossierToCollectionIfMissing<IDossier>(dossiers, ...(this.corresp?.dossiers ?? []))
        )
      )
      .subscribe((dossiers: IDossier[]) => (this.dossiersSharedCollection = dossiers));

    this.bordereauxService
      .query()
      .pipe(map((res: HttpResponse<IBordereaux[]>) => res.body ?? []))
      .pipe(
        map((bordereaux: IBordereaux[]) =>
          this.bordereauxService.addBordereauxToCollectionIfMissing<IBordereaux>(bordereaux, ...(this.corresp?.bordereaux ?? []))
        )
      )
      .subscribe((bordereaux: IBordereaux[]) => (this.bordereauxSharedCollection = bordereaux));

    this.pjService
      .query()
      .pipe(map((res: HttpResponse<IPj[]>) => res.body ?? []))
      .pipe(map((pjs: IPj[]) => this.pjService.addPjToCollectionIfMissing<IPj>(pjs, ...(this.corresp?.attachments ?? []))))
      .subscribe((pjs: IPj[]) => (this.pjsSharedCollection = pjs));

    this.tasksService
      .query()
      .pipe(map((res: HttpResponse<ITasks[]>) => res.body ?? []))
      .pipe(map((tasks: ITasks[]) => this.tasksService.addTasksToCollectionIfMissing<ITasks>(tasks, ...(this.corresp?.tasks ?? []))))
      .subscribe((tasks: ITasks[]) => (this.tasksSharedCollection = tasks));
  }
}
