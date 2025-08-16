import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PersonCompanyFormService, PersonCompanyFormGroup } from './person-company-form.service';
import { IPersonCompany } from '../person-company.model';
import { PersonCompanyService } from '../service/person-company.service';
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

@Component({
  selector: 'jhi-person-company-update',
  templateUrl: './person-company-update.component.html',
})
export class PersonCompanyUpdateComponent implements OnInit {
  isSaving = false;
  personCompany: IPersonCompany | null = null;
  usualStatusValues = Object.keys(UsualStatus);

  editForm: PersonCompanyFormGroup = this.personCompanyFormService.createPersonCompanyFormGroup();

  constructor(
    protected personCompanyService: PersonCompanyService,
    protected personCompanyFormService: PersonCompanyFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ personCompany }) => {
      this.personCompany = personCompany;
      if (personCompany) {
        this.updateForm(personCompany);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const personCompany = this.personCompanyFormService.getPersonCompany(this.editForm);
    if (personCompany.id !== null) {
      this.subscribeToSaveResponse(this.personCompanyService.update(personCompany));
    } else {
      this.subscribeToSaveResponse(this.personCompanyService.create(personCompany));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPersonCompany>>): void {
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

  protected updateForm(personCompany: IPersonCompany): void {
    this.personCompany = personCompany;
    this.personCompanyFormService.resetForm(this.editForm, personCompany);
  }
}
