import { Component, OnInit, OnDestroy } from '@angular/core';
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
  styleUrls: ['./contact-company-update.component.scss'],
})
export class ContactCompanyUpdateComponent implements OnInit, OnDestroy {
  isSaving = false;
  contactCompany: IContactCompany | null = null;

  // enum values (correctly typed)
  usualStatusValues: UsualStatus[] = Object.values(UsualStatus);

  editForm: ContactCompanyFormGroup = this.contactCompanyFormService.createContactCompanyFormGroup();

  // Etat dropdown
  etatMenuOpen = false;

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
      } else {
        this.setDefaultEtatIfEmpty();
      }
    });

    document.addEventListener('click', this.outsideClickListener);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.outsideClickListener);
  }

  private outsideClickListener = (event: Event): void => {
    if (!this.etatMenuOpen) {
      return;
    }

    const path = (event as any).composedPath?.() || [];
    const clickedInside = path.some((el: any) => el?.classList?.contains?.('etat-dropdown'));

    if (!clickedInside) {
      this.etatMenuOpen = false;
    }
  };

  previousState(): void {
    window.history.back();
  }

  save(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    const contactCompany = this.contactCompanyFormService.getContactCompany(this.editForm);

    if (contactCompany.id != null) {
      this.subscribeToSaveResponse(this.contactCompanyService.update(contactCompany));
    } else {
      this.subscribeToSaveResponse(this.contactCompanyService.create(contactCompany));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IContactCompany>>): void {
    result.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => this.previousState(),
      error: () => {},
    });
  }

  protected updateForm(contactCompany: IContactCompany): void {
    this.contactCompanyFormService.resetForm(this.editForm, contactCompany);
    this.setDefaultEtatIfEmpty();
  }

  /**
   * Définit Actif par défaut si etat est null
   */
  protected setDefaultEtatIfEmpty(): void {
    const etatControl = this.editForm.get('etat');

    if (!etatControl || etatControl.value !== null) {
      return;
    }

    const defaultEtat: UsualStatus = this.usualStatusValues.includes(UsualStatus.Actif) ? UsualStatus.Actif : this.usualStatusValues[0];

    etatControl.setValue(defaultEtat);
  }

  // ===== Etat button menu =====
  toggleEtatMenu(): void {
    this.etatMenuOpen = !this.etatMenuOpen;
  }

  setEtat(newEtat: UsualStatus): void {
    this.editForm.get('etat')?.setValue(newEtat);
    this.etatMenuOpen = false;
  }

  trackByUsualStatus(_: number, item: UsualStatus): UsualStatus {
    return item;
  }
}
