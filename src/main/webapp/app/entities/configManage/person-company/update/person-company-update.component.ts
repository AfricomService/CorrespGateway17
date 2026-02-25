import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PersonCompanyFormService, PersonCompanyFormGroup } from './person-company-form.service';
import { IPersonCompany } from '../person-company.model';
import { PersonCompanyService } from '../service/person-company.service';
import { IContactCompany } from 'app/entities/configManage/contact-company/contact-company.model';

// TranslateService
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jhi-person-company-update',
  templateUrl: './person-company-update.component.html',
  styleUrls: ['./person-company-update.component.scss'],
})
export class PersonCompanyUpdateComponent implements OnInit, OnDestroy {
  isSaving = false;
  personCompany: IPersonCompany | null = null;

  // Nom de la société liée (affiché dans l'UI)
  contactCompanyName: string | null = null;

  // message d'erreur utilisateur (affiché dans le template)
  errorMessage: string | null = null;

  editForm: PersonCompanyFormGroup = this.personCompanyFormService.createPersonCompanyFormGroup();

  private nomValueSub?: Subscription;
  private emailValueSub?: Subscription;

  constructor(
    protected personCompanyService: PersonCompanyService,
    protected personCompanyFormService: PersonCompanyFormService,
    protected activatedRoute: ActivatedRoute,
    protected translate: TranslateService
  ) {}

  ngOnInit(): void {
    // 1) si la route résolvait un personCompany (édition), on met à jour le formulaire
    this.activatedRoute.data.subscribe(({ personCompany }) => {
      this.personCompany = personCompany;
      if (personCompany) {
        this.updateForm(personCompany);
      }
    });

    // 2) lire query param contactCompanyId (ex: coming from the companies list "Ajouter" button)
    this.activatedRoute.queryParamMap.subscribe(params => {
      const ccId = params.get('contactCompanyId');
      if (ccId && !this.personCompany) {
        const numeric = Number(ccId);
        this.editForm.get('contactCompanyId')?.setValue(Number.isNaN(numeric) ? null : numeric);
        if (!Number.isNaN(numeric)) {
          this.loadContactCompanyName(numeric);
        }
      }
    });

    // nettoyer erreurs custom quand l'utilisateur modifie certains champs
    const nomControl = this.editForm.get('nom');
    if (nomControl) {
      this.nomValueSub = nomControl.valueChanges.subscribe(() => {
        const errors = nomControl.errors;
        if (errors && errors['nameExists']) {
          const newErrors = { ...errors };
          delete newErrors['nameExists'];
          nomControl.setErrors(Object.keys(newErrors).length ? newErrors : null);
        }
      });
    }

    const emailControl = this.editForm.get('email');
    if (emailControl) {
      this.emailValueSub = emailControl.valueChanges.subscribe(() => {
        const errors = emailControl.errors;
        if (errors && errors['emailServerError']) {
          const newErrors = { ...errors };
          delete newErrors['emailServerError'];
          emailControl.setErrors(Object.keys(newErrors).length ? newErrors : null);
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.nomValueSub) {
      this.nomValueSub.unsubscribe();
    }
    if (this.emailValueSub) {
      this.emailValueSub.unsubscribe();
    }
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = null;

    const personCompany = this.personCompanyFormService.getPersonCompany(this.editForm);
    if (personCompany.id !== null && personCompany.id !== undefined) {
      this.subscribeToSaveResponse(this.personCompanyService.update(personCompany as IPersonCompany));
    } else {
      this.subscribeToSaveResponse(this.personCompanyService.create(personCompany as any));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPersonCompany> | any>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: (err: unknown) => this.onSaveError(err),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(err?: unknown): void {
    try {
      const t = (key: string, params?: any) => this.translate.instant(key, params);

      if (err instanceof HttpErrorResponse) {
        if (err.status === 400 && err.error) {
          if (typeof err.error === 'string') {
            const lower = err.error.toLowerCase();
            if (lower.includes('contactcompany')) {
              this.errorMessage = t('correspCareApp.configManagePersonCompany.messages.contactCompanyNotFound');
              return;
            }
            this.errorMessage = err.error;
            return;
          } else if (typeof err.error === 'object') {
            const msg = (err.error as any).message || (err.error as any).error || JSON.stringify(err.error);
            if (msg && String(msg).toLowerCase().includes('contactcompany')) {
              this.errorMessage = t('correspCareApp.configManagePersonCompany.messages.contactCompanyNotFound');
              return;
            }
            // Si backend signale un champ unique existant (ex: nameexists), on peut marquer le control si souhaité
            if ((err.error as any).errorKey === 'nameexists' || String(msg).toLowerCase().includes('nameexists')) {
              const nomControl = this.editForm.get('nom');
              if (nomControl) {
                nomControl.setErrors({ ...(nomControl.errors || {}), nameExists: true });
                nomControl.markAsTouched();
              }
              return;
            }
            this.errorMessage = String(msg);
            return;
          }
        }

        const serverMsg = t('correspCareApp.configManagePersonCompany.messages.unknownSaveError');
        this.errorMessage = `${serverMsg} (${err.status}): ${err.statusText ?? ''}`;
        return;
      } else if (err instanceof Error) {
        const message = err.message || this.translate.instant('correspCareApp.configManagePersonCompany.messages.unknownSaveError');
        this.errorMessage = message;
        return;
      } else {
        this.errorMessage = this.translate.instant('correspCareApp.configManagePersonCompany.messages.unknownSaveError');
      }
    } catch (e) {
      this.errorMessage = this.translate.instant('correspCareApp.configManagePersonCompany.messages.processingError');
    }
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(personCompany: IPersonCompany): void {
    this.personCompany = personCompany;
    this.personCompanyFormService.resetForm(this.editForm, personCompany);

    const ccId = personCompany.contactCompanyId;
    if (ccId != null) {
      this.loadContactCompanyName(ccId);
    } else {
      this.contactCompanyName = null;
    }
  }

  protected loadContactCompanyName(contactCompanyId: number): void {
    this.contactCompanyName = null;
    this.personCompanyService.getContactCompany(contactCompanyId).subscribe({
      next: (contact: IContactCompany | any) => {
        this.contactCompanyName = contact?.nom ?? contact?.nomabrege ?? String(contact?.id ?? '');
      },
      error: (_err: unknown) => {
        this.contactCompanyName = null;
      },
    });
  }
}
