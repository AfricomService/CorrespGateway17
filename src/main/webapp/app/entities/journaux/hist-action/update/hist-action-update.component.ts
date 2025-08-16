import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { HistActionFormService, HistActionFormGroup } from './hist-action-form.service';
import { IHistAction } from '../hist-action.model';
import { HistActionService } from '../service/hist-action.service';

@Component({
  selector: 'jhi-hist-action-update',
  templateUrl: './hist-action-update.component.html',
})
export class HistActionUpdateComponent implements OnInit {
  isSaving = false;
  histAction: IHistAction | null = null;

  editForm: HistActionFormGroup = this.histActionFormService.createHistActionFormGroup();

  constructor(
    protected histActionService: HistActionService,
    protected histActionFormService: HistActionFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ histAction }) => {
      this.histAction = histAction;
      if (histAction) {
        this.updateForm(histAction);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const histAction = this.histActionFormService.getHistAction(this.editForm);
    if (histAction.id !== null) {
      this.subscribeToSaveResponse(this.histActionService.update(histAction));
    } else {
      this.subscribeToSaveResponse(this.histActionService.create(histAction));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IHistAction>>): void {
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

  protected updateForm(histAction: IHistAction): void {
    this.histAction = histAction;
    this.histActionFormService.resetForm(this.editForm, histAction);
  }
}
