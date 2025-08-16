import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { TypedocumentFormService, TypedocumentFormGroup } from './typedocument-form.service';
import { ITypedocument } from '../typedocument.model';
import { TypedocumentService } from '../service/typedocument.service';
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

@Component({
  selector: 'jhi-typedocument-update',
  templateUrl: './typedocument-update.component.html',
})
export class TypedocumentUpdateComponent implements OnInit {
  isSaving = false;
  typedocument: ITypedocument | null = null;
  usualStatusValues = Object.keys(UsualStatus);

  editForm: TypedocumentFormGroup = this.typedocumentFormService.createTypedocumentFormGroup();

  constructor(
    protected typedocumentService: TypedocumentService,
    protected typedocumentFormService: TypedocumentFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ typedocument }) => {
      this.typedocument = typedocument;
      if (typedocument) {
        this.updateForm(typedocument);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const typedocument = this.typedocumentFormService.getTypedocument(this.editForm);
    if (typedocument.id !== null) {
      this.subscribeToSaveResponse(this.typedocumentService.update(typedocument));
    } else {
      this.subscribeToSaveResponse(this.typedocumentService.create(typedocument));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ITypedocument>>): void {
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

  protected updateForm(typedocument: ITypedocument): void {
    this.typedocument = typedocument;
    this.typedocumentFormService.resetForm(this.editForm, typedocument);
  }
}
