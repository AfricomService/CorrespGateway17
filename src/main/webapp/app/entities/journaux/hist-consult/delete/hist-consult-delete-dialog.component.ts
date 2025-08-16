import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IHistConsult } from '../hist-consult.model';
import { HistConsultService } from '../service/hist-consult.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './hist-consult-delete-dialog.component.html',
})
export class HistConsultDeleteDialogComponent {
  histConsult?: IHistConsult;

  constructor(protected histConsultService: HistConsultService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.histConsultService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
