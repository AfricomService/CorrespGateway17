import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PjFormService, PjFormGroup } from './pj-form.service';
import { IPj } from '../pj.model';
import { PjService } from '../service/pj.service';
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

@Component({
  selector: 'jhi-pj-update',
  templateUrl: './pj-update.component.html',
})
export class PjUpdateComponent implements OnInit {
  isSaving = false;
  pj: IPj | null = null;
  usualStatusValues = Object.keys(UsualStatus);

  editForm: PjFormGroup = this.pjFormService.createPjFormGroup();

  constructor(protected pjService: PjService, protected pjFormService: PjFormService, protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ pj }) => {
      this.pj = pj;
      if (pj) {
        this.updateForm(pj);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const pj = this.pjFormService.getPj(this.editForm);
    if (pj.id !== null) {
      this.subscribeToSaveResponse(this.pjService.update(pj));
    } else {
      this.subscribeToSaveResponse(this.pjService.create(pj));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPj>>): void {
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

  protected updateForm(pj: IPj): void {
    this.pj = pj;
    this.pjFormService.resetForm(this.editForm, pj);
  }
}
