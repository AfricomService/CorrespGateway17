import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { RulesFormService, RulesFormGroup } from './rules-form.service';
import { IRules } from '../rules.model';
import { RulesService } from '../service/rules.service';
import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';

@Component({
  selector: 'jhi-rules-update',
  templateUrl: './rules-update.component.html',
})
export class RulesUpdateComponent implements OnInit {
  isSaving = false;
  rules: IRules | null = null;

  editForm: RulesFormGroup = this.rulesFormService.createRulesFormGroup();

  constructor(
    protected dataUtils: DataUtils,
    protected eventManager: EventManager,
    protected rulesService: RulesService,
    protected rulesFormService: RulesFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ rules }) => {
      this.rules = rules;
      if (rules) {
        this.updateForm(rules);
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
    const rules = this.rulesFormService.getRules(this.editForm);
    if (rules.id !== null) {
      this.subscribeToSaveResponse(this.rulesService.update(rules));
    } else {
      this.subscribeToSaveResponse(this.rulesService.create(rules));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IRules>>): void {
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

  protected updateForm(rules: IRules): void {
    this.rules = rules;
    this.rulesFormService.resetForm(this.editForm, rules);
  }
}
