import { Component, OnInit } from '@angular/core';
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PersonCompanyFormService, PersonCompanyFormGroup } from './person-company-form.service';
import { IPersonCompany } from '../person-company.model';
import { PersonCompanyService } from '../service/person-company.service';
import { IContactCompany } from 'app/entities/configManage/contact-company/contact-company.model';

@Component({
  selector: 'jhi-person-company-update',
  templateUrl: './person-company-update.component.html',
  styleUrls: ['./person-company-update.component.scss'],
})
export class PersonCompanyUpdateComponent implements OnInit {
  isSaving = false;
  personCompany: IPersonCompany | null = null;

  // Nom de la société liée (affiché dans l'UI)
  contactCompanyName: string | null = null;

  // message d'erreur utilisateur (affiché dans le template)
  errorMessage: string | null = null;

  editForm: PersonCompanyFormGroup = this.personCompanyFormService.createPersonCompanyFormGroup();

  constructor(
    protected personCompanyService: PersonCompanyService,
    protected personCompanyFormService: PersonCompanyFormService,
    protected activatedRoute: ActivatedRoute
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
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    this.errorMessage = null;

    const personCompany = this.personCompanyFormService.getPersonCompany(this.editForm);
    if (personCompany.id !== null) {
      this.subscribeToSaveResponse(this.personCompanyService.update(personCompany as IPersonCompany));
    } else {
      this.subscribeToSaveResponse(this.personCompanyService.create(personCompany as any));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPersonCompany>>): void {
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
      if (err instanceof HttpErrorResponse) {
        if (err.status === 400 && err.error) {
          if (typeof err.error === 'string') {
            if (err.error.toLowerCase().includes('contactcompany')) {
              this.errorMessage = 'ContactCompany introuvable (id fourni invalide).';
              return;
            }
            this.errorMessage = err.error;
            return;
          } else if (typeof err.error === 'object') {
            const msg = (err.error as any).message || (err.error as any).error || JSON.stringify(err.error);
            if (msg && String(msg).toLowerCase().includes('contactcompany')) {
              this.errorMessage = 'ContactCompany introuvable (id fourni invalide).';
              return;
            }
            this.errorMessage = String(msg);
            return;
          }
        }
        this.errorMessage = `Erreur serveur (${err.status}): ${err.statusText || 'Unexpected error'}`;
        return;
      } else if (err instanceof Error) {
        const message = err.message || 'Une erreur est survenue.';
        this.errorMessage = message;
        return;
      } else {
        this.errorMessage = "Une erreur inconnue est survenue pendant l'enregistrement.";
      }
    } catch (e) {
      this.errorMessage = "Une erreur est survenue lors du traitement de l'erreur.";
    }
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(personCompany: IPersonCompany): void {
    this.personCompany = personCompany;
    this.personCompanyFormService.resetForm(this.editForm, personCompany);

    // si la personne a un contactCompanyId, charger le nom de la société pour l'affichage
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
      next: (contact: IContactCompany) => {
        // préférer nom (puis nomabrege) puis fallback sur l'id si vide
        this.contactCompanyName = contact.nom ?? contact.nomabrege ?? String(contact.id);
      },
      error: (err: unknown) => {
        // si 404 ou autre erreur -> on laisse le nom null et on ne bloque pas l'édition
        this.contactCompanyName = null;
      },
    });
  }
}
