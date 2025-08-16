import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { INumsequentielle } from '../numsequentielle.model';
import { NumsequentielleService } from '../service/numsequentielle.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './numsequentielle-delete-dialog.component.html',
})
export class NumsequentielleDeleteDialogComponent {
  numsequentielle?: INumsequentielle;

  constructor(protected numsequentielleService: NumsequentielleService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.numsequentielleService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
