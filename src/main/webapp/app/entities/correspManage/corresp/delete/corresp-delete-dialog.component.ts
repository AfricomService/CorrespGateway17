import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ICorresp } from '../corresp.model';
import { CorrespService } from '../service/corresp.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './corresp-delete-dialog.component.html',
})
export class CorrespDeleteDialogComponent {
  corresp?: ICorresp;

  constructor(protected correspService: CorrespService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.correspService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
