import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { NotifFormService, NotifFormGroup } from './notif-form.service';
import { INotif } from '../notif.model';
import { NotifService } from '../service/notif.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';
import { NotificationStatus } from 'app/entities/enumerations/notification-status.model';

@Component({
  selector: 'jhi-notif-update',
  templateUrl: './notif-update.component.html',
})
export class NotifUpdateComponent implements OnInit {
  isSaving = false;
  notif: INotif | null = null;
  notificationStatusValues = Object.keys(NotificationStatus);

  editForm: NotifFormGroup = this.notifFormService.createNotifFormGroup();

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected notifService: NotifService,
    protected notifFormService: NotifFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ notif }) => {
      this.notif = notif;
      if (notif) {
        this.updateForm(notif);
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
    const notif = this.notifFormService.getNotif(this.editForm);
    if (notif.id !== null) {
      this.subscribeToSaveResponse(this.notifService.update(notif));
    } else {
      this.subscribeToSaveResponse(this.notifService.create(notif));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<INotif>>): void {
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

  protected updateForm(notif: INotif): void {
    this.notif = notif;
    this.notifFormService.resetForm(this.editForm, notif);
  }
}
