import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigexportFormService, ConfigexportFormGroup } from './configexport-form.service';
import { IConfigexport } from '../configexport.model';
import { ConfigexportService } from '../service/configexport.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';

@Component({
  selector: 'jhi-configexport-update',
  templateUrl: './configexport-update.component.html',
})
export class ConfigexportUpdateComponent implements OnInit {
  isSaving = false;
  configexport: IConfigexport | null = null;

  editForm: ConfigexportFormGroup = this.configexportFormService.createConfigexportFormGroup();

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected configexportService: ConfigexportService,
    protected configexportFormService: ConfigexportFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ configexport }) => {
      this.configexport = configexport;
      if (configexport) {
        this.updateForm(configexport);
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
    const configexport = this.configexportFormService.getConfigexport(this.editForm);
    if (configexport.id !== null) {
      this.subscribeToSaveResponse(this.configexportService.update(configexport));
    } else {
      this.subscribeToSaveResponse(this.configexportService.create(configexport));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IConfigexport>>): void {
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

  protected updateForm(configexport: IConfigexport): void {
    this.configexport = configexport;
    this.configexportFormService.resetForm(this.editForm, configexport);
  }
}
