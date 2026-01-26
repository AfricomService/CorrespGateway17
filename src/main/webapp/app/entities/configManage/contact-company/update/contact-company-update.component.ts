import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ContactCompanyFormService, ContactCompanyFormGroup } from './contact-company-form.service';
import { IContactCompany } from '../contact-company.model';
import { ContactCompanyService } from '../service/contact-company.service';

@Component({
  selector: 'jhi-contact-company-update',
  templateUrl: './contact-company-update.component.html',
  styleUrls: ['./contact-company-update.component.scss'],
})
export class ContactCompanyUpdateComponent implements OnInit, OnDestroy {
  isSaving = false;
  contactCompany: IContactCompany | null = null;

  editForm: ContactCompanyFormGroup = this.contactCompanyFormService.createContactCompanyFormGroup();

  private nomValueSub?: Subscription;
  private matrneValueSub?: Subscription;

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

    // enlever l'erreur nameExists si l'utilisateur modifie le nom
    const nomControl = this.editForm.get('nom');
    if (nomControl) {
      this.nomValueSub = nomControl.valueChanges.subscribe(() => {
        const errors = nomControl.errors;
        if (errors && errors['nameExists']) {
          const newErrors = { ...errors };
          delete newErrors['nameExists'];
          const keys = Object.keys(newErrors);
          nomControl.setErrors(keys.length ? newErrors : null);
        }
      });
    }

    // enlever l'erreur matrneExists si l'utilisateur modifie le matrne
    const matrneControl = this.editForm.get('matrne');
    if (matrneControl) {
      this.matrneValueSub = matrneControl.valueChanges.subscribe(() => {
        const errors = matrneControl.errors;
        if (errors && errors['matrneExists']) {
          const newErrors = { ...errors };
          delete newErrors['matrneExists'];
          const keys = Object.keys(newErrors);
          matrneControl.setErrors(keys.length ? newErrors : null);
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.nomValueSub) {
      this.nomValueSub.unsubscribe();
    }
    if (this.matrneValueSub) {
      this.matrneValueSub.unsubscribe();
    }
  }

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
      error: (err: HttpErrorResponse) => this.handleSaveError(err),
    });
  }

  protected handleSaveError(error: HttpErrorResponse): void {
    // Gérer le cas où le backend renvoie une erreur "nameexists" ou "matrneexists"
    if (error.status === 400) {
      const body = error.error || {};
      let isNameExists = false;
      let isMatrneExists = false;

      // Plusieurs possibilités selon la forme de la réponse (depend de ton backend / JHipster)
      if (typeof body === 'object') {
        if (body.message && String(body.message).toLowerCase().includes('nameexists')) {
          isNameExists = true;
        }
        if ((body.errorKey && body.errorKey === 'nameexists') || (body.code && body.code === 'nameexists')) {
          isNameExists = true;
        }

        if (body.message && String(body.message).toLowerCase().includes('matrneexists')) {
          isMatrneExists = true;
        }
        if ((body.errorKey && body.errorKey === 'matrneexists') || (body.code && body.code === 'matrneexists')) {
          isMatrneExists = true;
        }
      }

      // vérifier aussi les headers (au cas où HeaderUtil mettrait l'info dans un header)
      if ((!isNameExists || !isMatrneExists) && error.headers) {
        try {
          for (const key of error.headers.keys()) {
            const v = error.headers.get(key);
            if (v) {
              const lower = v.toLowerCase();
              if (!isNameExists && lower.includes('nameexists')) {
                isNameExists = true;
              }
              if (!isMatrneExists && lower.includes('matrneexists')) {
                isMatrneExists = true;
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (isNameExists) {
        const nomControl2 = this.editForm.get('nom');
        if (nomControl2) {
          nomControl2.setErrors({ ...(nomControl2.errors || {}), nameExists: true });
          nomControl2.markAsTouched();
        }
        return;
      }

      if (isMatrneExists) {
        const matrneControl2 = this.editForm.get('matrne');
        if (matrneControl2) {
          matrneControl2.setErrors({ ...(matrneControl2.errors || {}), matrneExists: true });
          matrneControl2.markAsTouched();
        }
        return;
      }
    }

    // erreur par défaut (tu peux ajouter un jhi-alert global si besoin)
    console.error('Erreur lors de la sauvegarde ContactCompany:', error);
  }

  protected updateForm(contactCompany: IContactCompany): void {
    this.contactCompanyFormService.resetForm(this.editForm, contactCompany);
  }
}
