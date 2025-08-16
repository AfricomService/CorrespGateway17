import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IModelNotif } from '../model-notif.model';
import { ModelNotifService } from '../service/model-notif.service';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';

@Component({
  templateUrl: './model-notif-delete-dialog.component.html',
})
export class ModelNotifDeleteDialogComponent {
  modelNotif?: IModelNotif;

  constructor(protected modelNotifService: ModelNotifService, protected activeModal: NgbActiveModal) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.modelNotifService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
