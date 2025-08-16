import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { BordereauxFormService, BordereauxFormGroup } from './bordereaux-form.service';
import { IBordereaux } from '../bordereaux.model';
import { BordereauxService } from '../service/bordereaux.service';

@Component({
  selector: 'jhi-bordereaux-update',
  templateUrl: './bordereaux-update.component.html',
})
export class BordereauxUpdateComponent implements OnInit {
  isSaving = false;
  bordereaux: IBordereaux | null = null;

  editForm: BordereauxFormGroup = this.bordereauxFormService.createBordereauxFormGroup();

  constructor(
    protected bordereauxService: BordereauxService,
    protected bordereauxFormService: BordereauxFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ bordereaux }) => {
      this.bordereaux = bordereaux;
      if (bordereaux) {
        this.updateForm(bordereaux);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const bordereaux = this.bordereauxFormService.getBordereaux(this.editForm);
    if (bordereaux.id !== null) {
      this.subscribeToSaveResponse(this.bordereauxService.update(bordereaux));
    } else {
      this.subscribeToSaveResponse(this.bordereauxService.create(bordereaux));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IBordereaux>>): void {
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

  protected updateForm(bordereaux: IBordereaux): void {
    this.bordereaux = bordereaux;
    this.bordereauxFormService.resetForm(this.editForm, bordereaux);
  }
}
