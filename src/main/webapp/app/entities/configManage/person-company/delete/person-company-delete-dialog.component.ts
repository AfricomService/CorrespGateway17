import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

import { IPersonCompany } from '../person-company.model';
import { PersonCompanyService } from '../service/person-company.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './person-company-delete-dialog.component.html',
})
export class PersonCompanyDeleteDialogComponent {
  // la modal reçoit la personne depuis le component parent via "componentInstance.personCompany = ..."
  @Input() personCompany?: IPersonCompany;

  constructor(
    protected personCompanyService: PersonCompanyService,
    protected activeModal: NgbActiveModal,
    protected translate: TranslateService // injection pour afficher messages traduits
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    console.log('PersonCompanyDeleteDialogComponent.confirmDelete id=', id);
    this.personCompanyService.delate(id).subscribe({
      next: () => {
        // ferme le modal et renvoie un payload contenant l'event + l'id supprimé
        this.activeModal.close({ event: ITEM_DELETED_EVENT, id });
      },
      error: err => {
        console.error('Erreur lors de la suppression personCompany', err);

        // Message d'erreur traduit si la clé existe, sinon fallback en FR/EN.
        // Clefs possibles (à adapter/ajouter dans tes fichiers i18n si non présentes) :
        // 'correspCareApp.configManagePersonCompany.messages.unknownSaveError'
        // 'correspCareApp.configManagePersonCompany.messages.processingError'
        const translated =
          this.translate.instant('correspCareApp.configManagePersonCompany.messages.unknownSaveError') ||
          this.translate.instant('correspCareApp.configManagePersonCompany.messages.processingError') ||
          this.translate.instant('correspCareApp.contactCompany.errors.toggleFailed') ||
          'Erreur lors de la suppression.';

        // Affiche une alerte simple — tu peux remplacer par un jhi-alert global ou toast si tu en as un
        try {
          alert(translated);
        } catch (e) {
          // si alert échoue, on ignore
          console.warn('Unable to show translated alert', e);
        }

        this.activeModal.dismiss(err);
      },
    });
  }
}
