import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { TasksFormService, TasksFormGroup } from './tasks-form.service';
import { ITasks } from '../tasks.model';
import { TasksService } from '../service/tasks.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';
import { CorrespStatus } from 'app/entities/enumerations/corresp-status.model';

@Component({
  selector: 'jhi-tasks-update',
  templateUrl: './tasks-update.component.html',
})
export class TasksUpdateComponent implements OnInit {
  isSaving = false;
  tasks: ITasks | null = null;
  correspStatusValues = Object.keys(CorrespStatus);

  editForm: TasksFormGroup = this.tasksFormService.createTasksFormGroup();

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected tasksService: TasksService,
    protected tasksFormService: TasksFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ tasks }) => {
      this.tasks = tasks;
      if (tasks) {
        this.updateForm(tasks);
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
    const tasks = this.tasksFormService.getTasks(this.editForm);
    if (tasks.id !== null) {
      this.subscribeToSaveResponse(this.tasksService.update(tasks));
    } else {
      this.subscribeToSaveResponse(this.tasksService.create(tasks));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ITasks>>): void {
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

  protected updateForm(tasks: ITasks): void {
    this.tasks = tasks;
    this.tasksFormService.resetForm(this.editForm, tasks);
  }
}
