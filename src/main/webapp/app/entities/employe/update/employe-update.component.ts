import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { EmployeFormService, EmployeFormGroup } from './employe-form.service';
import { IEmploye } from '../employe.model';
import { EmployeService } from '../service/employe.service';

@Component({
  selector: 'jhi-employe-update',
  templateUrl: './employe-update.component.html',
})
export class EmployeUpdateComponent implements OnInit {
  isSaving = false;
  employe: IEmploye | null = null;

  editForm: EmployeFormGroup = this.employeFormService.createEmployeFormGroup();

  constructor(
    protected employeService: EmployeService,
    protected employeFormService: EmployeFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ employe }) => {
      this.employe = employe;
      if (employe) {
        this.updateForm(employe);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const employe = this.employeFormService.getEmploye(this.editForm);
    if (employe.id !== null) {
      this.subscribeToSaveResponse(this.employeService.update(employe));
    } else {
      this.subscribeToSaveResponse(this.employeService.create(employe));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IEmploye>>): void {
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

  protected updateForm(employe: IEmploye): void {
    this.employe = employe;
    this.employeFormService.resetForm(this.editForm, employe);
  }
}
