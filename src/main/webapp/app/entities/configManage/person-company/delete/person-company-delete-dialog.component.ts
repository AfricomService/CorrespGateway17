import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IPersonCompany } from '../person-company.model';
import { PersonCompanyService } from '../service/person-company.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './person-company-delete-dialog.component.html',
})
export class PersonCompanyDeleteDialogComponent {
  personCompany?: IPersonCompany;

  constructor(protected personCompanyService: PersonCompanyService, protected activeModal: NgbActiveModal) {}

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
        this.activeModal.dismiss(err);
      },
    });
  }
}
