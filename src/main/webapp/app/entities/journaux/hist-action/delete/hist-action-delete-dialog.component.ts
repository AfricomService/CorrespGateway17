import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IHistAction } from '../hist-action.model';
import { HistActionService } from '../service/hist-action.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './hist-action-delete-dialog.component.html',
})
export class HistActionDeleteDialogComponent {
  histAction?: IHistAction;

  constructor(protected histActionService: HistActionService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.histActionService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
