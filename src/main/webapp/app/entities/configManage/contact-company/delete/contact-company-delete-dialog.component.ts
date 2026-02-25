import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

import { IContactCompany } from '../contact-company.model';
import { ContactCompanyService } from '../service/contact-company.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './contact-company-delete-dialog.component.html',
})
export class ContactCompanyDeleteDialogComponent {
  contactCompany?: IContactCompany;

  constructor(
    protected contactCompanyService: ContactCompanyService,
    protected activeModal: NgbActiveModal,
    protected translate: TranslateService
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  /**
   * ⚠️ IMPORTANT
   * Ici on NE SUPPRIME PAS physiquement.
   * On applique la logique métier : markAsDelated (soft delete)
   */
  confirmDelete(id: number): void {
    this.contactCompanyService.markAsDelated(id).subscribe({
      next: () => {
        // On garde le même event pour recharger la liste
        this.activeModal.close(ITEM_DELETED_EVENT);
      },
      error: err => {
        console.error('Erreur lors du changement d’état (delated)', err);
        const msg =
          this.translate.instant('correspCareApp.configManageContactCompany.errors.cannotChangeDelated') ||
          this.translate.instant('correspCareApp.contactCompany.errors.cannotChangeDelated') ||
          "Erreur lors du changement d'état.";
        // message utilisateur simple (remplace par toast/snackbar si tu utilises un utilitaire)
        alert(msg);
      },
    });
  }
}
