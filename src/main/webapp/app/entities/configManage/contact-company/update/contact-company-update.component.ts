import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ContactCompanyFormService, ContactCompanyFormGroup } from './contact-company-form.service';
import { IContactCompany } from '../contact-company.model';
import { ContactCompanyService } from '../service/contact-company.service';
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';

@Component({
  selector: 'jhi-contact-company-update',
  templateUrl: './contact-company-update.component.html',
})
export class ContactCompanyUpdateComponent implements OnInit {
  isSaving = false;
  contactCompany: IContactCompany | null = null;
  usualStatusValues = Object.keys(UsualStatus);

  editForm: ContactCompanyFormGroup = this.contactCompanyFormService.createContactCompanyFormGroup();

  constructor(
    protected contactCompanyService: ContactCompanyService,
    protected contactCompanyFormService: ContactCompanyFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ contactCompany }) => {
      this.contactCompany = contactCompany;
      if (contactCompany) {
        this.updateForm(contactCompany);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const contactCompany = this.contactCompanyFormService.getContactCompany(this.editForm);
    if (contactCompany.id !== null) {
      this.subscribeToSaveResponse(this.contactCompanyService.update(contactCompany));
    } else {
      this.subscribeToSaveResponse(this.contactCompanyService.create(contactCompany));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IContactCompany>>): void {
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

  protected updateForm(contactCompany: IContactCompany): void {
    this.contactCompany = contactCompany;
    this.contactCompanyFormService.resetForm(this.editForm, contactCompany);
  }
}
