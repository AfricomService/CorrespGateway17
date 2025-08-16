import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IBordereaux } from '../bordereaux.model';
import { BordereauxService } from '../service/bordereaux.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './bordereaux-delete-dialog.component.html',
})
export class BordereauxDeleteDialogComponent {
  bordereaux?: IBordereaux;

  constructor(protected bordereauxService: BordereauxService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.bordereauxService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
