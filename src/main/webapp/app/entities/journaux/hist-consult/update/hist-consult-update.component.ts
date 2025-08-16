import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { HistConsultFormService, HistConsultFormGroup } from './hist-consult-form.service';
import { IHistConsult } from '../hist-consult.model';
import { HistConsultService } from '../service/hist-consult.service';

@Component({
  selector: 'jhi-hist-consult-update',
  templateUrl: './hist-consult-update.component.html',
})
export class HistConsultUpdateComponent implements OnInit {
  isSaving = false;
  histConsult: IHistConsult | null = null;

  editForm: HistConsultFormGroup = this.histConsultFormService.createHistConsultFormGroup();

  constructor(
    protected histConsultService: HistConsultService,
    protected histConsultFormService: HistConsultFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ histConsult }) => {
      this.histConsult = histConsult;
      if (histConsult) {
        this.updateForm(histConsult);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const histConsult = this.histConsultFormService.getHistConsult(this.editForm);
    if (histConsult.id !== null) {
      this.subscribeToSaveResponse(this.histConsultService.update(histConsult));
    } else {
      this.subscribeToSaveResponse(this.histConsultService.create(histConsult));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IHistConsult>>): void {
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

  protected updateForm(histConsult: IHistConsult): void {
    this.histConsult = histConsult;
    this.histConsultFormService.resetForm(this.editForm, histConsult);
  }
}
