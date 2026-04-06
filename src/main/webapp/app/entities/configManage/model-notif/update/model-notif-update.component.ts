import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ModelNotifFormService, ModelNotifFormGroup } from './model-notif-form.service';
import { IModelNotif } from '../model-notif.model';
import { ModelNotifService } from '../service/model-notif.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';

@Component({
  selector: 'jhi-model-notif-update',
  templateUrl: './model-notif-update.component.html',
  styleUrls: ['./model-notif-update.component.scss'],
})
export class ModelNotifUpdateComponent implements OnInit {
  isSaving = false;
  modelNotif: IModelNotif | null = null;

  editForm: ModelNotifFormGroup = this.modelNotifFormService.createModelNotifFormGroup();

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected modelNotifService: ModelNotifService,
    protected modelNotifFormService: ModelNotifFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ modelNotif }) => {
      this.modelNotif = modelNotif;
      if (modelNotif) {
        this.updateForm(modelNotif);
      }
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
    // Plus besoin de synchroniser htmlContent — le formControl gère directement
    const modelNotif = this.modelNotifFormService.getModelNotif(this.editForm);
    if (modelNotif.id !== null) {
      this.subscribeToSaveResponse(this.modelNotifService.update(modelNotif));
    } else {
      this.subscribeToSaveResponse(this.modelNotifService.create(modelNotif));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IModelNotif>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {}

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(modelNotif: IModelNotif): void {
    this.modelNotif = modelNotif;
    this.modelNotifFormService.resetForm(this.editForm, modelNotif);
  }
}
