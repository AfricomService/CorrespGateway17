import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IConnecteur } from '../connecteur.model';
import { ConnecteurService } from '../service/connecteur.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './connecteur-delete-dialog.component.html',
})
export class ConnecteurDeleteDialogComponent {
  connecteur?: IConnecteur;

  constructor(protected connecteurService: ConnecteurService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.connecteurService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
